import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export function ChatPanel({ projectId, userId, lang }: { projectId: string, userId: string, lang: 'es' | 'en' }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat_${projectId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    await supabase.from('messages').insert([
      { project_id: projectId, sender_id: userId, content }
    ]);
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Cargando...</div>;

  return (
    <div className="flex flex-col h-[500px] border border-border-base rounded-xl overflow-hidden bg-bg-base">
      <div className="bg-bg-muted border-b border-border-base p-4">
        <h3 className="font-bold text-text-base">{lang === 'es' ? 'Chat del Proyecto' : 'Project Chat'}</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-text-muted mt-8">
            {lang === 'es' ? 'No hay mensajes aún.' : 'No messages yet.'}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? 'bg-corporate-600 text-white rounded-br-none' : 'bg-bg-muted text-text-base border border-border-base rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-bg-base border-t border-border-base flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={lang === 'es' ? 'Escribe un mensaje...' : 'Type a message...'}
          className="flex-1 px-4 py-2 bg-bg-muted text-text-base border border-border-base rounded-full focus:outline-none focus:border-corporate-600"
        />
        <button 
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-corporate-900 text-bg-base p-2 rounded-full hover:bg-corporate-800 disabled:opacity-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
}
