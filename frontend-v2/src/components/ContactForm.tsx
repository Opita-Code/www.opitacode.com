import React, { useState } from 'react';

const API_URL = '/contact';

export function ContactForm({ lang }: { lang: 'es' | 'en' }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const t = {
    name: lang === 'es' ? 'Tu nombre' : 'Your name',
    email: lang === 'es' ? 'Tu correo electrónico' : 'Your email',
    message: lang === 'es' ? '¿En qué te podemos ayudar?' : 'How can we help?',
    submit: lang === 'es' ? 'Enviar Mensaje' : 'Send Message',
    loading: lang === 'es' ? 'Enviando...' : 'Sending...',
    success: lang === 'es' ? '¡Mensaje enviado con éxito! Te responderemos pronto.' : 'Message sent successfully! We will get back to you soon.',
    errorDefault: lang === 'es' ? 'Error al enviar el mensaje. Intenta de nuevo.' : 'Error sending message. Please try again.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error || t.errorDefault);
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage(t.errorDefault);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6 text-center">
        <svg className="w-8 h-8 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="font-medium">{t.success}</p>
        <button 
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm font-medium text-green-700 hover:text-green-900 underline"
        >
          {lang === 'es' ? 'Enviar otro mensaje' : 'Send another message'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left max-w-md mx-auto">
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 text-sm">
          {errorMessage}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          {lang === 'es' ? 'Nombre' : 'Name'}
        </label>
        <input 
          type="text" 
          id="name" 
          required
          minLength={2}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50" 
          placeholder={t.name}
          disabled={status === 'loading'}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
        <input 
          type="email" 
          id="email" 
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50" 
          placeholder={t.email} 
          disabled={status === 'loading'}
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          {lang === 'es' ? 'Mensaje' : 'Message'}
        </label>
        <textarea 
          id="message" 
          rows={4} 
          required
          minLength={10}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50" 
          placeholder={t.message}
          disabled={status === 'loading'}
        ></textarea>
      </div>
      <button 
        type="submit" 
        disabled={status === 'loading'}
        className="bg-corporate-900 text-bg-base px-6 py-3 rounded-md font-medium hover:bg-corporate-800 transition-colors mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t.loading}
          </>
        ) : (
          t.submit
        )}
      </button>
    </form>
  );
}
