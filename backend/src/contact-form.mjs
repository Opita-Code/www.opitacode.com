// contact-form.mjs — Lambda handler for contact form submissions
// POST /contact → validate → rate-limit → SES sendEmail
//
// Environment variables:
//   OWNER_EMAIL — recipient address for submissions (default: owner@opitacode.com)
//   RATE_LIMIT_WINDOW_MS — rate limit window in ms (default: 60000 = 1 minute)
//   RATE_LIMIT_MAX — max requests per window per IP (default: 5)

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Lazy getter for SES client — enables test injection via __setSESClient
let _sesClient = null;
function getSES() {
  if (!_sesClient) _sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
  return _sesClient;
}
// Test injection — export so tests can inject a mock
export function __setSESClient(client) { _sesClient = client; }

const OWNER_EMAIL   = process.env.OWNER_EMAIL || 'owner@opitacode.com';
const WINDOW_MS     = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQUESTS  = parseInt(process.env.RATE_LIMIT_MAX || '5', 10);

// In-memory rate limit store (Map<IP, { count, windowStart }>)
// Resets on cold start — acceptable for single-instance low-volume Lambda
const rateMap = new Map();

// ── Helpers ──

function validate(body) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  if (body.name && body.name.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.push('El correo electrónico es requerido');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    errors.push('El correo electrónico no es válido');
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length < 10) {
    errors.push('El mensaje debe tener al menos 10 caracteres');
  }
  if (body.message && body.message.length > 1000) {
    errors.push('El mensaje no puede exceder 1000 caracteres');
  }

  return errors;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || (now - entry.windowStart) > WINDOW_MS) {
    // New window
    rateMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://opitacode.com',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

// ── Handler ──

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(204, {});
  }

  // Parse body
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return response(400, { error: 'El cuerpo de la solicitud no es JSON válido' });
  }

  // Validate input
  const errors = validate(payload);
  if (errors.length > 0) {
    return response(400, { error: errors.join('. ') });
  }

  // Rate limit
  const ip = event.requestContext?.identity?.sourceIp
    || event.headers?.['X-Forwarded-For']?.split(',')[0]?.trim()
    || 'unknown';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return response(429, {
      error: 'Demasiados intentos. Intenta de nuevo en unos segundos.',
      retryAfter: rateCheck.retryAfter,
    });
  }

  // Send email via SES
  const name    = payload.name.trim();
  const email   = payload.email.trim();
  const message = payload.message.trim();

  const params = {
    Source: OWNER_EMAIL,
    Destination: { ToAddresses: [OWNER_EMAIL] },
    Message: {
      Subject: {
        Data: `[Opita Code] Nuevo contacto de ${name}`,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: [
            `Nombre:    ${name}`,
            `Email:     ${email}`,
            `IP:        ${ip}`,
            '---',
            message,
          ].join('\n'),
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    await getSES().send(new SendEmailCommand(params));
    return response(200, { ok: true });
  } catch (err) {
    console.error('SES send error:', err);
    return response(500, { error: 'Error al enviar el mensaje. Intenta de nuevo más tarde.' });
  }
}
