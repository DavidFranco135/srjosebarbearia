import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, Gift
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Professional, Client, Review } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout } = useBarberStore();
  
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selecao, setSelecao] = useState({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);

  const [suggestionText, setSuggestionText] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });

  // Sincronizar usuário logado
  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) setLoggedClient(client);
    }
  }, [user, clients]);

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING');
  };

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone) {
      alert("Por favor, preencha os dados obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const client = await addClient({ name: selecao.clientName, phone: selecao.clientPhone, email: selecao.clientEmail || '' });
      const serv = services.find(s => s.id === selecao.serviceId);
      
      await addAppointment({ 
        clientId: client.id, 
        clientName: client.name, 
        clientPhone: client.phone, 
        serviceId: selecao.serviceId, 
        serviceName: serv?.name || '', 
        professionalId: selecao.professionalId, 
        professionalName: professionals.find(p => p.id === selecao.professionalId)?.name || '', 
        date: selecao.date, 
        startTime: selecao.time, 
        endTime: selecao.time, 
        price: serv?.price || 0 
      }, true);
      setSuccess(true);
    } catch (err) { alert("Erro ao agendar."); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
      <div className="w-full max-w-lg p-12 rounded-[3rem] text-center cartao-vidro border-[#D4AF37]/30">
        <Check className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
        <h2 className="text-3xl font-black italic text-[#D4AF37] mb-4">RESERVA CONFIRMADA!</h2>
        <button onClick={() => window.location.reload()} className="bg-[#D4AF37] text-black px-10 py-4 rounded-xl font-black uppercase text-xs">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F3F4F6] text-zinc-900' : 'bg-[#050505] text-white'}`}>
      
      {view === 'HOME' && (
        <>
          {/* HEADER HERO */}
          <header className="relative h-[75vh] flex flex-col items-center justify-center overflow-hidden">
            <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-[0.3]" alt="Hero" />
            <div className="absolute top-6 right-6 z-50">
              <button onClick={() => setView('LOGIN')} className="gradiente-ouro text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                <History size={16}/> PORTAL DO MEMBRO
              </button>
            </div>
            <div className="relative z-10 text-center px-6">
              <div className="w-28 h-28 rounded-3xl gradiente-ouro p-1 mx-auto mb-6 shadow-2xl">
                <img src={config.logo} className="w-full h-full object-cover rounded-[1.6rem]" alt="Logo" />
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase">{config.name}</h1>
              <p className="text-[#D4AF37] text-sm font-black uppercase tracking-[0.5em] mt-4">{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-6 -mt-16 relative z-30 pb-32">
            
            {/* SERVIÇOS EM DESTAQUE (Carrossel) */}
            <section className="mb-24">
              <h2 className="text-2xl font-black italic mb-8 flex items-center gap-4">Destaques da Casa <div className="h-px flex-1 bg-white/10"></div></h2>
              <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide">
                {services.map(svc => (
                  <div key={svc.id} className="min-w-[300px] cartao-vidro border-white/5 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all hover:-translate-y-2">
                    <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={svc.name} /></div>
                    <div className="p-8">
                      <h3 className="text-2xl font-black italic">{svc.name}</h3>
                      <p className="text-2xl font-black mt-2 text-[#D4AF37]">R$ {svc.price.toFixed(2)}</p>
                      <button onClick={() => handleBookingStart(svc)} className="w-full mt-6 gradiente-ouro text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">RESERVAR AGORA</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SEÇÃO SOBRE NÓS (QUEM SOMOS) */}
            <section className="mb-24">
              <div className="cartao-vidro border-white/10 rounded-[4rem] overflow-hidden grid md:grid-cols-2 shadow-3xl">
                <div className="h-[400px] md:h-auto"><img src={config.aboutImage} className="w-full h-full object-cover" alt="Sobre" /></div>
                <div className="p-12 md:p-20 flex flex-col justify-center">
                  <h2 className="text-5xl font-black italic text-[#D4AF37] mb-8 leading-tight">{config.aboutTitle}</h2>
                  <p className="text-xl text-zinc-400 leading-relaxed font-medium">{config.aboutText}</p>
                </div>
              </div>
            </section>

            {/* PLANOS VIP */}
            {config.vipPlans && (
              <section className="mb-24">
                <h2 className="text-2xl font-black italic mb-10 flex items-center gap-4">Club Signature <div className="h-px flex-1 bg-white/10"></div></h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {config.vipPlans.map(plan => (
                    <div key={plan.id} className="p-10 rounded-[3rem] cartao-vidro border-[#D4AF37]/20 relative group overflow-hidden">
                      <Crown className="absolute -right-6 -top-6 w-32 h-32 text-[#D4AF37] opacity-10 group-hover:rotate-12 transition-transform" />
                      <h3 className="text-3xl font-black italic mb-4">{plan.name}</h3>
                      <p className="text-4xl font-black text-[#D4AF37] mb-8">R$ {plan.price.toFixed(2)} <span className="text-xs text-zinc-500 uppercase tracking-widest">/ {plan.duration}</span></p>
                      <ul className="space-y-4 mb-10">
                        {plan.benefits.map((b, i) => <li key={i} className="flex items-center gap-3 text-zinc-400"><Check size={18} className="text-[#D4AF37]"/> {b}</li>)}
                      </ul>
                      <button onClick={() => setView('LOGIN')} className="w-full py-5 rounded-2xl gradiente-ouro text-black font-black text-xs uppercase shadow-xl hover:scale-[1.02] transition-all">ASSINAR AGORA</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* REDES SOCIAIS (WhatsApp e Instagram) */}
            <section className="mb-24 text-center">
              <h2 className="text-2xl font-black italic mb-12">Nossa Comunidade</h2>
              <div className="flex flex-wrap justify-center gap-6">
                <a href={config.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white px-12 py-5 rounded-full font-black text-sm uppercase shadow-2xl hover:scale-105 transition-all">
                  <Instagram size={24}/> Siga no Instagram
                </a>
                <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-[#25D366] text-white px-12 py-5 rounded-full font-black text-sm uppercase shadow-2xl hover:scale-105 transition-all">
                  <MessageSquare size={24}/> Chama no WhatsApp
                </a>
              </div>
            </section>

            {/* PROFISSIONAIS (Com sistema de Likes) */}
            <section className="mb-24">
              <h2 className="text-2xl font-black italic mb-12 flex items-center gap-4">Artífices <div className="h-px flex-1 bg-white/10"></div></h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {professionals.map(prof => (
                  <div key={prof.id} className="text-center group">
                    <div className="relative inline-block mb-6">
                      <img 
                        src={prof.avatar} 
                        onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}
                        className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover border-2 border-[#D4AF37] cursor-pointer group-hover:scale-105 transition-transform shadow-2xl" 
                      />
                      <button 
                        onClick={() => likeProfessional(prof.id)}
                        className="absolute -bottom-2 -right-2 bg-white text-red-500 p-3 rounded-2xl shadow-xl flex items-center gap-2 font-black text-xs animate-in zoom-in"
                      >
                        <Heart size={16} fill="currentColor"/> {prof.likes || 0}
                      </button>
                    </div>
                    <h4 className="font-black text-lg">{prof.name}</h4>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">{prof.specialty}</p>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </>
      )}

      {/* LÓGICA DE LOGIN E PORTAL DO CLIENTE (Omitida aqui por espaço, mas deve ser mantida do arquivo original enviado anteriormente) */}
      
      {/* MODAL DO PROFISSIONAL */}
      {showProfessionalModal && selectedProfessional && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-2xl cartao-vidro border-[#D4AF37]/30 rounded-[3rem] overflow-hidden animate-in zoom-in duration-300">
            <div className="relative h-80">
              <img src={selectedProfessional.avatar} className="w-full h-full object-cover" />
              <button onClick={() => setShowProfessionalModal(false)} className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full"><X/></button>
              <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-black to-transparent">
                <h2 className="text-4xl font-black italic">{selectedProfessional.name}</h2>
                <p className="text-[#D4AF37] font-black uppercase tracking-widest text-xs mt-2">{selectedProfessional.specialty}</p>
              </div>
            </div>
            <div className="p-10">
              <h3 className="text-xl font-black italic mb-4">A Arte de Barbear</h3>
              <p className="text-zinc-400 leading-relaxed">{selectedProfessional.description || "Especialista em cortes clássicos e barboterapia de luxo."}</p>
              <button onClick={() => { setShowProfessionalModal(false); setSelecao(s => ({...s, professionalId: selectedProfessional.id})); setView('BOOKING'); }} className="w-full mt-10 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase text-xs">Agendar com este Artífice</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DE AGENDAMENTO (BOOKING) */}
      {view === 'BOOKING' && (
        <div className="max-w-4xl mx-auto px-6 py-20 animate-in slide-in-from-bottom-10">
           <button onClick={() => setView('HOME')} className="flex items-center gap-2 font-black text-[10px] uppercase opacity-50 mb-10"><ChevronLeft size={16}/> Voltar</button>
           <div className="grid md:grid-cols-2 gap-16">
              <div className="space-y-10">
                 <h2 className="text-5xl font-black italic">Sua Reserva</h2>
                 <div className="space-y-6">
                    <div className="cartao-vidro p-6 rounded-3xl border-[#D4AF37]/20">
                       <p className="text-[#D4AF37] font-black text-[10px] uppercase mb-1">Ritual Escolhido</p>
                       <p className="text-2xl font-black italic">{services.find(s => s.id === selecao.serviceId)?.name}</p>
                    </div>
                    <div className="grid gap-4">
                       <input type="date" value={selecao.date} onChange={e => setSelecao({...selecao, date: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold" />
                       <select value={selecao.professionalId} onChange={e => setSelecao({...selecao, professionalId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white">
                          <option value="" className="text-black">Escolher Artífice</option>
                          {professionals.map(p => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
                       </select>
                       <input type="text" placeholder="Nome Completo" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold" />
                       <input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold" />
                    </div>
                 </div>
              </div>
              <div>
                 <h3 className="text-xl font-black italic mb-6">Horários Disponíveis</h3>
                 <div className="grid grid-cols-3 gap-3">
                    {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(h => (
                      <button key={h} onClick={() => setSelecao({...selecao, time: h})} className={`p-4 rounded-xl font-black text-xs transition-all ${selecao.time === h ? 'gradiente-ouro text-black' : 'bg-white/5 border border-white/10 text-zinc-500'}`}>{h}</button>
                    ))}
                 </div>
                 <button onClick={handleConfirmBooking} disabled={loading} className="w-full mt-10 gradiente-ouro text-black py-6 rounded-3xl font-black uppercase text-xs shadow-2xl transition-all active:scale-95">
                    {loading ? 'PROCESSANDO...' : 'CONFIRMAR AGENDAMENTO'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <footer className="py-12 text-center opacity-30 text-[9px] font-black uppercase tracking-[0.3em]">
        © 2026 {config.name}. PRODUZIDO POR ©NIKLAUS.
      </footer>
    </div>
  );
};

export default PublicBooking;
