import React, { useState, useEffect } from 'react';

export function AuthForm({ lang }: { lang: 'es' | 'en' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam) {
      let errorMsg = lang === 'es' ? 'Ocurrió un error con tu enlace.' : 'An error occurred with your link.';
      if (errorParam === 'invalid_token') {
        errorMsg = lang === 'es' ? 'El enlace mágico es inválido o ha expirado.' : 'The magic link is invalid or expired.';
      } else if (errorParam === 'missing_token') {
        errorMsg = lang === 'es' ? 'No se proporcionó un token de acceso.' : 'No access token was provided.';
      }
      setMessage({ type: 'error', text: errorMsg });
      
      // Clean up URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [lang]);

  const t = {
    title: lang === 'es' ? 'Acceso a Proyectos' : 'Projects Access',
    subtitle: lang === 'es' ? 'Ingresa tu correo y te enviaremos un enlace mágico para iniciar sesión.' : 'Enter your email and we will send you a magic link to sign in.',
    email: lang === 'es' ? 'Correo electrónico' : 'Email address',
    button: lang === 'es' ? 'Enviar enlace mágico' : 'Send magic link',
    loading: lang === 'es' ? 'Enviando...' : 'Sending...',
    success: lang === 'es' ? '¡Revisa tu correo! Te hemos enviado el enlace.' : 'Check your email! We sent you the link.',
    error: lang === 'es' ? 'Ocurrió un error. Inténtalo de nuevo.' : 'An error occurred. Please try again.',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const apiUrl = import.meta.env.PUBLIC_AUTH_API_URL || 'https://api.opitacode.com';
      const response = await fetch(`${apiUrl}/auth/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t.error);
      }

      setMessage({ type: 'success', text: t.success });
      setEmail('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t.error });
    }
    
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-bg-base border border-border-base rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text-base mb-2">{t.title}</h2>
        <p className="text-text-muted">{t.subtitle}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-md mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="auth-email" className="block text-sm font-medium mb-1 text-text-base">{t.email}</label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:outline-none focus:border-corporate-900 disabled:opacity-50"
            placeholder="tucorreo@empresa.com"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-corporate-900 text-bg-base px-6 py-3 rounded-md font-medium hover:bg-corporate-800 transition-colors mt-2 disabled:opacity-70 flex justify-center items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-bg-base" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.loading}
            </>
          ) : (
            t.button
          )}
        </button>
      </form>
    </div>
  );
}
