import React, { useState } from 'react';
import { MessageSquare, Trash2, User, Phone, Calendar, Send, CheckCircle2 } from 'lucide-react';
import { useBarberStore } from '../store';

const Suggestions: React.FC = () => {
  const { suggestions, deleteSuggestion, updateSuggestion } = useBarberStore();
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;
    try {
      await updateSuggestion(id, { 
        reply: replyText[id],
        status: 'read' 
      });
      setReplyText(prev => ({ ...prev, [id]: '' }));
      alert("Resposta enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar resposta.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white font-display italic tracking-tight">Sugestões de Membros</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Feedback direto do seu portal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((sug) => (
          <div key={sug.id} className="cartao-vidro rounded-[2.5rem] p-8 border-white/5 relative group hover:border-[#D4AF37]/40 transition-all duration-500">
             <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><User size={24}/></div>
                   <div>
                      <h3 className="text-lg font-black italic text-white">{sug.clientName}</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2"><Phone size={10}/> {sug.clientPhone}</p>
                   </div>
                </div>
                <button onClick={() => deleteSuggestion(sug.id)} className="p-3 text-zinc-700 hover:text-red-500 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
             </div>
             
             <div className="bg-white/5 p-6 rounded-2xl border border-white/5 italic text-sm text-zinc-300 mb-6">
                "{sug.text}"
             </div>

             {/* CAMPO DE RESPOSTA */}
             <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={replyText[sug.id] || sug.reply || ''}
                    onChange={(e) => setReplyText({ ...replyText, [sug.id]: e.target.value })}
                    placeholder="Escreva uma resposta..."
                    className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#D4AF37]/50 text-xs text-white resize-none"
                    rows={2}
                  />
                  <button onClick={() => handleReply(sug.id)} className="absolute bottom-3 right-3 p-2 bg-[#D4AF37] text-black rounded-lg hover:scale-110 transition-all">
                    <Send size={14} />
                  </button>
                </div>
                {sug.reply && (
                  <div className="flex items-center gap-2 px-2 text-[#D4AF37]">
                    <CheckCircle2 size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Respondido</span>
                  </div>
                )}
             </div>

             <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> {sug.date}</span>
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center text-[#D4AF37]/30"><MessageSquare size={14}/></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suggestions;
