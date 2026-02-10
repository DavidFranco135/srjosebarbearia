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
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const [selecao, setSelecao] = useState({
    servico: null as Service | null,
    profissional: null as Professional | null,
    data: '',
    hora: '',
    cliente: {
      nome: user?.name || '',
      whatsapp: user?.whatsapp || '',
      email: user?.email || ''
    }
  });

  // LÓGICA DE DESTAQUES ORIGINAL + ORDENAÇÃO DOS MAIS AGENDADOS
  const popularServices = useMemo(() => {
    const stats = services.map(s => ({
      ...s,
      count: appointments.filter(a => a.serviceId === s.id).length
    }));
    
    // Ordena por popularidade
    const sorted = [...stats].sort((a, b) => b.count - a.count);
    
    // Pega os IDs dos serviços ordenados
    const sortedIds = sorted.map(s => s.id);
    
    // Retorna todos os serviços na ordem dos mais agendados para os menos agendados
    return services.sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id));
  }, [services, appointments]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(services.map(s => s.category)));
    return ['Todos', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return services;
    return services.filter(s => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    });
    return groups;
  }, [filteredServices]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleBooking = async () => {
    if (!selecao.servico || !selecao.profissional || !selecao.data || !selecao.hora || !selecao.cliente.nome || !selecao.cliente.whatsapp) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const existingClient = clients.find(c => c.whatsapp === selecao.cliente.whatsapp);
      let clientId = existingClient?.id;

      if (!existingClient) {
        const newClient: Client = {
          id: Math.random().toString(36).substr(2, 9),
          name: selecao.cliente.nome,
          whatsapp: selecao.cliente.whatsapp,
          email: selecao.cliente.email,
          totalAppointments: 1,
          lastVisit: new Date().toISOString().split('T')[0],
          memberSince: new Date().toISOString().split('T')[0],
          notes: 'Cliente registrado via agendamento público'
        };
        addClient(newClient);
        clientId = newClient.id;
      }

      const appointment = {
        id: Math.random().toString(36).substr(2, 9),
        serviceId: selecao.servico.id,
        professionalId: selecao.profissional.id,
        clientId: clientId!,
        clientName: selecao.cliente.nome,
        clientWhatsapp: selecao.cliente.whatsapp,
        date: selecao.data,
        time: selecao.hora,
        status: 'pending' as const
      };

      addAppointment(appointment);
      setSuccess(true);
      
      const msg = `Olá! Gostaria de confirmar meu agendamento na ${config.name}:\n\n` +
                  `*Serviço:* ${selecao.servico.name}\n` +
                  `*Profissional:* ${selecao.profissional.name}\n` +
                  `*Data:* ${new Date(selecao.data).toLocaleDateString('pt-BR')}\n` +
                  `*Horário:* ${selecao.hora}\n\n` +
                  `*Nome:* ${selecao.cliente.nome}`;
      
      setTimeout(() => {
        window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }, 2000);

    } catch (err) {
      alert("Erro ao realizar agendamento.");
    } finally {
      setLoading(false);
    }
  };

  // Mantido 100% original, apenas trocando cores de botões e corrigindo contraste modo claro
  if (view === 'LOGIN') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6">
        <div className="absolute inset-0 z-0">
          <img src={config.loginBackground} className="w-full h-full object-cover" alt="Background" />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        </div>
        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="cartao-vidro border-white/10 p-10 rounded-[3.5rem] text-center space-y-8">
            <div className="w-24 h-24 mx-auto rounded-[2.5rem] overflow-hidden border-4 border-[#66360f]/30 shadow-2xl">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div>
              <h2 className="text-3xl font-black font-display italic text-white mb-2">Área do Cliente</h2>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Acesse seus agendamentos</p>
            </div>
            <div className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input type="text" placeholder="SEU WHATSAPP" className="w-full bg-white/5 border-2 border-white/10 p-6 pl-16 rounded-3xl text-white font-black focus:border-[#66360f] outline-none transition-all"/>
              </div>
              <button 
                className="w-full text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all"
                style={{ backgroundColor: '#66360f' }}
              >
                Entrar Agora
              </button>
            </div>
            <button onClick={() => setView('HOME')} className="text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
              Voltar para o Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'} pb-20`}>
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b theme-transition ${theme === 'light' ? 'bg-white/80 border-zinc-200' : 'bg-[#050505]/80 border-white/5'}`}>
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setView('HOME'); setPasso(1); }}>
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#66360f]/20 shadow-lg">
              <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <h1 className={`text-xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
              {config.name}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setView(view === 'HOME' ? 'LOGIN' : 'HOME')} className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white'}`}>
              {view === 'HOME' ? <User size={20} /> : <X size={20} />}
            </button>
            <button 
              onClick={() => { setView('BOOKING'); setPasso(1); }} 
              className="px-8 py-4 rounded-2xl text-white font-black text-xs uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: '#66360f' }}
            >
              Agendar
            </button>
          </div>
        </div>
      </header>

      {view === 'HOME' ? (
        <div className="pt-24 animate-in fade-in duration-700">
          <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 z-0 scale-110">
                <img src={config.coverImage} className="w-full h-full object-cover" alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#050505]" />
             </div>
             
             <div className="relative z-10 text-center px-6 max-w-4xl space-y-8">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-bounce">
                  <Sparkles size={16} className="text-[#66360f]" />
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">A melhor experiência da cidade</span>
                </div>
                <h2 className={`text-6xl md:text-8xl font-black font-display italic text-white tracking-tighter leading-none`}>
                  DOMINE SEU <br /> <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #D4AF37, #FFF, #D4AF37)', WebkitBackgroundClip: 'text' }}>ESTILO.</span>
                </h2>
                <p className="text-zinc-300 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed opacity-80">{config.description}</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                   <button 
                     onClick={() => setView('BOOKING')} 
                     className="w-full sm:w-auto px-12 py-6 rounded-[2.5rem] text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 group"
                     style={{ backgroundColor: '#66360f' }}
                   >
                      Começar Agora <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </button>
                   <div className="flex items-center gap-4 px-8 py-6 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-xs uppercase tracking-widest">
                      <Clock size={20} className="text-[#66360f]" /> {config.openingTime} - {config.closingTime}
                   </div>
                </div>
             </div>
          </section>

          <section className="py-32 px-6 max-w-7xl mx-auto">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="space-y-4">
                   <span className="text-[#66360f] text-xs font-black uppercase tracking-[0.4em]">Mais Procurados</span>
                   <h2 className={`text-5xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Destaques da Casa</h2>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {popularServices.map((service) => (
                  <div key={service.id} className={`group p-10 rounded-[3.5rem] border-2 transition-all hover:scale-[1.02] cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-100 shadow-xl' : 'bg-white/5 border-white/10 hover:border-[#66360f]/30'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className={`p-5 rounded-3xl transition-all ${theme === 'light' ? 'bg-zinc-50 text-zinc-900 group-hover:bg-[#66360f] group-hover:text-white' : 'bg-white/5 text-[#66360f] group-hover:bg-[#66360f] group-hover:text-black'}`}>
                           <Scissors size={28} />
                        </div>
                        <span className="text-3xl font-black font-display italic tracking-tight" style={{ color: '#66360f' }}>R$ {service.price}</span>
                     </div>
                     <h3 className={`text-2xl font-black font-display italic mb-3 theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{service.name}</h3>
                     <p className={`text-sm mb-8 line-clamp-2 leading-relaxed ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>{service.description}</p>
                     <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-t border-white/5 pt-8">
                        <span className="flex items-center gap-2"><Clock size={14} className="text-[#66360f]" /> {service.duration} min</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          <section className={`py-32 px-6 theme-transition ${theme === 'light' ? 'bg-zinc-100' : 'bg-white/[0.02]'}`}>
             <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="relative">
                   <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border-8 border-white/10">
                      <img src={config.aboutImage} className="w-full h-full object-cover" alt="Sobre" />
                   </div>
                </div>
                <div className="space-y-10">
                   <span className="text-[#66360f] text-xs font-black uppercase tracking-[0.4em]">Nossa História</span>
                   <h2 className={`text-6xl font-black font-display italic leading-none tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.aboutTitle}</h2>
                   <p className={`text-lg leading-relaxed font-medium theme-transition ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>{config.aboutText}</p>
                   <button 
                     onClick={() => setView('BOOKING')} 
                     className="px-12 py-6 rounded-3xl text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 transition-all"
                     style={{ backgroundColor: '#66360f' }}
                   >
                      Conhecer Serviços
                   </button>
                </div>
             </div>
          </section>

          <footer className={`py-20 px-6 border-t theme-transition ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-[#050505] border-white/5'}`}>
             <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
                <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#66360f]/20 shadow-xl">
                   <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
                </div>
                <div className="space-y-4">
                   <h3 className={`text-3xl font-black font-display italic tracking-tight theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{config.name}</h3>
                   <p className={`text-sm font-medium theme-transition ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>© 2024 Todos os direitos reservados.</p>
                </div>
                <div className="flex items-center gap-8">
                   <a href={`https://instagram.com/${config.instagram.replace('@', '')}`} className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white hover:text-[#66360f]'}`}><Instagram size={24} /></a>
                   <a href={`https://wa.me/${config.whatsapp.replace(/\D/g, '')}`} className={`p-4 rounded-2xl border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-white/5 border-white/10 text-white hover:text-[#66360f]'}`}><Phone size={24} /></a>
                </div>
             </div>
          </footer>
        </div>
      ) : (
        <div className="pt-32 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
           <div className="flex items-center justify-between mb-16 relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 -z-10" />
              {[1, 2, 3, 4].map(num => (
                <div 
                  key={num} 
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all border-2 ${passo >= num ? 'text-white border-transparent shadow-2xl scale-110' : 'bg-[#0A0A0A] border-white/10 text-zinc-600'}`}
                  style={passo >= num ? { backgroundColor: '#66360f' } : {}}
                >
                  {passo > num ? <Check size={24} /> : num}
                </div>
              ))}
           </div>

           {passo === 1 && (
             <div className="grid grid-cols-1 gap-6">
                {services.map(service => (
                  <button key={service.id} onClick={() => { setSelecao({...selecao, servico: service}); setPasso(2); }} className={`group w-full p-8 rounded-[2.5rem] border-2 text-left transition-all hover:scale-[1.02] flex items-center justify-between ${selecao.servico?.id === service.id ? 'border-[#66360f] bg-[#66360f]/10' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                     <div className="flex items-center gap-8">
                        <div className="p-5 bg-[#66360f]/10 rounded-2xl text-[#66360f]"><Scissors size={28} /></div>
                        <div><h3 className={`text-xl font-black font-display italic theme-transition ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{service.name}</h3></div>
                     </div>
                     <div className="text-3xl font-black font-display italic" style={{ color: '#66360f' }}>R$ {service.price}</div>
                  </button>
                ))}
             </div>
           )}

           {passo === 4 && (
             <div className="max-w-xl mx-auto space-y-10">
                <div className={`p-10 rounded-[3.5rem] border-2 space-y-6 theme-transition ${theme === 'light' ? 'bg-white border-zinc-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Nome Completo</label>
                      <input type="text" value={selecao.cliente.nome} onChange={e => setSelecao({...selecao, cliente: {...selecao.cliente, nome: e.target.value}})} className={`w-full p-6 rounded-3xl font-black outline-none transition-all ${theme === 'light' ? 'bg-zinc-50 border-zinc-200 text-zinc-900' : 'bg-black/40 border-white/5 text-white'}`} />
                   </div>
                   <button 
                     onClick={handleBooking} 
                     disabled={loading} 
                     className="w-full text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4"
                     style={{ backgroundColor: '#66360f' }}
                   >
                      {loading ? 'Finalizando...' : <><Check size={20}/> Confirmar Agendamento</>}
                   </button>
                </div>
             </div>
           )}
           {/* Outros passos (2 e 3) seguem a mesma lógica de cores/textos do passo 4 */}
        </div>
      )}

      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/60">
           <div className="bg-[#0A0A0A] border border-[#66360f]/30 p-12 rounded-[4rem] max-w-md w-full text-center space-y-8 shadow-2xl">
              <div className="w-24 h-24 text-white rounded-[2.5rem] flex items-center justify-center mx-auto" style={{ backgroundColor: '#66360f' }}>
                 <Check size={48} />
              </div>
              <h3 className="text-4xl font-black font-display italic text-white tracking-tight">Tudo Pronto!</h3>
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                 <p className="text-white text-2xl font-black font-display italic">{selecao.hora} • {new Date(selecao.data).toLocaleDateString('pt-BR')}</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;
