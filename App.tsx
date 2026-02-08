import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Professionals from './pages/Professionals';
import Services from './pages/Services';
import Financial from './pages/Financial';
import Settings from './pages/Settings';
import Suggestions from './pages/Suggestions';
import PublicBooking from './pages/PublicBooking';
import { useBarberStore } from './store';
import { LogIn, Sparkles, Sun, Moon, LogOut, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  const { user, config, theme, login, toggleTheme, addClient, clients } = useBarberStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPublicView, setIsPublicView] = useState(true);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerData, setRegisterData] = useState({ name: '', phone: '', email: '', password: '' });

  const handleLogin = async () => {
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      alert("Falha no acesso. Verifique suas credenciais.");
    }
  };

  const handleRegister = async () => {
    if (!registerData.name || !registerData.phone || !registerData.password) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await addClient({
        name: registerData.name,
        phone: registerData.phone,
        email: registerData.email,
        password: registerData.password
      } as any);
      alert("Cadastro realizado com sucesso! Agora faça o login.");
      setIsRegistering(false);
    } catch (err) {
      alert("Erro ao realizar cadastro.");
    }
  };

  if (user && user.role === 'CLIENTE') {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-[#D4AF37] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <PublicBooking initialView="CLIENT_DASHBOARD" />
      </div>
    );
  }

  if (!user && isPublicView) {
    return (
      <div className={`relative min-h-screen theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
        <div className="fixed bottom-8 left-8 z-[100] flex gap-3">
          <button onClick={toggleTheme} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-[#D4AF37] text-black border-transparent'}`}>
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button onClick={() => setIsPublicView(false)} className={`p-4 rounded-2xl border shadow-2xl transition-all ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500' : 'bg-zinc-900 border-white/10 text-white hover:bg-zinc-800'}`}>
            <LogIn size={24} />
          </button>
        </div>
        <PublicBooking />
      </div>
    );
  }

  if (!user && !isPublicView) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 selection:bg-[#D4AF37]/30 relative overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-[#F8F9FA] text-[#1A1A1A]' : 'bg-[#050505] text-[#f3f4f6]'}`}>
        <div className="absolute inset-0 z-0">
           <img src={config.loginBackground} className={`w-full h-full object-cover grayscale transition-all duration-1000 ${theme === 'light' ? 'opacity-5' : 'opacity-25'}`} alt="Login Background" />
           <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'light' ? 'from-[#F8F9FA] via-transparent to-[#F8F9FA]' : 'from-[#050505] via-transparent to-[#050505]'}`}></div>
        </div>

        <button onClick={toggleTheme} className={`absolute top-6 right-6 p-4 rounded-2xl border transition-all z-20 ${theme === 'light' ? 'bg-white border-zinc-200 text-zinc-500 shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400'}`}>
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        <div className="cartao-vidro w-full max-w-md rounded-[3.5rem] p-8 md:p-12 space-y-8 animate-in fade-in zoom-in duration-700 shadow-2xl relative z-10 border-white/5">
          <div className="absolute top-0 inset-x-0 h-1 gradiente-ouro rounded-t-[3.5rem]"></div>
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] mx-auto overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30">
               <img src={config.logo} className="w-full h-full object-cover" alt="Logo" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black font-display italic tracking-tight uppercase">{isRegistering ? 'Criar Conta' : 'Portal Sr. José'}</h1>
              <p className="opacity-40 text-[9px] font-black uppercase tracking-[0.3em]">{isRegistering ? 'Cadastre-se para agendar' : 'Acesse para gerir ou agendar'}</p>
            </div>
          </div>

          {!isRegistering ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">E-mail ou WhatsApp</label>
                  <input type="text" placeholder="Seu acesso..." value={loginIdentifier} onChange={e => setLoginIdentifier(e.target.value)} className={`w-full border p-4 rounded-2xl outline-none focus:border-[#D4AF37] transition-all font-bold text-base ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Senha</label>
                  <input type="password" placeholder="••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`w-full border p-4 rounded-2xl outline-none focus:border-[#D4AF37] transition-all font-bold text-base ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                </div>
              </div>
              <button onClick={handleLogin} className="w-full gradiente-ouro text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">ACESSAR</button>
              <div className="text-center">
                <button onClick={() => setIsRegistering(true)} className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:underline">Novo por aqui? Cadastre-se</button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-3">
                <input type="text" placeholder="Nome Completo" value={registerData.name} onChange={e => setRegisterData({...registerData, name: e.target.value})} className={`w-full border p-4 rounded-xl outline-none focus:border-[#D4AF37] font-bold ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                <input type="tel" placeholder="WhatsApp" value={registerData.phone} onChange={e => setRegisterData({...registerData, phone: e.target.value})} className={`w-full border p-4 rounded-xl outline-none focus:border-[#D4AF37] font-bold ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                <input type="email" placeholder="E-mail (Opcional)" value={registerData.email} onChange={e => setRegisterData({...registerData, email: e.target.value})} className={`w-full border p-4 rounded-xl outline-none focus:border-[#D4AF37] font-bold ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
                <input type="password" placeholder="Crie uma Senha" value={registerData.password} onChange={e => setRegisterData({...registerData, password: e.target.value})} className={`w-full border p-4 rounded-xl outline-none focus:border-[#D4AF37] font-bold ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-white/5 border-white/10'}`} />
              </div>
              <button onClick={handleRegister} className="w-full gradiente-ouro text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl">CADASTRAR AGORA</button>
              <div className="text-center">
                <button onClick={() => setIsRegistering(false)} className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">Voltar ao Login</button>
              </div>
            </div>
          )}

          <button onClick={() => setIsPublicView(true)} className="w-full opacity-30 hover:opacity-100 hover:text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.2em] transition-all">Sair e voltar ao site</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'appointments': return <Appointments />;
      case 'clients': return <Clients />;
      case 'professionals': return <Professionals />;
      case 'services': return <Services />;
      case 'financial': return <Financial />;
      case 'suggestions': return <Suggestions />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`h-screen overflow-hidden theme-transition ${theme === 'light' ? 'bg-[#F8F9FA]' : 'bg-[#050505]'}`}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <button onClick={() => setIsPublicView(true)} className="fixed bottom-6 right-6 z-[100] gradiente-ouro text-black px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-110 active:scale-95 transition-all">VISÃO DO CLIENTE</button>
    </div>
  );
};

export default App;
