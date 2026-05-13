import React from 'react';

export function ChatPanel({ projectId, userId, lang }: { projectId: string, userId: string, lang: 'es' | 'en' }) {
  return (
    <div className="flex flex-col h-[500px] border border-border-base rounded-xl overflow-hidden bg-bg-base items-center justify-center p-8">
      <div className="bg-bg-muted p-6 rounded-xl border border-border-base text-center">
        <h3 className="text-xl font-bold text-text-base mb-2">
          {lang === 'es' ? 'Chat en mantenimiento' : 'Chat under maintenance'}
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
