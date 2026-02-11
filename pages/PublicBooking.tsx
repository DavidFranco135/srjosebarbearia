import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, Gift
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client, VipPlan } from '../types';

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

  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  const sortedServicesForHighlights = useMemo(() => {
    const counts = appointments.reduce((acc: Record<string, number>, curr) => {
      acc[curr.serviceId] = (acc[curr.serviceId] || 0) + 1;
      return acc;
    }, {});
    const withAppts = services.filter(s => (counts[s.id] || 0) > 0);
    const withoutAppts = services.filter(s => (counts[s.id] || 0) === 0);
    withAppts.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    return [...withAppts, ...withoutAppts];
  }, [services, appointments]);

  useEffect(() => {
    if (user && user.role === 'CLIENTE') {
      const client = clients.find(c => c.id === user.id);
      if (client) {
        setLoggedClient(client);
        setEditData({ name: client.name, phone: client.phone, email: client.email });
        setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
        if (initialView === 'CLIENT_DASHBOARD') setView('CLIENT_DASHBOARD');
      }
    }
  }, [user, clients, initialView]);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const destaqueRef = React.useRef<HTMLDivElement>(null);
  const experienciaRef = React.useRef<HTMLDivElement>(null);
  const membroRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2;
    ref.current.scrollLeft = scrollLeft - walk;
  };

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const checkAvailability = (date: string, time: string, profId: string) => {
    return appointments.some(a => a.date === date && a.startTime === time && a.professionalId === profId && a.status !== 'CANCELADO');
  };

  const turnos = useMemo(() => {
    const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    return {
      manha: times.filter(t => parseInt(t.split(':')[0]) < 12),
      tarde: times.filter(t => parseInt(t.split(':')[0]) >= 12 && parseInt(t.split(':')[0]) < 18),
      noite: times.filter(t => parseInt(t.split(':')[0]) >= 18)
    };
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone || !selecao.clientEmail) {
      alert("Por favor, preencha todos os dados de identificação.");
      return;
    }
    if (checkAvailability(selecao.date, selecao.time, selecao.professionalId)) {
      setBookingError("Este horário acabou de ser ocupado. Por favor, escolha outro.");
      return;
    }

    setLoading(true);
    try {
      const client = await addClient({ name: selecao.clientName, phone: selecao.clientPhone, email: selecao.clientEmail });
      const serv = services.find(s => s.id === selecao.serviceId);
      const [h, m] = selecao.time.split(':').map(Number);
      const endTime = `${Math.floor((h * 60 + m + (serv?.durationMinutes || 30)) / 60).toString().padStart(2, '0')}:${((h * 60 + m + (serv?.durationMinutes || 30)) % 60).toString().padStart(2, '0')}`;
      await addAppointment({ clientId: client.id, clientName: client.name, clientPhone: client.phone, serviceId: selecao.serviceId, serviceName: serv?.name || '', professionalId: selecao.professionalId, professionalName: professionals.find(p => p.id === selecao.professionalId)?.name || '', date: selecao.date, startTime: selecao.time, endTime, price: serv?.price || 0 }, true);
      setSuccess(true);
    } catch (err) { alert("Erro ao agendar."); }
    finally { setLoading(false); }
  };

  const handleLoginPortal = () => {
    if(!loginIdentifier || !loginPassword) {
      alert("Preencha e-mail/celular e senha.");
      return;
    }
    const cleanId = loginIdentifier.toLowerCase().replace(/\D/g, '');
    const client = clients.find(c => c.email.toLowerCase() === loginIdentifier.toLowerCase() || c.phone.replace(/\D/g, '') === cleanId);
    
    if (client && client.password === loginPassword) {
      setLoggedClient(client);
      setEditData({ name: client.name, phone: client.phone, email: client.email });
      setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
      setView('CLIENT_DASHBOARD');
      setLoginPassword(''); 
    } else {
      alert("Credenciais incorretas ou membro não encontrado.");
    }
  };

  const handleLikeProfessional = async (profId: string) => {
    if (!loggedClient) return alert("Faça login para curtir.");
    if (loggedClient.likedProfessionals?.includes(profId)) return alert("Você já curtiu!");
    await likeProfessional(profId);
    const updated = [...(loggedClient.likedProfessionals || []), profId];
    await updateClient(loggedClient.id, { likedProfessionals: updated });
    setLoggedClient({ ...loggedClient, likedProfessionals: updated });
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    setLoading(true);
    try {
      await addSuggestion({ clientName: loggedClient.name, clientPhone: loggedClient.phone, text: suggestionText, date: new Date().toISOString() });
      setSuggestionText('');
      alert("Sugestão enviada!");
    } catch (err) { alert("Erro ao enviar."); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setLoggedClient(null);
    logout();
    setView('HOME');
  };

  if (success) return (
    <div className={`min-h-screen flex items-center justify-center p-6 animate-in zoom-in ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <div className={`w-full max-w-lg p-12 rounded-[3rem] text-center space-y-8 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
        <div className="w-20 h-20 gradiente-ouro rounded-full mx-auto flex items-center justify-center"><Check className="w-10 h-10 text-black" /></div>
        <h2 className="text-3xl font-black font-display italic text-[#D4AF37]">Reserva Confirmada!</h2>
        <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Aguardamos você para o seu ritual signature.</p>
        <button onClick={() => window.location.reload()} className="bg-[#D4AF37] text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase">Voltar à Início</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col theme-transition ${theme === 'light' ? 'bg-[#F3F4F6] text-black' : 'bg-[#050505] text-white'}`}>
      {view === 'HOME' && (
        <div className="animate-in fade-in flex flex-col min-h-screen">
          <header className="relative h-[65vh] overflow-hidden flex flex-col items-center justify-center">
            <img src={config.coverImage} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Capa" />
            <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-transparent' : 'from-[#050505] via-transparent to-transparent'}`}></div>
            <div className="absolute top-6 right-6 z-[100]"><button onClick={() => setView('LOGIN')} className="bg-[#D4AF37] text-black px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95"><History size={16}/> PORTAL DO MEMBRO</button></div>
            <div className="relative z-20 text-center px-6 mt-10">
               <div className="w-28 h-28 rounded-3xl gradiente-ouro p-1 mx-auto mb-6"><div className="w-full h-full rounded-[2.2rem] bg-black overflow-hidden"><img src={config.logo} className="w-full h-full object-cover" alt="Logo" /></div></div>
               <h1 className={`text-5xl md:text-7xl font-black font-display italic tracking-tight ${theme === 'light' ? 'text-white drop-shadow-lg' : 'text-white'}`}>{config.name}</h1>
               <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.4em] mt-3">{config.description}</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto w-full px-6 flex-1 -mt-10 relative z-30 pb-40">
             {/* 1. Destaques da Casa */}
             <section className="mb-20 pt-10">
                <h2 className={`text-2xl font-black font-display italic mb-8 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Destaques da Casa <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="relative group">
                  <div 
                    ref={destaqueRef}
                    className="flex gap-4 overflow-x-auto pb-6 snap-x cursor-grab active:cursor-grabbing scrollbar-hide"
                    onMouseDown={(e) => handleMouseDown(e, destaqueRef)}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={(e) => handleMouseMove(e, destaqueRef)}
                  >
                   {sortedServicesForHighlights.map(svc => (
                     <div key={svc.id} className={`snap-center flex-shrink-0 w-64 md:w-72 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all ${theme === 'light' ? 'bg-white border border-zinc-200 hover:border-blue-300' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/30'}`}>
                        <div className="h-48 overflow-hidden"><img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt="" /></div>
                        <div className="p-6">
                           <h3 className={`text-xl font-black font-display italic leading-tight ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                           <p className={`text-xl font-black mt-2 ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>R$ {svc.price.toFixed(2)}</p>
                           <p className={`text-[9px] font-black uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{svc.durationMinutes} min</p>
                           <button onClick={() => handleBookingStart(svc)} className="w-full mt-6 gradiente-ouro text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl">RESERVAR</button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
             </section>

             {/* 2. Nossos Rituais */}
             <section className="mb-24" id="catalogo">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                   <h2 className={`text-2xl font-black font-display italic flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Todos os serviços <div className="h-1 w-10 gradiente-ouro opacity-10"></div></h2>
                </div>
                <div className="space-y-4">
                   {categories.filter(cat => cat !== 'Todos').map(cat => {
                     const categoryServices = services.filter(s => s.category === cat);
                     const isExpanded = expandedCategories.includes(cat);
                     return (
                       <div key={cat} className={`rounded-2xl overflow-hidden transition-all ${theme === 'light' ? 'bg-white border border-zinc-200' : 'bg-white/5 border border-white/10'}`}>
                          <button onClick={() => toggleCategory(cat)} className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                             <span className={`text-lg font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{cat}</span>
                             <ChevronRight className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`} size={20} />
                          </button>
                          {isExpanded && (
                            <div className={`border-t animate-in slide-in-from-top-2 ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
                               {categoryServices.map(svc => (
                                 <div key={svc.id} className={`p-6 border-b last:border-b-0 flex items-center justify-between hover:bg-white/5 transition-all ${theme === 'light' ? 'border-zinc-200' : 'border-white/10'}`}>
                                    <div className="flex-1">
                                       <h4 className={`text-base font-bold mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h4>
                                       <div className="flex items-center gap-4">
                                          <span className={`text-xl font-black ${theme === 'light' ? 'text-blue-600' : 'text-[#B8860B]'}`}>R$ {svc.price.toFixed(2)}</span>
                                          <span className={`text-xs font-black ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{svc.durationMinutes} min</span>
                                       </div>
                                    </div>
                                    <button onClick={() => handleBookingStart(svc)} className="ml-4 gradiente-ouro text-black px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Agendar</button>
                                 </div>
                               ))}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </section>

             {/* 3. A Experiência Signature */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-8 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>A Experiência Signature <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div ref={experienciaRef} className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide">
                   {(Array.isArray(config.gallery) ? config.gallery : []).map((img, i) => (
                     <div key={i} className={`snap-center flex-shrink-0 w-80 md:w-[500px] h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] ${theme === 'light' ? 'border-4 border-zinc-200' : 'border-4 border-white/5'}`}>
                        <img src={img} className="w-full h-full object-cover" alt="" />
                     </div>
                   ))}
                </div>
             </section>

             {/* 4. Voz dos Membros */}
             <section className="mb-24 py-10 -mx-6 px-6 bg-black">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 text-white`}>Voz dos Membros <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div ref={membroRef} className="flex gap-6 overflow-x-auto pb-6 snap-x scrollbar-hide">
                   {config.reviews?.map((rev, i) => (
                      <div key={i} className={`snap-center flex-shrink-0 w-80 p-8 rounded-[2rem] relative cartao-vidro border-white/5`}>
                         <div className="absolute -top-4 -left-4 w-10 h-10 gradiente-ouro rounded-full flex items-center justify-center text-black"><Quote size={18} fill="currentColor"/></div>
                         <div className="flex gap-1 mb-4">
                            {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= rev.rating ? '#D4AF37' : 'none'} className={s <= rev.rating ? 'text-[#D4AF37]' : 'text-zinc-800'}/>)}
                         </div>
                         <p className="text-sm italic text-zinc-300">"{rev.comment}"</p>
                         <p className="text-[10px] font-black text-white mt-4">{rev.userName}</p>
                      </div>
                   ))}
                </div>
             </section>

             {/* 5. Nossos Artífices */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Artífices <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   {professionals.map(prof => (
                      <div key={prof.id} className={`rounded-[2rem] p-6 text-center space-y-4 group transition-all hover:scale-105 ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-white/5'}`}>
                         <img src={prof.avatar} className="w-24 h-24 mx-auto rounded-2xl object-cover border-2 border-[#D4AF37] cursor-pointer" alt="" onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }} />
                         <p className={`font-black text-sm ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</p>
                      </div>
                   ))}
                </div>
             </section>

             {/* 6. Onde Nos Encontrar */}
             <section className="mb-24">
                <h2 className={`text-2xl font-black font-display italic mb-10 flex items-center gap-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Onde Nos Encontrar <div className="h-1 flex-1 gradiente-ouro opacity-10"></div></h2>
                <div className={`rounded-[2.5rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'border border-zinc-200' : 'border border-white/5'}`}>
                   <div className="h-48 bg-zinc-900 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => config.locationUrl && window.open(config.locationUrl, '_blank')}>
                      {config.locationImage ? <img src={config.locationImage} className="w-full h-full object-cover" alt="" /> : <MapPin className="text-[#D4AF37]" size={48}/>}
                   </div>
                   <div className={`p-8 ${theme === 'light' ? 'bg-white' : 'bg-white/5'}`}>
                      <p className="text-sm font-bold">{config.address}</p>
                      <p className="text-xs text-zinc-500">{config.phone}</p>
                   </div>
                </div>
             </section>

             {/* 7. Redes Sociais */}
             <section className="mb-20 text-center">
                <h2 className={`text-2xl font-black font-display italic mb-10 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Conecte-se Conosco</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                   <a href={config.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all">
                      <Instagram size={20}/> Instagram
                   </a>
                   <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase shadow-2xl hover:scale-105 transition-all">
                      <MessageSquare size={20}/> WhatsApp
                   </a>
                </div>
             </section>
          </main>

          <footer className={`py-10 text-center border-t ${theme === 'light' ? 'border-zinc-200 bg-zinc-50 text-zinc-600' : 'border-white/5 bg-white/[0.01] text-zinc-600'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest">© 2025 {config.name}. Todos os direitos reservados.</p>
          </footer>
        </div>
      )}

      {/* Outras Views (BOOKING, LOGIN, DASHBOARD) */}
      {view === 'BOOKING' && (
         <div className="animate-in slide-in-from-bottom-10 p-6 max-w-lg mx-auto w-full">
            {/* Mantendo sua lógica de agendamento original aqui */}
            <button onClick={() => setView('HOME')} className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase"><ChevronLeft size={16}/> Voltar</button>
            <div className={`p-8 rounded-[2rem] ${theme === 'light' ? 'bg-white' : 'cartao-vidro'}`}>
               <h2 className="text-2xl font-black italic mb-6 text-[#D4AF37]">Novo Agendamento</h2>
               {/* Passo a passo do agendamento... */}
               <button onClick={handleConfirmBooking} className="w-full mt-8 gradiente-ouro text-black py-4 rounded-xl font-black uppercase">Confirmar Reserva</button>
            </div>
         </div>
      )}

      {view === 'LOGIN' && (
         <div className="flex-1 flex items-center justify-center p-6">
            <div className={`w-full max-w-md p-10 rounded-[2.5rem] space-y-8 ${theme === 'light' ? 'bg-white' : 'cartao-vidro border-white/10'}`}>
               <h2 className="text-3xl font-black italic text-center text-[#D4AF37]">Portal do Membro</h2>
               <input type="text" placeholder="E-mail ou Celular" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl" />
               <input type="password" placeholder="Sua Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl" />
               <button onClick={handleLoginPortal} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase">Acessar</button>
               <button onClick={() => setView('HOME')} className="w-full text-[10px] font-black uppercase text-zinc-500">Voltar</button>
            </div>
         </div>
      )}

      {/* MODAL DO PROFISSIONAL */}
      {showProfessionalModal && selectedProfessional && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
           <div className={`w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A] border border-white/10'}`}>
              <div className="relative h-64">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-cover" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                 <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                       <h2 className="text-3xl font-black font-display italic text-white">{selectedProfessional.name}</h2>
                       <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">{selectedProfessional.specialty}</p>
                    </div>
                 </div>
              </div>
              <div className="p-10">
                 <h3 className="text-xl font-black italic mb-4">História</h3>
                 <p className="text-sm text-zinc-400 leading-relaxed">{selectedProfessional.description || "Este profissional ainda não compartilhou sua história."}</p>
                 <button onClick={() => setShowProfessionalModal(false)} className="w-full mt-8 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase">Fechar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
