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
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout, shopReviews } = useBarberStore();
  
  const [view, setView] = useState<'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD'>(initialView);
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', userName: '', clientPhone: '' });
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loggedClient, setLoggedClient] = useState<Client | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // States para o portal do membro
  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

  // Sincroniza o usuário logado do store com o loggedClient deste componente
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

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(s => s.category)))], [services]);
  const filteredServices = useMemo(() => selectedCategory === 'Todos' ? services : services.filter(s => s.category === selectedCategory), [services, selectedCategory]);

  const handleBookingStart = (svc: Service) => {
    setSelecao(prev => ({ ...prev, serviceId: svc.id }));
    setView('BOOKING'); setPasso(2);
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

  const [selecao, setSelecao] = useState({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });

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
    if(!loginIdentifier) return;
    const cleanId = loginIdentifier.toLowerCase().replace(/\D/g, '');
    const client = clients.find(c => c.email.toLowerCase() === loginIdentifier.toLowerCase() || c.phone.replace(/\D/g, '') === cleanId);
    
    if (client) {
      setLoggedClient(client);
      setEditData({ name: client.name, phone: client.phone, email: client.email });
      setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
      setView('CLIENT_DASHBOARD');
    } else {
      alert("Membro não encontrado. Verifique seu e-mail ou celular cadastrado.");
    }
  };

  const handleUpdateProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && loggedClient) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateClient(loggedClient.id, { avatar: base64 });
        setLoggedClient({ ...loggedClient, avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    setLoading(true);
    try {
      await addSuggestion({
        clientName: loggedClient.name,
        clientPhone: loggedClient.phone,
        text: suggestionText,
        date: new Date().toLocaleDateString('pt-BR'),
        status: 'unread'
      });
      alert("Sugestão enviada com sucesso!");
      setSuggestionText('');
    } catch (err) { alert("Erro ao enviar sugestão."); }
    finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    if (!loggedClient) return;
    setLoading(true);
    try {
      await updateClient(loggedClient.id, editData);
      setLoggedClient({ ...loggedClient, ...editData });
      alert("Perfil atualizado!");
    } catch (err) { alert("Erro ao atualizar."); }
    finally { setLoading(false); }
  };

  const handleAddReview = async () => {
    if (!newReview.comment.trim()) {
      alert("Por favor, escreva um comentário.");
      return;
    }
    setLoading(true);
    try {
      await addShopReview({
        rating: newReview.rating,
        comment: newReview.comment,
        userName: newReview.userName || 'Anônimo',
        clientPhone: newReview.clientPhone || '',
        date: new Date().toLocaleDateString('pt-BR')
      });
      alert("Avaliação enviada com sucesso!");
      setShowReviewModal(false);
      setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
    } catch (err) { alert("Erro ao enviar avaliação."); }
    finally { setLoading(false); }
  };

  const clientAppointments = useMemo(() => {
    if (!loggedClient) return { past: [], future: [] };
    const filtered = appointments.filter(a => a.clientId === loggedClient.id || a.clientPhone === loggedClient.phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const now = new Date(); now.setHours(0,0,0,0);
    return {
      past: filtered.filter(a => new Date(a.date) < now || a.status === 'CONCLUIDO_PAGO'),
      future: filtered.filter(a => new Date(a.date) >= now && a.status !== 'CONCLUIDO_PAGO' && a.status !== 'CANCELADO')
    };
  }, [loggedClient, appointments]);

  // Cálculo da média de avaliações
  const averageRating = useMemo(() => {
    if (!shopReviews || shopReviews.length === 0) return 0;
    const sum = shopReviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / shopReviews.length).toFixed(1);
  }, [shopReviews]);

  return (
    <div className={`min-h-screen flex flex-col theme-transition ${theme === 'light' ? 'bg-[#F8F9FA] text-[#1A1A1A]' : 'bg-[#050505] text-white'}`}>
      
      {view === 'HOME' && (
        <>
          {/* HERO */}
          <div className="relative h-screen flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 z-0">
                <img src={config.coverImage} className={`w-full h-full object-cover grayscale transition-all ${theme === 'light' ? 'opacity-10' : 'opacity-30'}`} alt="Capa" />
                <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-b from-transparent via-[#F8F9FA]/50 to-[#F8F9FA]' : 'bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]'}`}></div>
             </div>
             
             <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-10 animate-in fade-in zoom-in duration-1000">
                <div className="inline-block">
                   <img src={config.logo} className="h-32 md:h-40 mx-auto rounded-3xl shadow-2xl border-4 border-[#D4AF37]/30" alt="Logo" />
                </div>
                <div className="space-y-6">
                   <h1 className="text-5xl md:text-7xl font-black font-display italic tracking-tight">{config.name}</h1>
                   <p className="text-sm md:text-lg text-color-sec uppercase tracking-[0.4em] font-black opacity-60">{config.description}</p>
                </div>
                <button onClick={() => setView('BOOKING')} className="inline-flex items-center gap-4 gradiente-ouro text-black px-12 py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-110 transition-all">
                   <Scissors size={20} /> Agendar Ritual
                </button>
                <button onClick={() => setView('LOGIN')} className="block mx-auto mt-6 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest hover:underline">
                   Portal do Membro
                </button>
             </div>
          </div>

          {/* SOBRE */}
          <section className="py-20 md:py-32 px-6">
             <div className="max-w-4xl mx-auto space-y-10 text-center animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-4xl md:text-5xl font-black font-display italic text-[#D4AF37]">{config.aboutTitle}</h2>
                <p className="text-color-sec leading-loose text-base md:text-lg">{config.aboutText}</p>
             </div>
          </section>

          {/* SERVIÇOS */}
          <section className="py-20 md:py-32 px-6 relative">
             <div className="max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                   <h2 className="text-4xl md:text-5xl font-black font-display italic">Nossos Rituais</h2>
                   <p className="text-color-sec text-[10px] font-black uppercase tracking-[0.3em]">Experiências Exclusivas</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                   {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-8 py-3 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === cat ? 'gradiente-ouro text-black shadow-xl' : 'bg-white/5 text-color-sec border border-white/10'}`}>
                         {cat}
                      </button>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   {filteredServices.map(svc => (
                      <div key={svc.id} className="cartao-vidro rounded-[2.5rem] p-8 md:p-10 border-white/5 space-y-6 hover:border-[#D4AF37]/40 transition-all duration-500 group">
                         <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                               <Scissors size={24}/>
                            </div>
                            <span className="text-2xl font-black italic text-[#D4AF37] font-display">R$ {svc.price.toFixed(0)}</span>
                         </div>
                         <div>
                            <h3 className="text-2xl font-black font-display italic text-color-main mb-2">{svc.name}</h3>
                            <p className="text-[10px] text-color-sec font-black uppercase tracking-widest opacity-60">{svc.category}</p>
                         </div>
                         <p className="text-color-sec text-sm leading-relaxed">{svc.description}</p>
                         <button onClick={() => handleBookingStart(svc)} className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                            Reservar
                         </button>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* PROFISSIONAIS */}
          <section className="py-20 md:py-32 px-6">
             <div className="max-w-6xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                   <h2 className="text-4xl md:text-5xl font-black font-display italic">Nossos Artífices</h2>
                   <p className="text-color-sec text-[10px] font-black uppercase tracking-[0.3em]">Mestres da Tradição</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {professionals.map(prof => (
                      <div key={prof.id} className="cartao-vidro rounded-[2.5rem] p-8 border-white/5 text-center space-y-6 group hover:border-[#D4AF37]/40 transition-all">
                         <div className="relative inline-block">
                            <img src={prof.avatar} className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white/10 group-hover:border-[#D4AF37] transition-all mx-auto" alt="" />
                            <button onClick={() => likeProfessional(prof.id)} className="absolute -bottom-3 -right-3 bg-[#D4AF37] text-black p-3 rounded-xl shadow-xl hover:scale-110 transition-all">
                               <Heart size={14} fill="currentColor"/>
                            </button>
                         </div>
                         <div>
                            <h3 className="text-xl font-black font-display italic text-color-main">{prof.name}</h3>
                            <p className="text-[9px] text-color-sec font-black uppercase tracking-widest mt-2">{prof.specialty}</p>
                            <div className="flex items-center justify-center gap-2 mt-3">
                               <Heart size={12} className="text-[#D4AF37]" fill="currentColor"/>
                               <span className="text-[10px] font-black text-[#D4AF37]">{prof.likes || 0} curtidas</span>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* GALERIA */}
          {config.gallery && config.gallery.length > 0 && (
            <section className="py-20 md:py-32 px-6">
               <div className="max-w-6xl mx-auto space-y-16">
                  <div className="text-center space-y-4">
                     <h2 className="text-4xl md:text-5xl font-black font-display italic">Nosso Espaço</h2>
                     <p className="text-color-sec text-[10px] font-black uppercase tracking-[0.3em]">Ambiente Exclusivo</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {config.gallery.map((img, i) => (
                        <div key={i} className="aspect-video rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl group">
                           <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                        </div>
                     ))}
                  </div>
               </div>
            </section>
          )}

          {/* AVALIAÇÕES COM ESTRELAS */}
          {shopReviews && shopReviews.length > 0 && (
            <section className="py-20 md:py-32 px-6">
               <div className="max-w-6xl mx-auto space-y-16">
                  <div className="text-center space-y-6">
                     <h2 className="text-4xl md:text-5xl font-black font-display italic">O Que Dizem</h2>
                     <div className="flex items-center justify-center gap-3">
                        <div className="flex gap-1">
                           {[1,2,3,4,5].map(star => (
                              <Star key={star} size={28} className={parseFloat(averageRating) >= star ? 'text-[#D4AF37]' : 'text-zinc-800'} fill={parseFloat(averageRating) >= star ? 'currentColor' : 'none'} />
                           ))}
                        </div>
                        <span className="text-3xl font-black text-[#D4AF37] font-display">{averageRating}</span>
                        <span className="text-[10px] text-color-sec font-black uppercase tracking-widest">({shopReviews.length} avaliações)</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {shopReviews.slice(0, 6).map((rev, i) => (
                        <div key={i} className="cartao-vidro rounded-[2.5rem] p-8 border-white/5 space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                 {[1,2,3,4,5].map(star => (
                                    <Star key={star} size={16} className={rev.rating >= star ? 'text-[#D4AF37]' : 'text-zinc-800'} fill={rev.rating >= star ? 'currentColor' : 'none'} />
                                 ))}
                              </div>
                              <Quote className="text-[#D4AF37]/20" size={32}/>
                           </div>
                           <p className="text-color-sec italic leading-relaxed text-sm">"{rev.comment}"</p>
                           <div className="flex items-center justify-between border-t border-white/5 pt-4">
                              <span className="text-[10px] font-black text-color-main uppercase tracking-widest">{rev.userName}</span>
                              <span className="text-[8px] text-color-sec font-black uppercase tracking-widest">{rev.date}</span>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="text-center">
                     <button onClick={() => setShowReviewModal(true)} className="gradiente-ouro text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                        Deixar Avaliação
                     </button>
                  </div>
               </div>
            </section>
          )}

          {/* CONTATO */}
          <section className="py-20 md:py-32 px-6">
             <div className="max-w-4xl mx-auto cartao-vidro rounded-[3rem] p-12 md:p-16 border-[#D4AF37]/10 space-y-10 text-center">
                <h2 className="text-4xl md:text-5xl font-black font-display italic">Onde Estamos</h2>
                <div className="space-y-6 text-color-sec">
                   <div className="flex items-center justify-center gap-4">
                      <MapPin className="text-[#D4AF37]" size={24}/>
                      <p className="text-base font-bold">{config.address}, {config.city} - {config.state}</p>
                   </div>
                   <div className="flex items-center justify-center gap-4">
                      <Clock className="text-[#D4AF37]" size={24}/>
                      <p className="text-base font-bold">{config.openingTime} às {config.closingTime}</p>
                   </div>
                   <div className="flex items-center justify-center gap-4">
                      <Phone className="text-[#D4AF37]" size={24}/>
                      <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} className="text-base font-bold hover:text-[#D4AF37] transition-all">{config.whatsapp}</a>
                   </div>
                   <div className="flex items-center justify-center gap-4">
                      <Instagram className="text-[#D4AF37]" size={24}/>
                      <a href={`https://instagram.com/${config.instagram}`} className="text-base font-bold hover:text-[#D4AF37] transition-all">@{config.instagram}</a>
                   </div>
                </div>
                {config.locationUrl && (
                  <a href={config.locationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 gradiente-ouro text-black px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                     <MapPin size={18}/> Ver no Mapa
                  </a>
                )}
             </div>
          </section>
        </>
      )}

      {view === 'LOGIN' && (
        <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in">
           <div className="cartao-vidro w-full max-w-md rounded-[3rem] p-12 space-y-10 border-[#D4AF37]/20 shadow-2xl">
              <div className="text-center space-y-6">
                 <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden shadow-xl border-2 border-[#D4AF37]/30">
                    <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black font-display italic">Portal do Membro</h2>
                    <p className="text-color-sec text-[10px] font-black uppercase tracking-widest mt-2">Acesso Exclusivo</p>
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" size={20}/>
                    <input type="text" placeholder="E-mail ou WhatsApp cadastrado" value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-2xl outline-none text-color-main font-bold focus:border-[#D4AF37] transition-all" />
                 </div>
                 <button onClick={handleLoginPortal} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">
                    Acessar Portal
                 </button>
                 <button onClick={() => setView('HOME')} className="w-full text-color-sec text-[10px] font-black uppercase tracking-widest hover:text-[#D4AF37] transition-all">
                    Voltar ao Início
                 </button>
              </div>
           </div>
        </div>
      )}

      {view === 'CLIENT_DASHBOARD' && loggedClient && (
        <div className="flex-1 max-w-6xl mx-auto w-full p-6 pb-20 space-y-10 animate-in fade-in">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="relative group">
                    <img src={loggedClient.avatar || 'https://i.pravatar.cc/150'} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#D4AF37]/30 shadow-xl" alt="" />
                    <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl cursor-pointer">
                       <Upload size={20} className="text-white"/>
                       <input type="file" accept="image/*" className="hidden" onChange={handleUpdateProfilePhoto} />
                    </label>
                 </div>
                 <div>
                    <h1 className="text-3xl font-black font-display italic text-color-main">Olá, {loggedClient.name.split(' ')[0]}</h1>
                    <p className="text-color-sec text-[10px] font-black uppercase tracking-widest">Membro Signature</p>
                 </div>
              </div>
              <button onClick={() => { setLoggedClient(null); setView('HOME'); }} className="p-4 bg-white/5 text-color-sec rounded-2xl hover:text-red-500 transition-all">
                 <LogOut size={20}/>
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="cartao-vidro rounded-[2rem] p-8 border-white/5 text-center">
                 <p className="text-[9px] text-color-sec font-black uppercase tracking-widest mb-2">Total Investido</p>
                 <p className="text-3xl font-black text-[#D4AF37] italic font-display">R$ {loggedClient.totalSpent.toFixed(2)}</p>
              </div>
              <div className="cartao-vidro rounded-[2rem] p-8 border-white/5 text-center">
                 <p className="text-[9px] text-color-sec font-black uppercase tracking-widest mb-2">Sessões Concluídas</p>
                 <p className="text-3xl font-black text-color-main italic font-display">{clientAppointments.past.length}</p>
              </div>
              <div className="cartao-vidro rounded-[2rem] p-8 border-white/5 text-center">
                 <p className="text-[9px] text-color-sec font-black uppercase tracking-widest mb-2">Próximos Rituais</p>
                 <p className="text-3xl font-black text-color-main italic font-display">{clientAppointments.future.length}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="cartao-vidro rounded-[2.5rem] p-8 border-white/5 space-y-6">
                 <h3 className="text-xl font-black font-display italic flex items-center gap-3"><Lock className="text-[#D4AF37]"/> Perfil Privado</h3>
                 <div className="space-y-4">
                    <input type="text" placeholder="Nome" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-color-main font-bold focus:border-[#D4AF37]" />
                    <input type="tel" placeholder="WhatsApp" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-color-main font-bold focus:border-[#D4AF37]" />
                    <input type="email" placeholder="E-mail" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-color-main font-bold focus:border-[#D4AF37]" />
                    <button onClick={handleSaveProfile} disabled={loading} className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                       <Save size={16}/> {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                 </div>
              </div>

              <div className="cartao-vidro rounded-[2.5rem] p-8 border-white/5 space-y-6">
                 <h3 className="text-xl font-black font-display italic flex items-center gap-3"><MessageSquare className="text-[#D4AF37]"/> Sugestões</h3>
                 <textarea rows={5} placeholder="Envie sua sugestão, elogio ou crítica..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-color-main font-medium resize-none focus:border-[#D4AF37]" />
                 <button onClick={handleSendSuggestion} disabled={loading} className="w-full gradiente-ouro text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                    <Send size={16}/> {loading ? 'Enviando...' : 'Enviar Sugestão'}
                 </button>
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-2xl font-black font-display italic flex items-center gap-3"><Calendar className="text-[#D4AF37]"/> Meus Agendamentos</h3>
              <div className="space-y-4">
                 {clientAppointments.future.map(app => (
                    <div key={app.id} className="cartao-vidro rounded-[2rem] p-6 border-[#D4AF37]/20 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]"><Calendar size={20}/></div>
                          <div>
                             <p className="text-lg font-black italic">{app.serviceName}</p>
                             <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{new Date(app.date).toLocaleDateString('pt-BR')} • {app.startTime} com {app.professionalName}</p>
                          </div>
                       </div>
                       <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase ${app.status === 'CONCLUIDO_PAGO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-400'}`}>
                          {app.status.replace('_', ' ')}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {view === 'BOOKING' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 pb-20 animate-in fade-in">
           <header className="flex items-center gap-4 mb-10"><button onClick={() => setView('HOME')} className="p-3 rounded-xl border border-white/10 text-zinc-400"><ChevronLeft size={24}/></button><h2 className="text-3xl font-black font-display italic">Reservar Ritual</h2></header>
           
           <div className="cartao-vidro rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-[#D4AF37]/10 flex flex-col gap-10">
              {passo === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-2 text-center">
                  <h3 className="text-2xl font-black font-display italic">Escolha o Artífice</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {professionals.map(p => (
                       <button key={p.id} onClick={() => { setSelecao({...selecao, professionalId: p.id}); setPasso(3); }} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-[#D4AF37] transition-all flex flex-col items-center gap-4 group">
                          <div className="relative">
                             <img src={p.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-[#D4AF37]" alt="" />
                             <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-black text-[8px] font-black px-2 py-1 rounded-lg flex items-center gap-1">
                                <Heart size={8} fill="currentColor"/> {p.likes || 0}
                             </div>
                          </div>
                          <span className="text-[11px] font-black uppercase group-hover:text-[#D4AF37]">{p.name}</span>
                       </button>
                     ))}
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div className="text-center space-y-2"><h3 className="text-2xl font-black font-display italic">Data e Horário</h3></div>
                  {bookingError && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-[10px] font-black uppercase text-center">{bookingError}</div>}
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                     {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => {
                       const d = new Date(); d.setDate(d.getDate() + i);
                       const dateStr = d.toISOString().split('T')[0];
                       return (
                         <button key={i} onClick={() => { setSelecao({...selecao, date: dateStr}); setBookingError(null); }} className={`snap-center flex-shrink-0 w-24 h-28 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent scale-105 shadow-xl' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                            <span className="text-[8px] font-black uppercase opacity-60">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            <span className="text-2xl font-black font-display">{d.getDate()}</span>
                         </button>
                       );
                     })}
                  </div>
                  {selecao.date && (
                    <div className="space-y-6">
                      {(Object.entries(turnos) as [string, string[]][]).map(([turno, horarios]) => (
                        <div key={turno} className="space-y-4">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-4">{turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'} <div className="h-px flex-1 bg-white/5"></div></h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {horarios.map(t => {
                               const isOccupied = checkAvailability(selecao.date, t, selecao.professionalId);
                               return (
                                 <button key={t} disabled={isOccupied} onClick={() => { setSelecao({...selecao, time: t}); setPasso(4); }} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${isOccupied ? 'border-red-500/20 text-red-500/30 cursor-not-allowed bg-red-500/5' : selecao.time === t ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
                                    {t}
                                 </button>
                               );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {passo === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right-2 text-center">
                  <h3 className="text-2xl font-black font-display italic">Sua Identificação</h3>
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                     <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="text" placeholder="Nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
                     <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
                     <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="email" placeholder="E-mail para identificação" value={selecao.clientEmail} onChange={e => setSelecao({...selecao, clientEmail: e.target.value})} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl text-xs font-bold outline-none focus:border-[#D4AF37]" /></div>
                  </div>
                  <button onClick={handleConfirmBooking} disabled={loading} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl">
                     {loading ? 'Processando...' : 'Confirmar Ritual'}
                  </button>
               </div>
              )}
           </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
           <div className="cartao-vidro w-full max-w-md rounded-[3rem] p-12 space-y-8 border-[#D4AF37]/30 shadow-2xl">
              <div className="text-center space-y-4">
                 <MessageSquare className="w-12 h-12 text-[#D4AF37] mx-auto"/>
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
                 <div className="space-y-2">
                    <input type="text" placeholder="Seu nome (opcional)" value={newReview.userName} onChange={e => setNewReview({...newReview, userName: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-sm font-bold text-white focus:border-[#D4AF37]"/>
                    <input type="tel" placeholder="WhatsApp (opcional)" value={newReview.clientPhone} onChange={e => setNewReview({...newReview, clientPhone: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-sm font-bold text-white focus:border-[#D4AF37]"/>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className="flex-1 bg-white/5 py-5 rounded-xl text-[10px] font-black uppercase text-zinc-500">Voltar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}

      {success && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in zoom-in-95">
           <div className="cartao-vidro w-full max-w-md rounded-[3rem] p-12 space-y-8 border-[#D4AF37]/30 shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto shadow-2xl">
                 <Check className="text-black" size={40} strokeWidth={4}/>
              </div>
              <div className="space-y-4">
                 <h2 className="text-3xl font-black font-display italic">Ritual Confirmado!</h2>
                 <p className="text-color-sec leading-relaxed">Seu agendamento foi realizado com sucesso. Em breve você receberá uma confirmação via WhatsApp.</p>
              </div>
              <button onClick={() => { setSuccess(false); setView('HOME'); setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' }); setPasso(1); }} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
                 Voltar ao Início
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
