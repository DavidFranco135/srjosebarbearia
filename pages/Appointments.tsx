import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, Check, X, 
  Calendar, Scissors, LayoutGrid, List, UserPlus, DollarSign, RefreshCw, Filter
} from 'lucide-react';
import { useBarberStore } from '../store';
import { Appointment, Client } from '../types';

const Appointments: React.FC = () => {
  const { 
    appointments, professionals, services, clients,
    addAppointment, updateAppointmentStatus, addClient, rescheduleAppointment, theme
  } = useBarberStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compactView, setCompactView] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [newApp, setNewApp] = useState({ clientId: '', serviceId: '', professionalId: '', startTime: '09:00' });
  const [quickClient, setQuickClient] = useState({ name: '', phone: '' });

  // NOVOS ESTADOS DE FILTRAGEM
  const [filterMode, setFilterMode] = useState<'DAY' | 'MONTH' | 'ALL'>('DAY');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // Formato YYYY-MM

  const hours = useMemo(() => Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`), []);
  
  // LOGICA DE FILTRO ATUALIZADA
  const appointmentsToday = useMemo(() => {
    if (filterMode === 'ALL') return appointments;
    if (filterMode === 'MONTH') return appointments.filter(a => a.date.startsWith(selectedMonth));
    return appointments.filter(a => a.date === currentDate);
  }, [appointments, currentDate, filterMode, selectedMonth]);

  const stats = useMemo(() => ({
    total: appointmentsToday.length,
    completed: appointmentsToday.filter(a => a.status === 'COMPLETED').length,
    revenue: appointmentsToday.filter(a => a.status === 'COMPLETED').reduce((acc, curr) => acc + curr.price, 0)
  }), [appointmentsToday]);

  const handleAddQuickAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let clientId = newApp.clientId;
      if (showQuickClient) {
        const client = await addClient({ name: quickClient.name, phone: quickClient.phone, email: '' });
        clientId = client.id;
      }
      const service = services.find(s => s.id === newApp.serviceId);
      const professional = professionals.find(p => p.id === newApp.professionalId);
      
      const [h, m] = newApp.startTime.split(':').map(Number);
      const duration = service?.durationMinutes || 30;
      const endTotal = h * 60 + m + duration;
      const endTime = `${Math.floor(endTotal/60).toString().padStart(2,'0')}:${(endTotal%60).toString().padStart(2,'0')}`;

      await addAppointment({
        clientId,
        clientName: showQuickClient ? quickClient.name : clients.find(c => c.id === clientId)?.name || '',
        clientPhone: showQuickClient ? quickClient.phone : clients.find(c => c.id === clientId)?.phone || '',
        serviceId: newApp.serviceId,
        serviceName: service?.name || '',
        professionalId: newApp.professionalId,
        professionalName: professional?.name || '',
        date: currentDate,
        startTime: newApp.startTime,
        endTime,
        price: service?.price || 0
      });
      setShowAddModal(false);
      setNewApp({ clientId: '', serviceId: '', professionalId: '', startTime: '09:00' });
      setQuickClient({ name: '', phone: '' });
    } catch (err) { alert("Erro ao criar agendamento."); }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black font-display italic ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>Agenda Digital</h1>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex gap-2">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-white/5 text-zinc-500'}`}><LayoutGrid size={16}/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#D4AF37] text-black shadow-lg' : 'bg-white/5 text-zinc-500'}`}><List size={16}/></button>
             </div>
             {/* SELETOR DE MODO DE FILTRO */}
             <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                <button onClick={() => setFilterMode('DAY')} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${filterMode === 'DAY' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>Dia</button>
                <button onClick={() => setFilterMode('MONTH')} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${filterMode === 'MONTH' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>Mês</button>
                <button onClick={() => setFilterMode('ALL')} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${filterMode === 'ALL' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>Tudo</button>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {filterMode === 'DAY' && (
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d.toISOString().split('T')[0]); }} className="p-2 text-zinc-400 hover:text-white"><ChevronLeft size={20} /></button>
              <div className="px-4 text-[10px] font-black uppercase tracking-widest min-w-[120px] text-center">{new Date(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })}</div>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d.toISOString().split('T')[0]); }} className="p-2 text-zinc-400 hover:text-white"><ChevronRight size={20} /></button>
            </div>
          )}
          
          {filterMode === 'MONTH' && (
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="bg-white/5 border border-white/10 rounded-2xl p-3 text-[10px] font-black uppercase outline-none text-white focus:border-[#D4AF37]"
            />
          )}

          <button onClick={() => setShowAddModal(true)} className="gradiente-ouro text-black px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-all"><Plus size={16}/> Agendar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37]"><Calendar size={20}/></div>
            <div><p className="text-[10px] font-black uppercase opacity-40">Total Agenda</p><p className="text-xl font-black italic">{stats.total} Atendimentos</p></div>
         </div>
         <div className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-500"><Check size={20}/></div>
            <div><p className="text-[10px] font-black uppercase opacity-40">Finalizados</p><p className="text-xl font-black italic">{stats.completed} Realizados</p></div>
         </div>
         <div className="cartao-vidro p-6 rounded-[2rem] border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500"><DollarSign size={20}/></div>
            <div><p className="text-[10px] font-black uppercase opacity-40">Projeção Receita</p><p className="text-xl font-black italic">R$ {stats.revenue}</p></div>
         </div>
      </div>

      <div className="flex-1 cartao-vidro rounded-[2.5rem] border-white/5 shadow-2xl overflow-hidden flex flex-col">
        {viewMode === 'grid' ? (
          <div className="flex-1 overflow-auto p-8 scrollbar-hide">
            <div className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] gap-4 min-w-[800px]">
              <div className="sticky left-0 z-10"></div>
              {professionals.map(p => (
                <div key={p.id} className="text-center p-4">
                   <img src={p.avatar} className="w-14 h-14 rounded-2xl object-cover mx-auto mb-3 border-2 border-[#D4AF37]/20" alt={p.name} />
                   <p className="text-[10px] font-black uppercase tracking-widest">{p.name}</p>
                </div>
              ))}
              {hours.map(hour => (
                <React.Fragment key={hour}>
                  <div className="flex items-center justify-center text-[10px] font-black opacity-30 border-t border-white/5 h-20">{hour}</div>
                  {professionals.map(prof => {
                    const apt = appointmentsToday.find(a => a.professionalId === prof.id && a.startTime.startsWith(hour.split(':')[0]));
                    return (
                      <div key={`${prof.id}-${hour}`} className="border-t border-l border-white/5 h-20 p-2 relative group">
                        {apt ? (
                          <div className={`h-full rounded-xl p-3 text-[9px] font-black uppercase tracking-tighter flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${apt.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : apt.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'}`}>
                             <span className="truncate">{apt.clientName}</span>
                             <span className="opacity-60">{apt.serviceName}</span>
                          </div>
                        ) : (
                          <button onClick={() => { setNewApp({...newApp, professionalId: prof.id, startTime: hour}); setShowAddModal(true); }} className="w-full h-full rounded-xl border-2 border-dashed border-white/0 group-hover:border-white/5 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus size={16} className="text-zinc-700"/></button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
               <thead className="sticky top-0 bg-black/80 backdrop-blur-md z-10">
                  <tr className="border-b border-white/5">
                     <th className="p-6 text-[10px] font-black uppercase opacity-40">Horário</th>
                     <th className="p-6 text-[10px] font-black uppercase opacity-40">Cliente</th>
                     <th className="p-6 text-[10px] font-black uppercase opacity-40">Serviço</th>
                     <th className="p-6 text-[10px] font-black uppercase opacity-40">Profissional</th>
                     <th className="p-6 text-[10px] font-black uppercase opacity-40 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {appointmentsToday.sort((a,b) => a.startTime.localeCompare(b.startTime)).map(apt => (
                    <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors group">
                       <td className="p-6 font-black italic text-sm">{apt.startTime}</td>
                       <td className="p-6">
                          <p className="font-black text-sm">{apt.clientName}</p>
                          <p className="text-[10px] opacity-40">{apt.clientPhone}</p>
                       </td>
                       <td className="p-6">
                          <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase">{apt.serviceName}</span>
                       </td>
                       <td className="p-6">
                          <div className="flex items-center gap-3">
                             <img src={professionals.find(p => p.id === apt.professionalId)?.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                             <span className="text-[10px] font-black uppercase">{apt.professionalName}</span>
                          </div>
                       </td>
                       <td className="p-6 text-right">
                          <div className="flex justify-end gap-2">
                             {apt.status === 'SCHEDULED' && (
                               <button onClick={() => updateAppointmentStatus(apt.id, 'COMPLETED')} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"><Check size={16}/></button>
                             )}
                             <button onClick={() => updateAppointmentStatus(apt.id, 'CANCELLED')} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={16}/></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            {appointmentsToday.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center opacity-20">
                 <Calendar size={60} className="mb-6" />
                 <p className="text-xl font-black italic uppercase">Nenhum registro encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in duration-300">
           <div className="w-full max-w-xl p-10 md:p-14 rounded-[3.5rem] cartao-vidro border-white/10">
              <h2 className="text-3xl font-black italic font-display mb-10">Novo Agendamento</h2>
              <form onSubmit={handleAddQuickAppointment} className="space-y-6">
                 <div className="flex items-center gap-4 mb-4">
                    <button type="button" onClick={() => setShowQuickClient(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${!showQuickClient ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-zinc-500'}`}>Cliente Cadastrado</button>
                    <button type="button" onClick={() => setShowQuickClient(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase ${showQuickClient ? 'bg-[#D4AF37] text-black' : 'bg-white/5 text-zinc-500'}`}>Novo Cliente</button>
                 </div>

                 {showQuickClient ? (
                   <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="Nome do Cliente" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black" value={quickClient.name} onChange={e => setQuickClient({...quickClient, name: e.target.value})} />
                      <input required placeholder="WhatsApp" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black" value={quickClient.phone} onChange={e => setQuickClient({...quickClient, phone: e.target.value})} />
                   </div>
                 ) : (
                   <select required value={newApp.clientId} onChange={e => setNewApp({...newApp, clientId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                      <option value="" className="bg-zinc-950">Selecione o Cliente</option>
                      {clients.map(c => <option key={c.id} value={c.id} className="bg-zinc-950">{c.name} ({c.phone})</option>)}
                   </select>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select required value={newApp.professionalId} onChange={e => setNewApp({...newApp, professionalId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                      <option value="" className="bg-zinc-950">Barbeiro</option>
                      {professionals.map(p => <option key={p.id} value={p.id} className="bg-zinc-950">{p.name}</option>)}
                    </select>
                    <select required value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black uppercase">
                      <option value="" className="bg-zinc-950">Serviço</option>
                      {services.map(s => <option key={s.id} value={s.id} className="bg-zinc-950">{s.name} • R$ {s.price}</option>)}
                    </select>
                    <input required type="time" value={newApp.startTime} onChange={e => setNewApp({...newApp, startTime: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none text-xs font-black" />
                 </div>
                 <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-white/5 py-4 rounded-xl font-black uppercase text-[10px] text-zinc-500">Cancelar</button>
                    <button type="submit" className="flex-1 gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Confirmar</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
