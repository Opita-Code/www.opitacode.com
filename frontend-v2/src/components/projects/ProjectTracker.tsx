import React from 'react';

type ProjectStatus = 'draft' | 'submitted' | 'negotiating' | 'approved' | 'in_progress' | 'review' | 'delivered';

const STAGES: { id: ProjectStatus, labelEs: string, labelEn: string }[] = [
  { id: 'draft', labelEs: 'Borrador', labelEn: 'Draft' },
  { id: 'submitted', labelEs: 'Enviada', labelEn: 'Submitted' },
  { id: 'negotiating', labelEs: 'Negociando', labelEn: 'Negotiating' },
  { id: 'approved', labelEs: 'Aprobada', labelEn: 'Approved' },
  { id: 'in_progress', labelEs: 'En Progreso', labelEn: 'In Progress' },
  { id: 'review', labelEs: 'Revisión', labelEn: 'Review' },
  { id: 'delivered', labelEs: 'Entregado', labelEn: 'Delivered' }
];

export function ProjectTracker({ currentStatus, lang }: { currentStatus: ProjectStatus, lang: 'es' | 'en' }) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStatus);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="w-full py-6">
      <div className="relative">
        {/* Track Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border-base rounded-full z-0"></div>
        {/* Progress Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-corporate-600 dark:bg-corporate-500 rounded-full z-0 transition-all duration-500"
          style={{ width: `${(safeIndex / (STAGES.length - 1)) * 100}%` }}
        ></div>

        <div className="relative z-10 flex justify-between">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= safeIndex;
            const isCurrent = idx === safeIndex;

            return (
              <div key={stage.id} className="flex flex-col items-center group">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isCompleted 
                    ? 'bg-corporate-600 border-corporate-600 dark:bg-corporate-500 dark:border-corporate-500' 
                    : 'bg-bg-base border-border-base'
                  }
                  ${isCurrent ? 'ring-4 ring-corporate-100 dark:ring-corporate-900/50' : ''}
                `}>
                  {isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs mt-2 font-medium absolute -bottom-8 w-max text-center transition-colors
                  ${isCompleted ? 'text-text-base' : 'text-text-muted'}
                `}>
                  {lang === 'es' ? stage.labelEs : stage.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
