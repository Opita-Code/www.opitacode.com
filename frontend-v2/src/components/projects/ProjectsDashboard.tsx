import React, { useState, useEffect } from 'react';
import { AuthForm } from './AuthForm';

export function ProjectsDashboard({ lang }: { lang: 'es' | 'en' }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const apiUrl = import.meta.env.PUBLIC_AUTH_API_URL || 'https://api.opitacode.com';
        const res = await fetch(`${apiUrl}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSession({ user: data.user });
          fetchProjects(); // Temporary: may need backend API to fetch securely without Supabase Auth
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const fetchProjects = async () => {
    try {
      const apiUrl = import.meta.env.PUBLIC_AUTH_API_URL || 'https://api.opitacode.com';
      const res = await fetch(`${apiUrl}/projects`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error('Error fetching projects', e);
    }
    setLoading(false);
  };

  const createNewProposal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;

    try {
      const apiUrl = import.meta.env.PUBLIC_AUTH_API_URL || 'https://api.opitacode.com';
      const res = await fetch(`${apiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ title, description })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server error');
      }

      const data = await res.json();
      setProjects([...data, ...projects]);
      setShowForm(false);
    } catch (error: any) {
      alert(lang === 'es' ? 'Hubo un error al crear la propuesta: ' + error.message : 'Error creating proposal: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-corporate-900 dark:text-corporate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!session) {
    return <AuthForm lang={lang} />;
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-border-base pb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-base">
            {lang === 'es' ? 'Mis Proyectos' : 'My Projects'}
          </h1>
          <p className="text-text-muted mt-1">
            {session.user.email}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-corporate-900 text-bg-base px-4 py-2 rounded-md font-medium hover:bg-corporate-800 transition-colors text-sm"
          >
            {showForm ? (lang === 'es' ? 'Cancelar' : 'Cancel') : (lang === 'es' ? 'Nueva Propuesta' : 'New Proposal')}
          </button>
          <button 
            onClick={async () => {
              const apiUrl = import.meta.env.PUBLIC_AUTH_API_URL || 'https://api.opitacode.com';
              await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
              setSession(null);
            }}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
          >
            {lang === 'es' ? 'Cerrar Sesión' : 'Sign Out'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-bg-muted border border-border-base p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-xl font-bold text-text-base mb-4">{lang === 'es' ? 'Crear Propuesta de Proyecto' : 'Create Project Proposal'}</h2>
          <form onSubmit={createNewProposal} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text-base">{lang === 'es' ? 'Título del Proyecto' : 'Project Title'}</label>
              <input name="title" type="text" required className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:border-corporate-900" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text-base">{lang === 'es' ? 'Descripción y Requerimientos' : 'Description & Requirements'}</label>
              <textarea name="description" rows={4} required className="w-full px-4 py-2 bg-bg-base text-text-base border border-border-base rounded-md focus:border-corporate-900"></textarea>
            </div>
            <div className="flex justify-end">
              <button disabled={isCreating} type="submit" className="bg-corporate-900 text-bg-base px-6 py-2 rounded-md font-medium hover:bg-corporate-800 transition-colors disabled:opacity-70">
                {isCreating ? '...' : (lang === 'es' ? 'Enviar Propuesta' : 'Submit Proposal')}
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-bg-muted border border-border-base rounded-xl p-8 text-center text-text-muted">
          {lang === 'es' ? 'Aún no tienes proyectos.' : 'You have no projects yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-bg-base border border-border-base p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-text-base">{project.title}</h3>
                <span className="text-xs font-mono px-2 py-1 bg-corporate-100 text-corporate-800 dark:bg-corporate-900/50 dark:text-corporate-300 rounded border border-corporate-200 dark:border-corporate-800 uppercase">
                  {project.status}
                </span>
              </div>
              <p className="text-text-muted text-sm line-clamp-2 mb-4">{project.description || 'Sin descripción.'}</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-mono text-corporate-700 dark:text-corporate-400">
                  ${project.budget}
                </span>
                <button className="text-corporate-600 dark:text-corporate-400 hover:underline">
                  {lang === 'es' ? 'Ver Detalles →' : 'View Details →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
