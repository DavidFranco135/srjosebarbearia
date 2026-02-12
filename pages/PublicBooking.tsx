import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown, CheckCircle2
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Service, Review, Professional, Client, Suggestion } from '../types';

interface PublicBookingProps {
  initialView?: 'HOME' | 'BOOKING' | 'LOGIN' | 'CLIENT_DASHBOARD';
}

const PublicBooking: React.FC<PublicBookingProps> = ({ initialView = 'HOME' }) => {
  const { services, professionals, appointments, addAppointment, addClient, updateClient, config, theme, likeProfessional, addShopReview, addSuggestion, clients, user, logout, suggestions } = useBarberStore();
  
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

  // States para o portal do membro
  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

  // State para modal de história do barbeiro
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // LOGICA PARA DESTAQUES: Mais agendados primeiro, depois o restante
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

  // Estados para drag scroll
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

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
  const filteredServices = useMemo(() => selectedCategory === 'Todos' ? services : services.filter(s => s.category === selectedCategory), [services, selectedCategory]);

  const handleConfirmBooking = async () => {
    if (!selecao.date || !selecao.time || !selecao.professionalId || !selecao.clientName || !selecao.clientPhone || !selecao.clientEmail) {
      alert("Por favor, preencha todos os dados de identificação.");
      return;
    }

    setLoading(true);
    setBookingError(null);

    const service = services.find(s => s.id === selecao.serviceId);
    const prof = professionals.find(p => p.id === selecao.professionalId);
    
    if (!service || !prof) {
      alert("Erro ao processar serviço ou profissional.");
      setLoading(false);
      return;
    }

    try {
      const [h, m] = selecao.time.split(':').map(Number);
      const totalMinutes = h * 60 + m + service.durationMinutes;
      const endTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`;

      await addAppointment({
        clientName: selecao.clientName,
        clientPhone: selecao.clientPhone,
        clientId: '',
        serviceId: selecao.serviceId,
        serviceName: service.name,
        professionalId: selecao.professionalId,
        professionalName: prof.name,
        date: selecao.date,
        startTime: selecao.time,
        endTime,
        price: service.price
      }, true);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setView('HOME');
        setPasso(1);
        setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' });
      }, 3000);
    } catch (err) {
      setBookingError("Erro ao confirmar o agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (newReview.comment.trim() && newReview.rating > 0) {
      await addShopReview(newReview);
      setShowReviewModal(false);
      setNewReview({ rating: 5, comment: '', userName: loggedClient?.name || '', clientPhone: loggedClient?.phone || '' });
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) return;
    await addSuggestion({
      clientName: loggedClient.name,
      clientPhone: loggedClient.phone,
      text: suggestionText
    });
    setSuggestionText('');
    alert("Sugestão enviada com sucesso!");
  };

  const handleSaveProfile = async () => {
    if (!loggedClient) return;
    await updateClient(loggedClient.id, editData);
    alert("Perfil atualizado!");
  };

  const clientAppointments = useMemo(() => {
    if (!loggedClient) return { past: [], future: [] };
    const filtered = appointments.filter(a => a.clientPhone === loggedClient.phone)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const now = new Date();
    now.setHours(0,0,0,0);

    return {
      past: filtered.filter(a => new Date(a.date) < now || a.status === 'CONCLUIDO_PAGO'),
      future: filtered.filter(a => new Date(a.date) >= now && a.status !== 'CONCLUIDO_PAGO' && a.status !== 'CANCELADO')
    };
  }, [loggedClient, appointments]);

  // ✅ NOVO: Filtrar sugestões do cliente logado
  const clientSuggestions = useMemo(() => {
    if (!loggedClient) return [];
    return suggestions.filter(s => s.clientPhone === loggedClient.phone);
  }, [loggedClient, suggestions]);

  const [clientDashboardTab, setClientDashboardTab] = useState<'appointments' | 'profile' | 'suggestions'>('appointments');

  const servicosAgrupados = useMemo(() => {
    const groups: { [key: string]: Service[] } = {};
    services.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [services]);

  const hoje = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  const nextDays = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  }), []);

  // ✅ CORREÇÃO: Filtrar apenas planos VIP ativos
  const activePlans = useMemo(() => {
    return (config.vipPlans || []).filter(plan => plan.status === 'ATIVO');
  }, [config.vipPlans]);

  if (view === 'CLIENT_DASHBOARD' && loggedClient) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37] flex items-center justify-center text-black text-3xl font-black italic">
                {loggedClient.name.charAt(0)}
              </div>
              <div>
                <h1 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Olá, {loggedClient.name}
                </h1>
                <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Portal do Membro
                </p>
              </div>
            </div>
            <button onClick={() => { logout(); setView('HOME'); }} className={`p-3 rounded-xl border ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
              <LogOut size={20}/>
            </button>
          </div>

          <div className="flex gap-3 border-b border-white/10 pb-4">
            <button onClick={() => setClientDashboardTab('appointments')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${clientDashboardTab === 'appointments' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
              Agendamentos
            </button>
            <button onClick={() => setClientDashboardTab('profile')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${clientDashboardTab === 'profile' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
              Perfil
            </button>
            <button onClick={() => setClientDashboardTab('suggestions')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${clientDashboardTab === 'suggestions' ? 'bg-[#D4AF37] text-black' : theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
              Sugestões
            </button>
          </div>

          {clientDashboardTab === 'appointments' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Próximos Agendamentos</h2>
                {clientAppointments.future.length === 0 ? (
                  <p className={`text-center py-10 text-sm italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Nenhum agendamento futuro.</p>
                ) : (
                  <div className="space-y-4">
                    {clientAppointments.future.map(app => (
                      <div key={app.id} className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.serviceName}</p>
                            <p className={`text-xs mt-1 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                              {new Date(app.date).toLocaleDateString('pt-BR')} às {app.startTime} • {app.professionalName}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ {app.price}</p>
                            <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Confirmado</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className={`text-xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Histórico</h2>
                {clientAppointments.past.length === 0 ? (
                  <p className={`text-center py-10 text-sm italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Nenhum histórico ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {clientAppointments.past.map(app => (
                      <div key={app.id} className={`rounded-xl p-4 border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{app.serviceName}</p>
                            <p className={`text-[10px] mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {new Date(app.date).toLocaleDateString('pt-BR')} • {app.professionalName}
                            </p>
                          </div>
                          <p className={`text-xs font-black ${app.status === 'CONCLUIDO_PAGO' ? 'text-emerald-500' : theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                            {app.status.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {clientDashboardTab === 'profile' && (
            <div className="space-y-8">
              <div className={`rounded-2xl p-8 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <h2 className={`text-xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Editar Perfil</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Nome</label>
                    <input 
                      type="text" 
                      value={editData.name} 
                      onChange={e => setEditData({...editData, name: e.target.value})} 
                      className={`w-full p-4 rounded-xl border outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>WhatsApp</label>
                    <input 
                      type="tel" 
                      value={editData.phone} 
                      onChange={e => setEditData({...editData, phone: e.target.value})} 
                      className={`w-full p-4 rounded-xl border outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-black uppercase tracking-widest mb-2 block ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>E-mail</label>
                    <input 
                      type="email" 
                      value={editData.email} 
                      onChange={e => setEditData({...editData, email: e.target.value})} 
                      className={`w-full p-4 rounded-xl border outline-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}
                    />
                  </div>
                  <button onClick={handleSaveProfile} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest">
                    Salvar Alterações
                  </button>
                </div>
              </div>

              <div className={`rounded-2xl p-8 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <h2 className={`text-xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Avaliação da Barbearia</h2>
                <p className={`text-sm mb-6 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Compartilhe sua experiência conosco</p>
                <button onClick={() => setShowReviewModal(true)} className="gradiente-ouro text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest">
                  Avaliar Agora
                </button>
              </div>
            </div>
          )}

          {/* ✅ NOVA ABA: Sugestões com Respostas do Admin */}
          {clientDashboardTab === 'suggestions' && (
            <div className="space-y-8">
              <div className={`rounded-2xl p-8 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                <h2 className={`text-xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nova Sugestão</h2>
                <textarea 
                  rows={4} 
                  placeholder="Deixe sua sugestão ou feedback..." 
                  value={suggestionText} 
                  onChange={e => setSuggestionText(e.target.value)} 
                  className={`w-full p-4 rounded-xl border outline-none resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400' : 'bg-white/5 border-white/10 text-white placeholder:text-zinc-600'}`}
                />
                <button onClick={handleSendSuggestion} disabled={!suggestionText.trim()} className="w-full mt-4 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-50">
                  Enviar Sugestão
                </button>
              </div>

              <div>
                <h2 className={`text-xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Minhas Sugestões</h2>
                {clientSuggestions.length === 0 ? (
                  <p className={`text-center py-10 text-sm italic ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>Você ainda não enviou nenhuma sugestão.</p>
                ) : (
                  <div className="space-y-4">
                    {clientSuggestions.map(sug => (
                      <div key={sug.id} className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              Enviada em {sug.date}
                            </p>
                          </div>
                          {sug.response && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-[#D4AF37]" />
                              <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">Respondida</span>
                            </div>
                          )}
                        </div>
                        
                        <div className={`p-4 rounded-xl border italic text-sm mb-4 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/5 text-zinc-300'}`}>
                          "{sug.text}"
                        </div>

                        {sug.response && (
                          <div className={`p-4 rounded-xl border-l-4 border-l-[#D4AF37] ${theme === 'light' ? 'bg-amber-50 border border-amber-200' : 'bg-[#D4AF37]/5 border border-[#D4AF37]/20'}`}>
                            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-amber-700' : 'text-[#D4AF37]'}`}>
                              Resposta da Administração:
                            </p>
                            <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                              {sug.response}
                            </p>
                            {sug.responseDate && (
                              <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                Respondido em {sug.responseDate}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'HOME') {
    return (
      <div className={`min-h-screen selection:bg-[#D4AF37]/30 relative ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        {/* Hero */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={config.heroBackground || config.coverImage} className={`w-full h-full object-cover transition-all duration-1000 ${theme === 'light' ? 'opacity-30' : 'opacity-40'}`} alt="Hero" />
            <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/50 to-transparent' : 'bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent'}`}></div>
          </div>

          <div className="relative z-10 text-center px-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="space-y-6">
              <h1 className={`text-5xl md:text-8xl font-black font-display italic tracking-tighter leading-none ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {config.name}
              </h1>
              <p className={`text-sm md:text-lg font-medium max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {config.description}
              </p>
            </div>
            <button onClick={() => setView('BOOKING')} className="gradiente-ouro text-black px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all">
              Agendar Ritual
            </button>
          </div>

          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronRight className={`rotate-90 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} size={32}/>
          </div>
        </section>

        {/* Destaques */}
        <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
            <div className="text-center space-y-6">
              <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Rituais Signature</h2>
              <p className={`text-sm md:text-base font-medium max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                Experiências que transformam o cuidado pessoal em arte.
              </p>
            </div>

            <div 
              ref={destaqueRef}
              onMouseDown={(e) => handleMouseDown(e, destaqueRef)}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={(e) => handleMouseMove(e, destaqueRef)}
              className="flex gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-6"
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              {sortedServicesForHighlights.slice(0, 6).map(svc => (
                <div key={svc.id} className={`flex-shrink-0 w-80 rounded-[2.5rem] overflow-hidden border group hover:border-[#D4AF37]/50 transition-all duration-500 relative ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0F0F0F] border-white/5'}`}>
                  <div className="h-80 overflow-hidden">
                    <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={svc.name} draggable={false} />
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                      <p className={`text-xs font-medium line-clamp-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{svc.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-[#D4AF37] font-display italic">R$ {svc.price}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{svc.durationMinutes} minutos</p>
                      </div>
                      <button onClick={() => handleBookingStart(svc)} className="gradiente-ouro text-black p-4 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl">
                        <ArrowRight size={20}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Todos os Serviços */}
        <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
            <div className="text-center space-y-6">
              <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Cardápio Completo</h2>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${selectedCategory === cat ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-white border-zinc-200 text-zinc-600' : 'bg-white/5 border-white/5 text-zinc-500'}`}>
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map(svc => (
                <div key={svc.id} className={`rounded-[2rem] overflow-hidden border group hover:border-[#D4AF37]/50 transition-all duration-500 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0F0F0F] border-white/5'}`}>
                  <div className="h-64 overflow-hidden">
                    <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={svc.name} />
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                    <p className={`text-xs line-clamp-2 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{svc.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-black text-[#D4AF37] font-display italic">R$ {svc.price}</p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{svc.durationMinutes} min</p>
                      </div>
                      <button onClick={() => handleBookingStart(svc)} className="gradiente-ouro text-black p-3 rounded-xl hover:scale-110 transition-all">
                        <ArrowRight size={18}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✅ NOVO: Seção de Planos VIP */}
        {activePlans.length > 0 && (
          <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
            <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3">
                  <Crown className="text-[#D4AF37]" size={40}/>
                  <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    Planos VIP
                  </h2>
                </div>
                <p className={`text-sm md:text-base font-medium max-w-2xl mx-auto ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  Experiências exclusivas para membros especiais
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activePlans.map(plan => (
                  <div key={plan.id} className={`rounded-[2.5rem] p-8 border-2 relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-500 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-lg' : 'bg-[#0F0F0F] border-white/10'}`}>
                    <div className="absolute top-6 right-6">
                      <Crown className="text-[#D4AF37] opacity-20 group-hover:opacity-100 transition-all" size={32}/>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                          {plan.name}
                        </h3>
                        <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          {plan.period === 'MENSAL' ? 'Mensal' : 'Anual'}
                        </p>
                      </div>

                      <div>
                        <p className="text-4xl font-black text-[#D4AF37] font-display italic">
                          R$ {plan.price}
                        </p>
                        {plan.discount && (
                          <p className={`text-xs font-black uppercase mt-2 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-500'}`}>
                            {plan.discount}% de desconto
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {plan.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="text-[#D4AF37] flex-shrink-0 mt-0.5" size={16}/>
                            <p className={`text-xs ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                              {benefit}
                            </p>
                          </div>
                        ))}
                      </div>

                      <a 
                        href={`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=Olá! Tenho interesse no plano ${plan.name} (${plan.period === 'MENSAL' ? 'Mensal' : 'Anual'}) por R$ ${plan.price}. Gostaria de mais informações.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest text-center hover:scale-105 transition-all shadow-xl"
                      >
                        Assinar Agora
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* A Experiência Signature */}
        <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
            <div className="text-center space-y-6">
              <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {config.aboutTitle || 'A Experiência'}
              </h2>
              <p className={`text-sm md:text-base font-medium max-w-3xl mx-auto leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                {config.aboutText}
              </p>
            </div>

            {config.aboutImage && (
              <div className="max-w-4xl mx-auto rounded-[3rem] overflow-hidden border-4 border-[#D4AF37]/20 shadow-2xl">
                <img src={config.aboutImage} className="w-full h-auto" alt="Sobre" />
              </div>
            )}
          </div>
        </section>

        {/* Mestres Barbeiros */}
        <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
            <div className="text-center space-y-6">
              <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Mestres Barbeiros
              </h2>
            </div>

            <div 
              ref={membroRef}
              onMouseDown={(e) => handleMouseDown(e, membroRef)}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={(e) => handleMouseMove(e, membroRef)}
              className="flex gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-6"
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              {professionals.map(prof => (
                <div key={prof.id} className={`flex-shrink-0 w-80 rounded-[2.5rem] p-8 border group hover:border-[#D4AF37]/50 transition-all duration-500 relative ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0F0F0F] border-white/5'}`}>
                  <div 
                    className="relative mb-6 cursor-pointer"
                    onClick={() => {
                      setSelectedProfessional(prof);
                      setShowProfessionalModal(true);
                    }}
                  >
                    <img src={prof.avatar} className="w-full aspect-square object-cover rounded-[2rem] border-2 border-white/10 group-hover:border-[#D4AF37]/50 transition-all" alt={prof.name} draggable={false} />
                    <div className="absolute -bottom-3 -right-3 bg-[#D4AF37] text-black p-3 rounded-xl shadow-xl">
                      <Sparkles size={20}/>
                    </div>
                  </div>
                  <h3 className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                    {prof.name}
                  </h3>
                  <p className={`text-xs font-black uppercase tracking-widest mb-6 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                    Mestre Barbeiro
                  </p>
                  <button onClick={() => likeProfessional(prof.id)} className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-[#D4AF37]' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]'}`}>
                    <Heart size={16} className="text-[#D4AF37]"/>
                    <span className="text-xs font-black">{prof.likes || 0}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avaliações */}
        {config.reviews && config.reviews.length > 0 && (
          <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
            <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
              <div className="text-center space-y-6">
                <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  O Que Dizem
                </h2>
              </div>

              <div 
                ref={experienciaRef}
                onMouseDown={(e) => handleMouseDown(e, experienciaRef)}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={(e) => handleMouseMove(e, experienciaRef)}
                className="flex gap-8 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing pb-6"
                style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
              >
                {config.reviews.map(rev => (
                  <div key={rev.id} className={`flex-shrink-0 w-96 rounded-[2.5rem] p-8 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#0F0F0F] border-white/5'}`}>
                    <Quote className="text-[#D4AF37] mb-6" size={32}/>
                    <div className="flex gap-1 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={16} className={i < rev.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}/>
                      ))}
                    </div>
                    <p className={`text-sm mb-6 italic leading-relaxed ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                      "{rev.comment}"
                    </p>
                    <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
                      {rev.userName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Localização */}
        <section className={`py-20 md:py-32 border-t ${theme === 'light' ? 'border-zinc-200' : 'border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
            <div className="text-center space-y-6">
              <h2 className={`text-4xl md:text-6xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Onde Nos Encontrar
              </h2>
              <p className={`text-sm md:text-base font-medium ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                {config.address}, {config.city} - {config.state}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-[2.5rem] overflow-hidden border-2 border-white/5">
                <iframe src={config.locationUrl} width="100%" height="450" style={{border:0}} allowFullScreen loading="lazy" className="w-full h-full"></iframe>
              </div>
              
              {config.locationImage && (
                <div className="rounded-[2.5rem] overflow-hidden border-2 border-white/5">
                  <img src={config.locationImage} className="w-full h-full object-cover" alt="Localização" />
                </div>
              )}
            </div>

            <div className="text-center space-y-4">
              <p className={`text-sm font-bold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                Horário: {config.openingTime} às {config.closingTime}
              </p>
              <a href={config.locationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 gradiente-ouro text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all">
                <MapPin size={20}/>
                Ver no Mapa
              </a>
            </div>
          </div>
        </section>

        {/* Footer com Redes Sociais CORRIGIDAS */}
        <footer className={`border-t py-12 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <p className={`text-2xl font-black font-display italic mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  {config.name}
                </p>
                <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>
                  © {new Date().getFullYear()} Todos os direitos reservados.
                </p>
              </div>

              {/* ✅ CORREÇÃO: Botões de Redes Sociais com Links Corretos */}
              <div className="flex items-center gap-4">
                {/* Botão Instagram */}
                <a 
                  href="https://www.instagram.com/srjosebarberpub/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-4 rounded-2xl border transition-all hover:border-[#D4AF37] hover:scale-110 ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                >
                  <Instagram size={24}/>
                </a>

                {/* ✅ NOVO: Botão WhatsApp */}
                <a 
                  href="https://wa.me/5521964340031" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`p-4 rounded-2xl border transition-all hover:border-[#D4AF37] hover:scale-110 ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/10 text-zinc-400'}`}
                >
                  <Phone size={24}/>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (view === 'BOOKING') {
    const selectedService = services.find(s => s.id === selecao.serviceId);
    const selectedProf = professionals.find(p => p.id === selecao.professionalId);

    if (success) {
      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
          <div className="text-center space-y-8 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <Check size={48} className="text-white"/>
            </div>
            <div>
              <h2 className={`text-4xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                Agendamento Confirmado!
              </h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Seu ritual foi agendado com sucesso. Até breve!
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="max-w-4xl mx-auto p-6 md:p-12">
          <button onClick={() => { setView('HOME'); setPasso(1); }} className={`flex items-center gap-2 mb-8 text-sm font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}>
            <ChevronLeft size={20}/> Voltar
          </button>

          <div className={`rounded-[3rem] p-8 md:p-12 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-xl' : 'bg-[#0F0F0F] border-white/5'}`}>
            <div className="mb-12">
              <h1 className={`text-3xl md:text-5xl font-black font-display italic mb-6 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                {passo === 1 && 'Escolha seu Ritual'}
                {passo === 2 && 'Escolha seu Mestre'}
                {passo === 3 && 'Data e Horário'}
                {passo === 4 && 'Confirmação'}
              </h1>
              
              <div className="flex gap-2">
                {[1,2,3,4].map(step => (
                  <div key={step} className={`h-2 flex-1 rounded-full transition-all ${step <= passo ? 'bg-[#D4AF37]' : theme === 'light' ? 'bg-zinc-200' : 'bg-white/10'}`}/>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {passo === 1 && (
                <div className="space-y-6">
                  {Object.entries(servicosAgrupados).map(([categoria, svcs]) => (
                    <div key={categoria}>
                      <button onClick={() => toggleCategory(categoria)} className={`w-full flex items-center justify-between p-4 rounded-2xl border mb-4 transition-all ${expandedCategories.includes(categoria) ? 'bg-[#D4AF37] text-black border-transparent' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-white/5 border-white/10 text-white'}`}>
                        <span className="font-black uppercase text-xs tracking-widest">{categoria}</span>
                        <ChevronRight className={`transition-transform ${expandedCategories.includes(categoria) ? 'rotate-90' : ''}`}/>
                      </button>
                      
                      {expandedCategories.includes(categoria) && (
                        <div className="grid gap-4 animate-in slide-in-from-top-2">
                          {svcs.map(svc => (
                            <button key={svc.id} onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }} className={`p-6 rounded-2xl border text-left transition-all hover:border-[#D4AF37]/50 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className={`text-lg font-black font-display italic mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h3>
                                  <p className={`text-xs mb-3 ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>{svc.description}</p>
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-[#D4AF37]">R$ {svc.price}</span>
                                    <span className={`text-xs font-black uppercase ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{svc.durationMinutes} min</span>
                                  </div>
                                </div>
                                <ArrowRight className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}/>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {passo === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-2">
                  {professionals.map(prof => (
                    <button key={prof.id} onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }} className={`p-6 rounded-2xl border text-left transition-all hover:border-[#D4AF37]/50 ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <img src={prof.avatar} className="w-16 h-16 rounded-xl object-cover border-2 border-white/10" alt={prof.name}/>
                        <div>
                          <h3 className={`font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h3>
                          <p className={`text-xs font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Mestre</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart size={14} className="text-[#D4AF37]"/>
                          <span className="text-xs font-black text-[#D4AF37]">{prof.likes || 0}</span>
                        </div>
                        <ArrowRight className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}/>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-widest mb-6 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-500'}`}>Escolha a Data</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                      {nextDays.map((d, i) => {
                        const dateStr = d.toISOString().split('T')[0];
                        return (
                          <button key={i} onClick={() => setSelecao({...selecao, date: dateStr})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
                          <h4 className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-4 ${theme === 'light' ? 'text-blue-600' : 'text-[#D4AF37]'}`}>{turno === 'manha' ? 'Manhã' : turno === 'tarde' ? 'Tarde' : 'Noite'} <div className={`h-px flex-1 ${theme === 'light' ? 'bg-zinc-200' : 'bg-white/5'}`}></div></h4>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {horarios.map(t => {
                               const isOccupied = checkAvailability(selecao.date, t, selecao.professionalId);
                               return (
                                 <button key={t} disabled={isOccupied} onClick={() => { setSelecao({...selecao, time: t}); setPasso(4); }} className={`py-3 rounded-xl border text-[10px] font-black transition-all ${isOccupied ? 'border-red-500/20 text-red-500/30 cursor-not-allowed bg-red-500/5' : selecao.time === t ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
                  <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Sua Identificação</h3>
                  <div className="space-y-4 max-w-sm mx-auto w-full">
                     <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="text" placeholder="Nome" value={selecao.clientName} onChange={e => setSelecao({...selecao, clientName: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
                     <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="tel" placeholder="WhatsApp" value={selecao.clientPhone} onChange={e => setSelecao({...selecao, clientPhone: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
                     <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]"/><input type="email" placeholder="E-mail para identificação" value={selecao.clientEmail} onChange={e => setSelecao({...selecao, clientEmail: e.target.value})} className={`w-full border p-5 pl-12 rounded-2xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} /></div>
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
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
           <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-8 shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="text-center space-y-4">
                 <MessageSquare className="w-12 h-12 text-[#D4AF37] mx-auto"/>
                 <h2 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Sua Experiência</h2>
              </div>
              <div className="space-y-8 text-center">
                 <div className="flex justify-center gap-3">
                    {[1,2,3,4,5].map(star => (
                       <button key={star} onClick={() => setNewReview({...newReview, rating: star})} className={`transition-all ${newReview.rating >= star ? 'text-[#D4AF37] scale-125' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}`}>
                          <Star size={32} fill={newReview.rating >= star ? 'currentColor' : 'none'}/>
                       </button>
                    ))}
                 </div>
                 <textarea rows={4} placeholder="Conte-nos como foi..." value={newReview.comment} onChange={e => setNewReview({...newReview, comment: e.target.value})} className={`w-full border p-5 rounded-2xl outline-none font-medium transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}/>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowReviewModal(false)} className={`flex-1 py-5 rounded-xl text-[10px] font-black uppercase ${theme === 'light' ? 'bg-zinc-100 text-zinc-700' : 'bg-white/5 text-zinc-500'}`}>Voltar</button>
                 <button onClick={handleAddReview} className="flex-1 gradiente-ouro text-black py-5 rounded-xl text-[10px] font-black uppercase shadow-xl">Enviar</button>
              </div>
           </div>
        </div>
      )}

      {showProfessionalModal && selectedProfessional && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
           <div className={`w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
              <div className="relative h-96">
                 <img src={selectedProfessional.avatar} className="w-full h-full object-contain bg-black" alt={selectedProfessional.name} />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                 <button 
                   onClick={() => setShowProfessionalModal(false)} 
                   className="absolute top-4 right-4 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-all"
                 >
                   <X size={20} />
                 </button>
                 <div className="absolute bottom-6 left-6 right-6">
                    <h2 className="text-4xl font-black font-display italic text-white mb-2">{selectedProfessional.name}</h2>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2 text-[#D4AF37]">
                          <Heart size={14} fill="currentColor" />
                          <span className="text-xs font-black">{selectedProfessional.likes || 0} curtidas</span>
                       </div>
                       <div className="text-white text-xs font-black uppercase tracking-widest">
                          {selectedProfessional.workingHours.start} - {selectedProfessional.workingHours.end}
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="p-10">
                 {selectedProfessional.description ? (
                   <>
                     <h3 className={`text-xl font-black font-display italic mb-4 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>História</h3>
                     <p className={`text-sm leading-relaxed whitespace-pre-line ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                       {selectedProfessional.description}
                     </p>
                   </>
                 ) : (
                   <p className={`text-sm italic text-center py-6 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>
                     Este profissional ainda não compartilhou sua história.
                   </p>
                 )}
                 
                 <button 
                   onClick={() => setShowProfessionalModal(false)} 
                   className="w-full mt-8 gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl"
                 >
                   Fechar
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default PublicBooking;
