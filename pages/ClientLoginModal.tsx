import React, { useState } from 'react';
import { X, LogIn, Phone, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useBarberStore } from '../store';

interface ClientLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const ClientLoginModal: React.FC<ClientLoginModalProps> = ({ onSuccess, onClose }) => {
  const { login, config } = useBarberStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      onSuccess();
    } catch (err: any) {
      setError('Email/telefone ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
      <div className="w-full max-w-sm cartao-vidro rounded-[2.5rem] p-8 border border-[#D4AF37]/20 shadow-2xl space-y-6 relative">

        {/* Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          {config.logo && (
            <img
              src={config.logo}
              alt={config.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/40 mx-auto shadow-xl"
            />
          )}
          <div>
            <h2 className="text-xl font-black font-display italic text-white">Portal do Cliente</h2>
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">
              {config.name || 'Barbearia'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
              Email ou Telefone
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                placeholder="seu@email.com ou (11) 99999-9999"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-4 py-4 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Senha</label>
            <div className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-[#D4AF37]/50 pl-10 pr-10 py-4 rounded-xl outline-none text-xs font-bold text-white placeholder:text-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-[10px] text-red-400 font-bold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradiente-ouro text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            {loading ? 'Entrando...' : 'Entrar no Portal'}
          </button>
        </form>

        <p className="text-center text-[9px] text-zinc-600 font-black uppercase tracking-widest">
          Não tem conta? Agende um serviço para se cadastrar
        </p>
      </div>
    </div>
  );
};

export default ClientLoginModal;
