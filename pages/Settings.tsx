import React, { useState } from 'react';
import { Save, Store, Upload, ImageIcon, User as UserIcon, Trash2, Plus, Info, Clock, MapPin, Share2 } from 'lucide-react';
import { useBarberStore } from '../store';
import { storage } from '../firebase'; // Importado
import { ref, uploadString, getDownloadURL } from "firebase/storage"; // Importado

const Settings: React.FC = () => {
  const { config, updateConfig, user, updateUser } = useBarberStore();
  const [formData, setFormData] = useState({ ...config });
  const [userData, setUserData] = useState({ 
    name: user?.name || '', 
    avatar: user?.avatar || config.logo || 'https://i.pravatar.cc/150' 
  });
  const [loading, setLoading] = useState(false);

  // FUNÇÃO DE AUXÍLIO PARA O FIREBASE STORAGE (CORREÇÃO DO LIMITE DE FOTOS)
  const uploadToFirebase = async (file: File, path: string) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await uploadString(storageRef, reader.result as string, 'data_url');
        const url = await getDownloadURL(storageRef);
        resolve(url);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (field: 'logo' | 'coverImage' | 'loginBackground', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const url = await uploadToFirebase(file, 'perfil');
      setFormData({ ...formData, [field]: url });
      if (field === 'logo') {
        setUserData({ ...userData, avatar: url });
      }
      setLoading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const url = await uploadToFirebase(file, 'galeria');
      setFormData(prev => ({ 
        ...prev, 
        gallery: [...(prev.gallery || []), url] 
      }));
      setLoading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = (formData.gallery || []).filter((_, i) => i !== index);
    setFormData({ ...formData, gallery: newGallery });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalConfig = { ...formData, logo: userData.avatar };
      await updateConfig(finalConfig);
      updateUser(userData);
      alert("Configurações salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  // O RESTANTE DO CÓDIGO (O SEU HTML) SEGUE EXATAMENTE IGUAL AO SEU ORIGINAL
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 h-full overflow-auto scrollbar-hide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-color-main font-display italic tracking-tight italic">Painel Master</h1>
          <p className="text-color-sec text-[11px] font-black uppercase tracking-widest opacity-60">Configurações Avançadas Sr. José</p>
        </div>
        <button 
          form="settings-form"
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-4 gradiente-ouro text-black px-12 py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
        >
          {loading ? 'Sincronizando...' : <><Save size={20} /> Gravar Tudo</>}
        </button>
      </div>

      <form id="settings-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          
          {/* Perfil Master - MANTIDO SEU LAYOUT */}
          <div className="cartao-vidro rounded-[3.5rem] p-10 md:p-14 border-white/10 space-y-10">
            <h3 className="text-2xl font-black font-display italic flex items-center gap-4 italic"><UserIcon className="text-[#D4AF37]" /> Perfil Master</h3>
            <div className="flex flex-col sm:flex-row items-center gap-10">
               <div className="relative group w-40 h-40">
                  <img 
                    src={userData.avatar} 
                    className="w-full h-full rounded-[3rem] object-cover border-4 border-[#D4AF37]/30 shadow-2xl transition-all group-hover:scale-105"
                    alt="Avatar"
                  />
                  <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center rounded-[3rem] cursor-pointer text-[10px] font-black uppercase tracking-widest gap-2 text-white">
                    <Upload size={24} />
                    Trocar Foto
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleImageChange('logo', e)} />
                  </label>
               </div>
               <div className="flex-1 space-y-6 w-full">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Assinatura Digital (Seu Nome)</label>
                    <input 
                      type="text"
                      value={userData.name}
                      onChange={e => setUserData({...userData, name: e.target.value})}
                      className="w-full bg-white/5 border-2 border-white/10 p-6 rounded-3xl outline-none font-black text-xl text-white focus:border-[#D4AF37]/50 transition-all"
                    />
                  </div>
               </div>
            </div>
          </div>

          {/* O restante do seu formulário continua aqui exatamente como era... */}
          {/* (Pode copiar o restante do seu Settings original aqui) */}
        </div>
      </form>
    </div>
  );
};

export default Settings;
