import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, Calendar, Check, MapPin, ChevronLeft, ChevronRight, ArrowRight, Clock, User, Phone, 
  History, Sparkles, Instagram, Star, Heart, LogOut, MessageSquare, Quote, Mail, Upload, Save, Lock, Send, X, Crown
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

  // States para o portal do membro
  const [suggestionText, setSuggestionText] = useState('');
  const [editData, setEditData] = useState({ name: '', phone: '', email: '' });

  // State para modal de história do barbeiro
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);

  // State para controlar a aba ativa (adicionado para Planos VIP)
  const [activeTab, setActiveTab] = useState<'HOME' | 'PLANOS'>('HOME');

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
    setLoading(true); setBookingError(null);
    try {
      const service = services.find(s => s.id === selecao.serviceId);
      if (!service) { alert("Serviço não encontrado."); setLoading(false); return; }
      const professional = professionals.find(p => p.id === selecao.professionalId);
      if (!professional) { alert("Profissional não encontrado."); setLoading(false); return; }
      
      const endTimeObj = new Date(`1970-01-01T${selecao.time}:00`);
      endTimeObj.setMinutes(endTimeObj.getMinutes() + service.durationMinutes);
      const endTime = endTimeObj.toTimeString().substring(0, 5);

      await addAppointment({
        serviceId: selecao.serviceId,
        serviceName: service.name,
        professionalId: selecao.professionalId,
        professionalName: professional.name,
        date: selecao.date,
        startTime: selecao.time,
        endTime,
        clientName: selecao.clientName,
        clientPhone: selecao.clientPhone,
        clientEmail: selecao.clientEmail,
        price: service.price
      }, true);

      setSuccess(true);
      setTimeout(() => { setSuccess(false); setView('HOME'); setSelecao({ serviceId: '', professionalId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '' }); setPasso(1); }, 3000);
    } catch (err) {
      console.error(err);
      setBookingError("Erro ao confirmar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!newReview.comment.trim()) { alert("Escreva sua experiência."); return; }
    await addShopReview(newReview);
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '', userName: '', clientPhone: '' });
    alert("Avaliação enviada! Obrigado.");
  };

  const handleLogin = () => {
    const client = clients.find(c => (c.phone === loginIdentifier || c.email === loginIdentifier) && c.password === loginPassword);
    if (!client) {
      alert("Credenciais inválidas.");
      return;
    }
    setLoggedClient(client);
    setEditData({ name: client.name, phone: client.phone, email: client.email });
    setNewReview(prev => ({ ...prev, userName: client.name, clientPhone: client.phone }));
    setView('CLIENT_DASHBOARD');
  };

  const handleLogout = () => {
    setLoggedClient(null);
    setEditData({ name: '', phone: '', email: '' });
    setView('HOME');
  };

  const handleUpdateProfile = async () => {
    if (!loggedClient) return;
    try {
      await updateClient(loggedClient.id, editData);
      alert("Dados atualizados com sucesso!");
      const updated = clients.find(c => c.id === loggedClient.id);
      if (updated) setLoggedClient(updated);
    } catch (err) {
      alert("Erro ao atualizar dados.");
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || !loggedClient) {
      alert("Escreva sua sugestão.");
      return;
    }
    try {
      await addSuggestion({
        text: suggestionText,
        clientName: loggedClient.name,
        clientPhone: loggedClient.phone,
        status: 'unread',
        reply: ''
      });
      setSuggestionText('');
      alert("Sugestão enviada com sucesso!");
    } catch (err) {
      alert("Erro ao enviar sugestão.");
    }
  };

  const clientAppointments = useMemo(() => {
    if (!loggedClient) return [];
    return appointments.filter(a => a.clientPhone === loggedClient.phone || a.clientEmail === loggedClient.email);
  }, [appointments, loggedClient]);

  const selectedService = services.find(s => s.id === selecao.serviceId);
  const selectedProf = professionals.find(p => p.id === selecao.professionalId);

  if (view === 'LOGIN') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="absolute inset-0">
          <img src={config.loginBackground || config.coverImage} className={`w-full h-full object-cover grayscale ${theme === 'light' ? 'opacity-5' : 'opacity-20'}`} alt="" />
          <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-t from-[#F8F9FA] via-transparent to-[#F8F9FA]' : 'bg-gradient-to-t from-[#050505] via-transparent to-[#050505]'}`}></div>
        </div>
        <div className={`w-full max-w-md rounded-[3rem] p-12 space-y-10 shadow-2xl z-10 relative ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden shadow-xl">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <h1 className={`text-3xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
            <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Acesse seu painel exclusivo</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>E-mail ou WhatsApp</label>
              <input type="text" placeholder="seu@email.com ou (21)..." value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none text-xs font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
            </div>
            <div className="space-y-2">
              <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'opacity-40'}`}>Senha</label>
              <input type="password" placeholder="••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full border p-5 rounded-2xl outline-none text-xs font-bold transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
            </div>
            <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-6 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Entrar Agora</button>
          </div>
          <button onClick={() => setView('HOME')} className={`w-full text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-600 hover:text-blue-600' : 'opacity-40 hover:opacity-100 hover:text-[#D4AF37]'} transition-all`}>Voltar ao Site</button>
        </div>
      </div>
    );
  }

  if (view === 'CLIENT_DASHBOARD' && loggedClient) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <nav className={`border-b ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#0A0A0A] border-white/5'}`}>
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={config.logo} className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="" />
              <div>
                <h1 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Portal do Membro</h1>
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Bem-vindo, {loggedClient.name}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('HOME')} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HOME' ? 'gradiente-ouro text-black shadow-lg' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
              >
                Painel
              </button>
              <button 
                onClick={() => setActiveTab('PLANOS')} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PLANOS' ? 'gradiente-ouro text-black shadow-lg' : theme === 'light' ? 'bg-zinc-100 text-zinc-600' : 'bg-white/5 text-zinc-500'}`}
              >
                <Crown size={14} /> Planos VIP
              </button>
            </div>
            
            <button onClick={handleLogout} className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-100' : 'border-white/10 text-zinc-500 hover:bg-white/5'}`}>
              <LogOut size={16} /> <span className="text-[10px] font-black uppercase">Sair</span>
            </button>
          </div>
        </nav>

        {activeTab === 'HOME' && (
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-[2.5rem] p-10 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
                <h3 className={`text-xl font-black font-display italic mb-6 flex items-center gap-3 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><User className="text-[#D4AF37]"/> Meus Dados</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Nome</label>
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>WhatsApp</label>
                    <input type="tel" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-[9px] font-black uppercase tracking-widest ml-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>E-mail</label>
                    <input type="email" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} className={`w-full border p-4 rounded-xl text-xs font-bold outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`} />
                  </div>
                  <button onClick={handleUpdateProfile} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg"><Save size={16}/> Salvar Alterações</button>
                </div>
              </div>

              <div className={`rounded-[2.5rem] p-10 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
                <h3 className={`text-xl font-black font-display italic mb-6 flex items-center gap-3 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><MessageSquare className="text-[#D4AF37]"/> Enviar Sugestão</h3>
                <div className="space-y-4">
                  <textarea rows={5} placeholder="Compartilhe suas ideias conosco..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} className={`w-full border p-4 rounded-xl text-xs outline-none transition-all resize-none ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500' : 'bg-white/5 border-white/10 text-white focus:border-[#D4AF37]'}`}></textarea>
                  <button onClick={handleSendSuggestion} className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg"><Send size={16}/> Enviar Sugestão</button>
                </div>
              </div>
            </div>

            <div className={`rounded-[2.5rem] p-10 border ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
              <h3 className={`text-xl font-black font-display italic mb-8 flex items-center gap-3 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}><History className="text-[#D4AF37]"/> Meus Agendamentos</h3>
              {clientAppointments.length === 0 ? (
                <p className={`text-center text-sm italic py-10 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Você ainda não tem agendamentos.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clientAppointments.map(appt => (
                    <div key={appt.id} className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'}`}>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${appt.status === 'CONFIRMADO' ? 'bg-green-500/10 text-green-500' : appt.status === 'PENDENTE' ? 'bg-yellow-500/10 text-yellow-500' : appt.status === 'CONCLUIDO' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>{appt.status}</span>
                        </div>
                        <h4 className={`text-sm font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{appt.serviceName}</h4>
                        <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Com {appt.professionalName}</p>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          <Calendar size={12}/> {appt.date}
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-bold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
                          <Clock size={12}/> {appt.startTime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'PLANOS' && (
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4 mb-12">
              <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Planos VIP</h2>
              <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Escolha o plano ideal para você e aproveite benefícios exclusivos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Plano Mensal */}
              <div className={`rounded-[3rem] p-10 border-2 relative overflow-hidden ${theme === 'light' ? 'bg-white border-zinc-200 shadow-lg' : 'cartao-vidro border-[#D4AF37]/30'}`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                        <Crown className="text-[#D4AF37]" size={32} />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Mensal</h3>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Flexibilidade Total</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ 150</span>
                      <span className={`text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>/mês</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {[
                      'Cortes ilimitados',
                      'Agendamento prioritário',
                      'Desconto de 20% em produtos',
                      'Atendimento exclusivo',
                      'Cancelamento a qualquer momento'
                    ].map((benefit, idx) => (
                      <li key={idx} className={`flex items-center gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <Check className="text-[#D4AF37] flex-shrink-0" size={18} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => {
                      const whatsappMessage = encodeURIComponent(`Olá! Gostaria de assinar o Plano Mensal VIP (R$ 150/mês) da ${config.name}. Meu nome é ${loggedClient.name}.`);
                      window.open(`https://wa.me/5521964340031?text=${whatsappMessage}`, '_blank');
                    }}
                    className="w-full gradiente-ouro text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                  >
                    Assinar Plano Mensal
                  </button>
                </div>
              </div>

              {/* Plano Anual */}
              <div className={`rounded-[3rem] p-10 border-2 relative overflow-hidden ${theme === 'light' ? 'bg-gradient-to-br from-[#D4AF37]/5 to-white border-[#D4AF37] shadow-xl' : 'bg-gradient-to-br from-[#D4AF37]/10 to-black/50 border-[#D4AF37]'}`}>
                <div className="absolute top-6 right-6 bg-[#D4AF37] text-black border px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                  Mais Popular
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center">
                        <Crown className="text-[#D4AF37]" size={32} />
                      </div>
                      <div>
                        <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Anual</h3>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>Economia Máxima</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-5xl font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>R$ 1.440</span>
                      <span className={`text-sm ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>/ano</span>
                    </div>
                    <p className="text-[#D4AF37] font-black text-sm mt-2">Economize R$ 360 por ano!</p>
                  </div>

                  <ul className="space-y-4 mb-10">
                    {[
                      'Tudo do plano mensal',
                      'Cortes ilimitados o ano todo',
                      'Desconto de 30% em produtos',
                      'Brinde exclusivo de boas-vindas',
                      'Agendamento prioritário VIP',
                      '2 meses de desconto'
                    ].map((benefit, idx) => (
                      <li key={idx} className={`flex items-center gap-3 text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <Check className="text-[#D4AF37] flex-shrink-0" size={18} />
                        <span className="font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => {
                      const whatsappMessage = encodeURIComponent(`Olá! Gostaria de assinar o Plano Anual VIP (R$ 1.440/ano) da ${config.name}. Meu nome é ${loggedClient.name}.`);
                      window.open(`https://wa.me/5521964340031?text=${whatsappMessage}`, '_blank');
                    }}
                    className="w-full bg-[#D4AF37] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all"
                  >
                    Assinar Plano Anual
                  </button>
                </div>
              </div>
            </div>

            <div className={`max-w-3xl mx-auto rounded-[2rem] p-8 border ${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20'}`}>
              <div className="flex items-start gap-4">
                <Sparkles className="text-[#D4AF37] flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className={`font-black text-lg mb-2 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Benefícios VIP Inclusos</h4>
                  <p className={`text-sm ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    Além dos cortes ilimitados, você terá acesso a descontos exclusivos em todos os produtos da loja, 
                    agendamento prioritário sem filas, atendimento personalizado e muito mais. Faça parte do clube VIP!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className={`text-center space-y-8 rounded-[3rem] p-16 max-w-lg ${theme === 'light' ? 'bg-white border border-zinc-200 shadow-xl' : 'cartao-vidro border-[#D4AF37]/30'} animate-in zoom-in duration-500`}>
          <div className="w-32 h-32 rounded-full bg-[#D4AF37]/10 mx-auto flex items-center justify-center">
            <Check className="text-[#D4AF37]" size={64} />
          </div>
          <div className="space-y-4">
            <h2 className={`text-4xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agendamento Confirmado!</h2>
            <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Seu ritual foi reservado com sucesso.<br/>Aguardamos você na data marcada.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      {view === 'HOME' && (
        <>
          <nav className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-all ${theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-[#0A0A0A]/80 border-white/5'}`}>
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={config.logo} className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="Logo" />
                <div>
                  <h1 className={`text-xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h1>
                  <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{config.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => window.open('https://www.instagram.com/srjosebarberpub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', '_blank')} 
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent' : 'border-white/10 text-zinc-500 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent'}`}
                >
                  <Instagram size={16} /> <span className="text-[10px] font-black uppercase hidden sm:inline">Siga no Instagram</span>
                </button>
                
                <button 
                  onClick={() => window.open('https://wa.me/5521964340031', '_blank')} 
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-green-500 hover:text-white hover:border-transparent' : 'border-white/10 text-zinc-500 hover:bg-green-500 hover:text-white hover:border-transparent'}`}
                >
                  <Phone size={16} /> <span className="text-[10px] font-black uppercase hidden sm:inline">WhatsApp</span>
                </button>
                
                <button onClick={() => setView('LOGIN')} className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-zinc-100' : 'border-white/10 text-zinc-500 hover:bg-white/5'}`}>
                  <User size={16} /> <span className="text-[10px] font-black uppercase hidden sm:inline">Portal Membro</span>
                </button>
                <button onClick={() => setView('BOOKING')} className="gradiente-ouro px-6 py-3 rounded-xl text-black font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-all">Agendar</button>
              </div>
            </div>
          </nav>

          <section className="relative h-screen flex items-center justify-center overflow-hidden">
            <img src={config.coverImage} className={`absolute inset-0 w-full h-full object-cover ${theme === 'light' ? 'opacity-20' : 'opacity-30'}`} alt="Hero" />
            <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/50 to-transparent' : 'bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent'}`}></div>
            <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h1 className={`text-6xl md:text-8xl font-black font-display italic tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h1>
              <p className={`text-xl md:text-2xl font-medium ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>{config.description}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                <button onClick={() => setView('BOOKING')} className="gradiente-ouro text-black px-10 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-110 transition-all flex items-center gap-3">
                  <Scissors size={20} /> Agende Seu Ritual
                </button>
                <button onClick={() => setShowReviewModal(true)} className={`px-10 py-6 rounded-[2rem] border-2 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 ${theme === 'light' ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100' : 'border-white/20 text-white hover:bg-white/5'}`}>
                  <Star size={20} /> Avaliar Experiência
                </button>
              </div>
            </div>
          </section>

          <section className={`py-24 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'}`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                <h2 className={`text-4xl md:text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Rituais</h2>
                <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Experiências exclusivas de cuidado masculino.</p>
              </div>

              <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide justify-center">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${selectedCategory === cat ? 'gradiente-ouro text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 'bg-white/5 text-zinc-500 border-white/5'}`}>{cat}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map(svc => (
                  <div key={svc.id} className={`group rounded-[2.5rem] overflow-hidden border transition-all hover:scale-105 cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm hover:shadow-xl' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/40'}`} onClick={() => handleBookingStart(svc)}>
                    <div className="relative h-64 overflow-hidden">
                      <img src={svc.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" alt={svc.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-2xl font-black font-display italic text-white mb-2">{svc.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#D4AF37] font-black text-xl">R$ {svc.price}</span>
                          <div className="flex items-center gap-2 text-white/80 text-xs font-bold">
                            <Clock size={14} /> {svc.durationMinutes} min
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`p-6 ${theme === 'light' ? 'bg-white' : 'bg-black/20'}`}>
                      <p className={`text-xs leading-relaxed ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{svc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`py-24 ${theme === 'light' ? 'bg-zinc-50' : 'bg-[#050505]'}`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                <h2 className={`text-4xl md:text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Nossos Mestres</h2>
                <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Profissionais dedicados à arte da barbearia.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {professionals.map(prof => (
                  <div 
                    key={prof.id} 
                    className={`group rounded-[2.5rem] overflow-hidden border transition-all hover:scale-105 ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm hover:shadow-xl' : 'cartao-vidro border-white/5 hover:border-[#D4AF37]/40'}`}
                  >
                    <div className="relative h-80 overflow-hidden cursor-pointer" onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}>
                      <img src={prof.avatar} className="w-full h-full object-contain bg-black group-hover:scale-110 transition-all duration-500" alt={prof.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-2xl font-black font-display italic text-white mb-2">{prof.name}</h3>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">{prof.workingHours.start} - {prof.workingHours.end}</p>
                      </div>
                    </div>
                    <div className={`p-6 flex items-center justify-between ${theme === 'light' ? 'bg-white' : 'bg-black/20'}`}>
                      <button onClick={() => likeProfessional(prof.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${theme === 'light' ? 'bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-500' : 'bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500'}`}>
                        <Heart size={16} /> <span className="text-xs font-black">{prof.likes || 0}</span>
                      </button>
                      {prof.description && (
                        <button 
                          onClick={() => { setSelectedProfessional(prof); setShowProfessionalModal(true); }}
                          className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-blue-600 hover:text-blue-700' : 'text-[#D4AF37] hover:text-[#D4AF37]/80'} transition-all`}
                        >
                          Ver História →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {config.reviews && config.reviews.length > 0 && (
            <section className={`py-24 ${theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'}`}>
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16 space-y-4">
                  <h2 className={`text-4xl md:text-5xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Experiências Reais</h2>
                  <p className={`text-sm ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>O que nossos membros dizem sobre nós.</p>
                </div>
                <div 
                  ref={experienciaRef}
                  className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                  onMouseDown={(e) => handleMouseDown(e, experienciaRef)}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={(e) => handleMouseMove(e, experienciaRef)}
                >
                  {config.reviews.map(rev => (
                    <div key={rev.id} className={`flex-shrink-0 w-80 rounded-[2rem] p-8 border snap-start ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'cartao-vidro border-white/5'}`}>
                      <div className="flex items-center gap-2 mb-6">
                        {Array.from({length: 5}).map((_, i) => (
                          <Star key={i} size={16} className={`${i < rev.rating ? 'text-[#D4AF37] fill-[#D4AF37]' : theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}`} />
                        ))}
                      </div>
                      <Quote className={`mb-4 ${theme === 'light' ? 'text-zinc-300' : 'text-zinc-800'}`} size={32} />
                      <p className={`text-sm leading-relaxed italic mb-6 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-400'}`}>"{rev.comment}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                          <User className="text-[#D4AF37]" size={20} />
                        </div>
                        <div>
                          <p className={`text-xs font-black ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{rev.userName}</p>
                          <p className={`text-[9px] font-bold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-600'}`}>{rev.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <footer className={`border-t py-12 ${theme === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-[#050505] border-white/5'}`}>
            <div className="max-w-7xl mx-auto px-6 text-center">
              <div className="flex items-center justify-center gap-6 mb-6">
                <button 
                  onClick={() => window.open('https://www.instagram.com/srjosebarberpub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', '_blank')}
                  className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent' : 'border-white/10 text-zinc-500 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent'}`}
                >
                  <Instagram size={20} />
                </button>
                <button 
                  onClick={() => window.open('https://wa.me/5521964340031', '_blank')}
                  className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'border-zinc-300 text-zinc-600 hover:bg-green-500 hover:text-white hover:border-transparent' : 'border-white/10 text-zinc-500 hover:bg-green-500 hover:text-white hover:border-transparent'}`}
                >
                  <Phone size={20} />
                </button>
              </div>
              <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-600'}`}>© 2026 {config.name}. Todos os direitos reservados.</p>
            </div>
          </footer>
        </>
      )}

      {view === 'BOOKING' && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl animate-in zoom-in-95 ${theme === 'light' ? 'bg-black/70' : 'bg-black/95'}`}>
          <div className={`w-full max-w-3xl rounded-[3.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide ${theme === 'light' ? 'bg-white border border-zinc-200' : 'cartao-vidro border-[#D4AF37]/30'}`}>
            <div className="sticky top-0 z-20 gradiente-ouro p-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black font-display italic text-black">Agendamento</h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/60">Configure seu ritual</p>
              </div>
              <button onClick={() => { setView('HOME'); setPasso(1); }} className="p-3 bg-black/10 rounded-xl text-black hover:bg-black/20 transition-all"><X size={24} /></button>
            </div>

            <div className={`p-10 space-y-10 ${theme === 'light' ? 'bg-white' : ''}`}>
              <div className="flex gap-2">
                {[1,2,3,4].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${passo >= s ? 'bg-[#D4AF37]' : theme === 'light' ? 'bg-zinc-200' : 'bg-white/10'}`}></div>
                ))}
              </div>

              {bookingError && <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm font-bold">{bookingError}</div>}

              {passo === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <h3 className={`text-2xl font-black font-display italic text-center ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha Seu Ritual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(svc => (
                      <button key={svc.id} onClick={() => { setSelecao({...selecao, serviceId: svc.id}); setPasso(2); }} className={`text-left rounded-2xl p-6 border transition-all ${selecao.serviceId === svc.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : theme === 'light' ? 'border-zinc-200 bg-zinc-50 hover:border-blue-400' : 'border-white/5 bg-white/5 hover:border-[#D4AF37]/50'}`}>
                        <div className="flex gap-4">
                          <img src={svc.image} className="w-20 h-20 rounded-xl object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{svc.name}</h4>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-[#D4AF37] font-black">R$ {svc.price}</span>
                              <span className={`${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'} font-bold`}>{svc.durationMinutes} min</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {passo === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <div className="text-center space-y-2">
                    <h3 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Escolha Seu Mestre</h3>
                    {selectedService && <p className={`text-xs ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>Para o ritual: {selectedService.name}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {professionals.map(prof => (
                      <button key={prof.id} onClick={() => { setSelecao({...selecao, professionalId: prof.id}); setPasso(3); }} className={`rounded-2xl overflow-hidden border transition-all ${selecao.professionalId === prof.id ? 'border-[#D4AF37] shadow-lg' : theme === 'light' ? 'border-zinc-200 hover:border-blue-400' : 'border-white/5 hover:border-[#D4AF37]/50'}`}>
                        <img src={prof.avatar} className="w-full h-48 object-contain bg-black" alt={prof.name} />
                        <div className={`p-4 ${theme === 'light' ? 'bg-zinc-50' : 'bg-white/5'}`}>
                          <h4 className={`text-sm font-black mb-1 ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{prof.name}</h4>
                          <p className={`text-[10px] font-bold ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>{prof.workingHours.start} - {prof.workingHours.end}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {passo === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-2">
                  <h3 className={`text-2xl font-black font-display italic text-center ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Data & Horário</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {Array.from({length: 30}).map((_, i) => {
                       const d = new Date();
                       d.setDate(d.getDate() + i);
                       const dateStr = d.toISOString().split('T')[0];
                       return (
                         <button key={i} onClick={() => setSelecao({...selecao, date: dateStr, time: ''})} className={`flex-shrink-0 w-20 py-4 rounded-2xl border text-center transition-all ${selecao.date === dateStr ? 'bg-[#D4AF37] text-black border-transparent shadow-lg' : theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-blue-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-[#D4AF37]/50'}`}>
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
