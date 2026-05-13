import React from 'react';

export function DeliverablesPanel({ projectId, lang }: { projectId: string, lang: 'es' | 'en' }) {
  return (
    <div className="border border-border-base rounded-xl overflow-hidden bg-bg-base items-center justify-center p-8 flex flex-col">
      <div className="bg-bg-muted p-6 rounded-xl border border-border-base text-center w-full">
        <h3 className="text-xl font-bold text-text-base mb-2">
          {lang === 'es' ? 'Entregables en mantenimiento' : 'Deliverables under maintenance'}
        </h3>
        <p className="text-text-muted">
          {lang === 'es' 
            ? 'Estamos migrando este panel al nuevo sistema. Estará disponible pronto.' 
            : 'We are migrating this panel to the new system. It will be available soon.'}
        </p>
      </div>
    </div>
  );
}
