import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selecao, setSelecao] = useState({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Definição da cor solicitada e estilo do preço
  const mainColor = '#66360f';
  const btnStyle = { backgroundColor: mainColor, color: '#fff' };
  const priceStyle = { color: '#ffffff', fontSize: '1.25rem', fontWeight: '900' };

  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) {
        setLoggedClient(client);
      }
    }
  }, [user, clients]);

  // Refs para Scroll
  const destaqueRef = React.useRef<HTMLDivElement>(null);
  const experienciaRef = React.useRef<HTMLDivElement>(null);
  const membroRef = React.useRef<HTMLDivElement>(null);

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const client = await addClient({ name: selecao.clientName, phone: selecao.clientPhone, email: selecao.clientEmail || `${selecao.clientPhone}@temp.com` });
      const serv = services.find(s => s.id === selecao.serviceId);
      const [h, m] = selecao.time.split(':').map(Number);
      const endTime = `${Math.floor((h * 60 + m + (serv?.durationMinutes || 30)) / 60).toString().padStart(2, '0')}:${((h * 60 + m + (serv?.durationMinutes || 30)) % 60).toString().padStart(2, '0')}`;
      await addAppointment({ clientId: client.id, clientName: client.name, clientPhone: client.phone, serviceId: selecao.serviceId, serviceName: serv?.name || '', professionalId: selecao.professionalId, professionalName: professionals.find(p => p.id === selecao.professionalId)?.name || '', date: selecao.date, startTime: selecao.time, endTime, price: serv?.price || 0 }, true);
      setSuccess(true);
    } catch (err) { alert("Erro ao agendar."); }
    finally { setLoading(false); }
  };

  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center p-6 bg-[#050505]`}>
      <div className={`w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 cartao-vidro border-[#66360f]/30`}>
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={btnStyle}><Check className="w-10 h-10 text-white" /></div>
        <h2 className="text-3xl font-black font-display italic" style={{ color: mainColor }}>Reserva Confirmada!</h2>
        <button onClick={() => window.location.reload()} style={btnStyle} className="px-10 py-4 rounded-xl text-[10px] font-black uppercase">Voltar à Início</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-[#F3F4F6]' : 'bg-[#050505]'} text-white`}>
      {view === 'HOME' && (
        <div className="animate-in fade-in flex flex-col min-h-screen">
          <header className="relative h-[65vh] overflow-hidden flex flex-col items-center justify-center">
            <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Capa" />
            <div className={`absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent`}></div>
            
            {/* Botão Superior - Portal do Membro */}
            <div className="absolute top-6 right-6 z-[100]">
                <button onClick={() => setView('LOGIN')} style={btnStyle} className="px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95">
                    <History size={16}/> PORTAL DO MEMBRO
                </button>
            </div>

            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-28 h-28 rounded-3xl p-1 mx-auto mb-6" style={{ backgroundColor: mainColor }}><div className="w-full h-full rounded-[2.2rem] bg-black overflow-hidden"><img src={config.logo} className="w-full h-full object-cover" alt="Logo" /></div></div>
               <h1 className="text-5xl md:text-7xl font-black font-display italic tracking-tight text-white">{config.name}</h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3" style={{ color: mainColor }}>{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             {/* Destaques */}
             <section className="mb-20 pt-10">
                <h2 className="text-2xl font-black font-display italic mb-8 flex items-center gap-6">Destaques da Casa <div className="h-1 flex-1 opacity-10" style={{ backgroundColor: mainColor }}></div></h2>
                <div ref={destaqueRef} className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                   {services.slice(0, 6).map(svc => (
                     <div key={svc.id} className="snap-center flex-shrink-0 w-64 md:w-72 rounded-[2.5rem] overflow-hidden cartao-vidro border-white/5">
                        <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover" alt="" /></div>
                        <div className="p-6">
                           <h3 className="text-xl font-black font-display italic text-white">{svc.name}</h3>
                           {/* PREÇO EM BRANCO E MAIOR */}
                           <p className="mt-2" style={priceStyle}>R$ {svc.price.toFixed(2)}</p>
                           <p className="text-[9px] font-black uppercase text-zinc-500">{svc.durationMinutes} min</p>
                           <button onClick={() => handleBookingStart(svc)} style={btnStyle} className="w-full mt-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest">RESERVAR</button>
                        </div>
                     </div>
                   ))}
                </div>
             </section>

             {/* Todos os Serviços */}
             <section className="mb-24">
                <h2 className="text-2xl font-black font-display italic mb-8 flex items-center gap-6 text-white">Todos os serviços <div className="h-1 w-10 opacity-10" style={{ backgroundColor: mainColor }}></div></h2>
                <div className="space-y-4">
                   {Array.from(new Set(services.map(s => s.category))).map(cat => {
                     const isExpanded = expandedCategories.includes(cat);
                     return (
                       <div key={cat} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                          <button onClick={() => toggleCategory(cat)} className="w-full p-6 flex items-center justify-between">
                             <span className="text-lg font-black text-white">{cat}</span>
                             <ChevronRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} size={20} style={{ color: mainColor }}/>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-white/10">
                               {services.filter(s => s.category === cat).map(svc => (
                                 <div key={svc.id} className="p-6 border-b border-white/10 last:border-b-0 flex items-center justify-between">
                                    <div>
                                       <h4 className="text-base font-bold text-white">{svc.name}</h4>
                                       {/* PREÇO EM BRANCO E MAIOR */}
                                       <div className="flex items-center gap-4 mt-1">
                                          <span style={priceStyle}>R$ {svc.price.toFixed(2)}</span>
                                          <span className="text-xs font-black text-zinc-500">{svc.durationMinutes} min</span>
                                       </div>
                                    </div>
                                    <button onClick={() => handleBookingStart(svc)} style={btnStyle} className="px-6 py-3 rounded-xl text-[9px] font-black uppercase">Agendar</button>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </section>

             {/* Outras seções mantidas originais com cor marrom */}
             <section className="mb-24">
                <h2 className="text-2xl font-black font-display italic mb-8 flex items-center gap-6">Nossos Artífices <div className="h-1 flex-1 opacity-10" style={{ backgroundColor: mainColor }}></div></h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {professionals.map(prof => (
                      <div key={prof.id} className="rounded-[2rem] p-6 text-center space-y-4 cartao-vidro border-white/5 hover:border-[#66360f]/30 transition-all">
                         <img src={prof.avatar} style={{ borderColor: mainColor }} className="w-24 h-24 mx-auto rounded-2xl object-cover border-2" alt="" />
                         <p className="font-black text-sm text-white">{prof.name}</p>
                         <div className="text-red-500 text-xs font-black flex items-center justify-center gap-1"><Heart size={12} fill="currentColor" /> {prof.likes || 0}</div>
                      </div>
                   ))}
                </div>
             </section>
          </main>
        </div>
      )}

      {/* Booking Flow - Mantendo a cor no processo */}
      {view === 'BOOKING' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 pb-20">
           <header className="flex items-center gap-4 mb-10">
             <button onClick={() => setView('HOME')} className="p-3 rounded-xl border border-white/10 text-zinc-400"><ChevronLeft size={24}/></button>
             <h2 className="text-3xl font-black font-display italic text-white">Reservar Ritual</h2>
           </header>
           <div className="rounded-[2.5rem] p-8 cartao-vidro border-[#66360f]/10">
              {passo === 2 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {professionals.map(p => (
                    <button key={p.id} onClick={() => { setSelecao({...selecao, professionalId: p.id}); setPasso(3); }} className="p-6 rounded-[2rem] border border-white/5 hover:border-[#66360f] transition-all flex flex-col items-center gap-4">
                       <img src={p.avatar} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                       <span className="text-[11px] font-black uppercase text-white">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {passo === 3 && (
                <div className="space-y-8">
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {[0,1,2,3,4,5,6,7].map(i => {
                      const d = new Date(); d.setDate(d.getDate() + i);
                      const dateStr = d.toISOString().split('T')[0];
                      const isSel = selecao.date === dateStr;
                      return (
                        <button key={i} onClick={() => setSelecao({...selecao, date: dateStr})} style={isSel ? btnStyle : {}} className={`flex-shrink-0 w-20 h-24 rounded-2xl border ${!isSel ? 'border-white/5 bg-white/5' : ''} flex flex-col items-center justify-center`}>
                           <span className="text-xl font-black">{d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selecao.date && (
                    <div className="grid grid-cols-4 gap-2">
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                        <button key={t} onClick={() => { setSelecao({...selecao, time: t}); setPasso(4); }} style={selecao.time === t ? btnStyle : {}} className="py-3 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black">
                           {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {passo === 4 && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <input type="text" placeholder="Seu Nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className="w-full border p-5 rounded-2xl bg-white/5 border-white/10 text-white focus:border-[#66360f] outline-none" />
                  <input type="tel" placeholder="Seu WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className="w-full border p-5 rounded-2xl bg-white/5 border-white/10 text-white focus:border-[#66360f] outline-none" />
                  <button onClick={handleConfirmBooking} style={btnStyle} className="w-full py-6 rounded-2xl font-black uppercase text-[10px]">Finalizar Agendamento</button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Login Portal */}
      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6">
           <div className="w-full max-w-md rounded-[3rem] p-12 space-y-10 cartao-vidro border-[#66360f]/20">
              <div className="text-center space-y-4">
                 <div className="w-16 h-16 rounded-2xl p-1 mx-auto" style={{ backgroundColor: mainColor }}><div className="w-full h-full rounded-[1.8rem] bg-black flex items-center justify-center"><Lock className="text-white" size={24}/></div></div>
                 <h2 className="text-3xl font-black font-display italic">Portal do Membro</h2>
              </div>
              <div className="space-y-6">
                 <input type="text" placeholder="E-mail ou Celular" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className="w-full border p-5 rounded-2xl bg-white/5 border-white/10 text-white focus:border-[#66360f] outline-none" />
                 <input type="password" placeholder="Sua Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full border p-5 rounded-2xl bg-white/5 border-white/10 text-white focus:border-[#66360f] outline-none" />
                 <button onClick={() => {}} style={btnStyle} className="w-full py-5 rounded-2xl font-black uppercase text-[10px]">ACESSAR PORTAL</button>
              </div>
              <button onClick={() => setView('HOME')} className="w-full text-[10px] font-black uppercase text-zinc-600">Voltar ao Início</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
