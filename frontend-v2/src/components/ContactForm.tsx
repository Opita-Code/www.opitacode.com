import React, { useState } from 'react';
import { t, type Lang } from '../i18n';

const API_URL = '/contact';

interface ContactFormProps {
  lang: Lang;
}

interface FormData {
  name: string;
  email: string;
  message: string;
  // Honeypot field — bots fill it, humans don't see it (CSS hidden)
  website: string;
}

export function ContactForm({ lang }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const labels = {
    name: t(lang, 'contact.name-label'),
    email: t(lang, 'contact.email-label'),
    message: t(lang, 'contact.message-label'),
    submit: t(lang, 'contact.submit'),
    loading: t(lang, 'contact.loading'),
    success: t(lang, 'contact.success'),
    sendAnother: t(lang, 'contact.send-another'),
    errorDefault: t(lang, 'contact.error-default'),
    errorHoneypot: t(lang, 'contact.error-honeypot'),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-spam: honeypot field must be empty (bots fill it)
    if (formData.website) {
      setErrorMessage(labels.errorHoneypot);
      setStatus('error');
      return;
    }

    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '', website: '' });

        // Telemetry: track successful contact submission
        try {
          const telemetryApi = 'https://api.opitacode.com/core/events/ingest';
          let sid = sessionStorage.getItem('opita_session_id');
          if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('opita_session_id', sid); }
          fetch(telemetryApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sid,
              productId: 'opitacode-web',
              events: [{
                type: 'contact_submitted',
                source: 'landing',
                timestamp: new Date().toISOString(),
                data: {
                  email_domain: formData.email.split('@')[1] || '',
                  has_message: formData.message.length > 0,
                  url: window.location.pathname,
                  referrer: document.referrer || '',
                },
              }],
            }),
            keepalive: true,
          }).catch(() => {});
        } catch { /* telemetry is best-effort */ }
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error || labels.errorDefault);
        setStatus('error');
      }
    } catch {
      setErrorMessage(labels.errorDefault);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6 text-center">
        <svg className="w-8 h-8 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="font-medium">{labels.success}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-green-700 hover:text-green-900 underline"
        >
          {labels.sendAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left max-w-md mx-auto" noValidate>
      {status === 'error' && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Honeypot field — hidden via CSS, ignored by humans, fills by bots */}
      <div className="absolute opacity-0 pointer-events-none -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {labels.name}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          minLength={2}
          autoComplete="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50"
          disabled={status === 'loading'}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {labels.email}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50"
          disabled={status === 'loading'}
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          {labels.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          minLength={10}
          autoComplete="off"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50"
          disabled={status === 'loading'}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="bg-corporate-900 text-bg-base px-6 py-3 rounded-md font-medium hover:bg-corporate-800 transition-colors mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {labels.loading}
          </>
        ) : (
          labels.submit
        )}
      </button>
    </form>
  );
}
