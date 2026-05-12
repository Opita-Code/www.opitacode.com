import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function DeliverablesPanel({ projectId, lang }: { projectId: string, lang: 'es' | 'en' }) {
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliverables();
  }, [projectId]);

  const fetchDeliverables = async () => {
    const { data, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (data) setDeliverables(data);
    setLoading(false);
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('project_files')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert(lang === 'es' ? 'Error al generar el enlace de descarga.' : 'Error generating download link.');
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Cargando...</div>;

  return (
    <div className="border border-border-base rounded-xl overflow-hidden bg-bg-base">
      <div className="bg-bg-muted border-b border-border-base p-4">
        <h3 className="font-bold text-text-base">{lang === 'es' ? 'Entregables del Proyecto' : 'Project Deliverables'}</h3>
      </div>
      
      <div className="p-4">
        {deliverables.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            {lang === 'es' ? 'Aún no hay archivos entregables.' : 'No deliverable files yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-border-base">
            {deliverables.map((file) => (
              <li key={file.id} className="py-3 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-corporate-50 dark:bg-corporate-900/20 text-corporate-600 dark:text-corporate-400 rounded">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-base">{file.file_name}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(file.created_at).toLocaleDateString()}
                      {file.file_size && ` • ${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownload(file.file_path, file.file_name)}
                  className="px-3 py-1.5 text-sm bg-bg-muted hover:bg-corporate-100 dark:hover:bg-corporate-900 text-corporate-700 dark:text-corporate-300 font-medium rounded border border-border-base transition-colors"
                >
                  {lang === 'es' ? 'Descargar' : 'Download'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
