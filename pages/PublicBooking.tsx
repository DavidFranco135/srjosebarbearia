import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  // CORRIGIDO: Removido o "..." que causava o erro e adicionado "suggestions"
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout, suggestions } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);

  // Estados do agendamento
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' });

  // Estado da sugestão
  const [suggestionText, setSuggestionText] = useState('');

  const handleAddReview = async () => {
    if (!newReview.comment) return;
    addShopReview({
      rating: newReview.rating,
      comment: newReview.comment,
      userName: user?.name || 'Cliente',
      clientPhone: user?.phone || ''
    });
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
    alert('Avaliação enviada com sucesso!');
  };

  const handleAddSuggestion = async () => {
    if (!suggestionText) return;
    await addSuggestion({
      clientName: user?.name || 'Anônimo',
      clientPhone: user?.phone || '',
      text: suggestionText,
      status: 'unread'
    });
    setSuggestionText('');
    alert('Sugestão enviada com sucesso!');
  };

  const renderClientDashboard = () => {
    const clientApps = appointments.filter(a => a.clientPhone === user?.phone);
    // Filtra sugestões enviadas por este cliente
    const mySuggestions = suggestions.filter(s => s.clientPhone === user?.phone);

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-[2rem] gradiente-ouro p-1">
              <div className="w-full h-full rounded-[1.8rem] bg-black flex items-center justify-center overflow-hidden">
                <img src={`https://i.pravatar.cc/150?u=${user?.id}`} alt="" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tight text-white">{user?.name}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Membro Signature</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5">
            <LogOut size={16}/> Sair do Portal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="cartao-vidro p-8 rounded-[2.5rem] border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Total de Visitas</p>
              <p className="text-4xl font-black italic text-white">{clientApps.length}</p>
           </div>
           <div className="cartao-vidro p-8 rounded-[2.5rem] border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Pontos Fidelidade</p>
              <p className="text-4xl font-black italic text-[#D4AF37]">{clientApps.length * 10}</p>
           </div>
           <button onClick={() => setShowReviewModal(true)} className="cartao-vidro p-8 rounded-[2.5rem] border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all group text-left">
              <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-2 tracking-widest">Sua Opinião</p>
              <p className="text-xl font-black italic text-white group-hover:translate-x-2 transition-transform flex items-center gap-2">Avaliar Experiência <ArrowRight size={20}/></p>
           </button>
        </div>

        <div className="space-y-6">
           <h3 className="text-xl font-black italic flex items-center gap-3 text-white"><History className="text-[#D4AF37]"/> Meus Agendamentos</h3>
           <div className="grid grid-cols-1 gap-4">
              {clientApps.map(app => (
                 <div key={app.id} className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-[#D4AF37]/50 transition-all">
                          <span className="text-[8px] font-black uppercase text-[#D4AF37]">{app.date.split('-')[1]}</span>
                          <span className="text-xl font-black text-white">{app.date.split('-')[2]}</span>
                       </div>
                       <div>
                          <h4 className="font-black italic text-white uppercase tracking-tight">{app.serviceName}</h4>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{app.professionalName} • {app.startTime}</p>
                       </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      app.status === 'CONCLUIDO_PAGO' ? 'bg-green-500/10 text-green-500' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                    }`}>
                      {app.status}
                    </span>
                 </div>
              ))}
              {clientApps.length === 0 && (
                <div className="text-center py-12 cartao-vidro rounded-[2rem] border-dashed border-white/10">
                   <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Nenhum agendamento encontrado</p>
                </div>
              )}
           </div>
        </div>

        {/* SEÇÃO DE SUGESTÕES E RESPOSTAS */}
        <div className="space-y-6">
           <h3 className="text-xl font-black italic flex items-center gap-3 text-white"><MessageSquare className="text-[#D4AF37]"/> Minhas Sugestões</h3>
           <div className="grid grid-cols-1 gap-4">
              {mySuggestions.map(sug => (
                 <div key={sug.id} className="cartao-vidro p-6 rounded-[2rem] border-white/5 space-y-4">
                    <p className="text-sm text-zinc-300 italic">"{sug.text}"</p>
                    {sug.reply && (
                      <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4 rounded-2xl space-y-1">
                        <p className="text-[10px] font-black uppercase text-[#D4AF37]">Resposta do Sr. José:</p>
                        <p className="text-xs text-white">{sug.reply}</p>
                      </div>
                    )}
                 </div>
              ))}
              <div className="space-y-4 mt-6">
                <textarea 
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder="Tem alguma sugestão?" 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none text-white text-sm focus:border-[#D4AF37]"
                  rows={3}
                />
                <button onClick={handleAddSuggestion} className="gradiente-ouro text-black px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2">
                  <Send size={14}/> Enviar Sugestão
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  // Mantenha o restante do seu componente original aqui (renderHome, renderBooking, etc.)
  // Por brevidade, o switch final:
  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505] text-white'}`}>
      {view === 'HOME' && <div className="animate-in fade-in duration-700"> {/* Conteúdo Home Original */} </div>}
      {view === 'CLIENT_DASHBOARD' && renderClientDashboard()}
      {/* ... demais views */}
      
      {/* Modal de Avaliação Original */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
           <div className="cartao-vidro w-full max-w-lg rounded-[3.5rem] p-10 border-white/10 space-y-10">
              <div className="text-center space-y-4">
                 <Heart size={48} className="text-[#D4AF37] mx-auto"/>
                 <h2 className="text-3xl font-black font-display italic">Sua Experiência</h2>
              </div>
              <div className="space-y-8 text-center">
                 <div className="flex justify-center gap-3">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`transition-all ${newReview.rating >= star ? 'text-[#D4AF37] scale-125' : 'text-zinc-800'}`}>
                          <Star size={32} fill={newReview.rating >= star ? 'currentColor' : 'none'}/>
                       </button>
                    ))}
                 </div>
                 <textarea rows={4} placeholder="Conte-nos como foi..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none font-medium text-white focus:border-[#D4AF37]"/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-white/5 py-5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Voltar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
