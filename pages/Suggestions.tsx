import React, { useState } from 'react';
import { MessageSquare, Trash2, User, Phone, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { useBarberStore } from '../store';

const Suggestions: React.FC = () => {
  const { suggestions, deleteSuggestion, updateSuggestion } = useBarberStore();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;
    await updateSuggestion(id, { reply: replyText[id], status: 'read' });
    setReplyText(prev => ({ ...prev, [id]: '' }));
    alert("Resposta enviada!");
  };

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-3xl font-black text-white italic">Sugestões de Membros</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((sug) => (
          <div key={sug.id} className="cartao-vidro p-8 rounded-[2.5rem] border-white/5">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]"><User size={20}/></div>
                <div><h3 className="text-white font-bold">{sug.clientName}</h3><p className="text-xs text-zinc-500">{sug.clientPhone}</p></div>
              </div>
              <button onClick={() => deleteSuggestion(sug.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
            </div>
            <p className="text-zinc-300 italic mb-6">"{sug.text}"</p>
            <div className="relative">
              <textarea 
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none" 
                placeholder="Responder..."
                value={replyText[sug.id] || sug.reply || ''}
                onChange={(e) => setReplyText({...replyText, [sug.id]: e.target.value})}
              />
              <button onClick={() => handleReply(sug.id)} className="absolute right-2 bottom-2 p-2 bg-[#D4AF37] rounded-lg text-black"><Send size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
