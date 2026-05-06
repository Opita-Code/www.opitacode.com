// contact-form.test.mjs — Unit tests for contact-form Lambda handler
// Run: node --test backend/tests/contact-form.test.mjs

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const importHandler = () => import('../src/contact-form.mjs');

describe('Contact Form Lambda', () => {

  describe('validate() — input validation', () => {
    it('should return 200 for valid input', async () => {
      const mod = await importHandler();
      // Inject a mock SES client that succeeds
      mod.__setSESClient({
        async send() { return { MessageId: 'mock-msg-001' }; },
      });
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          message: 'Hola, me interesan sus servicios de desarrollo.',
        }),
      };
      const res = JSON.parse((await mod.handler(event)).body);
      assert.equal(res.ok, true);
    });

    it('should return 400 when name is missing', async () => {
      const mod = await importHandler();
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          email: 'juan@example.com',
          message: 'Hola, me interesan sus servicios de desarrollo.',
        }),
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.ok(body.error.includes('nombre'));
    });

    it('should return 400 when email is invalid', async () => {
      const mod = await importHandler();
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          name: 'Juan Pérez',
          email: 'not-an-email',
          message: 'Hola, me interesan sus servicios de desarrollo.',
        }),
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.ok(body.error.includes('correo'));
    });

    it('should return 400 when message is too short', async () => {
      const mod = await importHandler();
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          name: 'Juan Pérez',
          email: 'juan@example.com',
          message: 'Corto',
        }),
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.body);
      assert.ok(body.error.includes('mensaje'));
    });

    it('should reject empty body', async () => {
      const mod = await importHandler();
      const event = {
        httpMethod: 'POST',
        body: '{}',
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 400);
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 after exceeding rate limit', async () => {
      const mod = await importHandler();
      // Inject mock SES so rate-limit requests don't fail on SES
      mod.__setSESClient({
        async send() { return { MessageId: 'mock-msg-001' }; },
      });

      // Send MAX_REQUESTS + 1 requests from same IP
      const baseEvent = {
        httpMethod: 'POST',
        headers: { 'X-Forwarded-For': '192.168.1.1' },
        requestContext: { identity: { sourceIp: '192.168.1.1' } },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Este es un mensaje de prueba para verificar el rate limiting.',
        }),
      };

      // Send 5 valid requests (they should succeed — mock SES returns ok)
      for (let i = 0; i < 5; i++) {
        const res = await mod.handler(baseEvent);
        assert.notEqual(res.statusCode, 429);
      }

      // 6th request should be rate limited
      const res = await mod.handler(baseEvent);
      assert.equal(res.statusCode, 429);
      const body = JSON.parse(res.body);
      assert.ok(body.error.includes('Demasiados'));
    });

    it('should allow requests from different IPs', async () => {
      const mod = await importHandler();
      // Inject mock SES
      mod.__setSESClient({
        async send() { return { MessageId: 'mock-msg-001' }; },
      });

      const makeEvent = (ip) => ({
        httpMethod: 'POST',
        headers: { 'X-Forwarded-For': ip },
        requestContext: { identity: { sourceIp: ip } },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Mensaje de prueba para IP diferente.',
        }),
      });

      const res1 = await mod.handler(makeEvent('10.0.0.1'));
      const res2 = await mod.handler(makeEvent('10.0.0.2'));
      const res3 = await mod.handler(makeEvent('10.0.0.3'));

      assert.notEqual(res1.statusCode, 429);
      assert.notEqual(res2.statusCode, 429);
      assert.notEqual(res3.statusCode, 429);
    });
  });

  describe('CORS preflight', () => {
    it('should return 204 for OPTIONS requests', async () => {
      const mod = await importHandler();
      const event = { httpMethod: 'OPTIONS' };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 204);
    });
  });

  describe('SES error handling', () => {
    it('should return 200 when SES succeeds (mock)', async () => {
      const mod = await importHandler();
      mod.__setSESClient({
        async send() { return { MessageId: 'mock-msg-002' }; },
      });
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Este es un mensaje para probar SES exitoso.',
        }),
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.body);
      assert.equal(body.ok, true);
    });

    it('should return 500 when SES fails', async () => {
      const mod = await importHandler();
      // Inject a mock that throws
      mod.__setSESClient({
        async send() { throw new Error('SES simulation error'); },
      });
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          message: 'Este es un mensaje para probar error de SES.',
        }),
      };
      const res = await mod.handler(event);
      assert.equal(res.statusCode, 500);
    });
  });

});
