"use client";
import { useState, useEffect } from "react";
import { User, Lock, Save, Shield, Mail, Phone, Building2, Briefcase, KeyRound, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesModule({ user: propUser }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(propUser || {});
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: ""
  });
  const [passwordData, setPasswordData] = useState({
    novaSenha: "",
    confirmarSenha: ""
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function fetchUserData() {
      if (!user.id) return;
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setUser(data);
        setFormData({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || ""
        });
      }
    }
    fetchUserData();
  }, [user.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Atualizar localStorage para manter consistência
      const saved = localStorage.getItem("crm_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem("crm_user", JSON.stringify({
          ...parsed,
          name: formData.nome,
          email: formData.telefone // Usamos telefone como 'email' na sessão por padrão do sistema
        }));
      }

      setMessage({ type: "success", text: "Cadastro atualizado com sucesso!" });
    } catch (err: any) {
      setMessage({ type: "error", text: "Erro ao atualizar: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      return setMessage({ type: "error", text: "As senhas não coincidem!" });
    }
    if (passwordData.novaSenha.length < 4) {
      return setMessage({ type: "error", text: "A senha deve ter pelo menos 4 caracteres." });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ senha: passwordData.novaSenha })
        .eq('id', user.id);

      if (error) throw error;
      
      setPasswordData({ novaSenha: "", confirmarSenha: "" });
      setMessage({ type: "success", text: "Senha alterada com sucesso! Use a nova senha no próximo login." });
    } catch (err: any) {
      setMessage({ type: "error", text: "Erro ao mudar senha: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Clube de Serviços Moderation Logic
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [loadingAdminServices, setLoadingAdminServices] = useState(false);

  const loadAdminServices = async () => {
    if ((user.nivel_acesso || 0) < 3) return;
    try {
      setLoadingAdminServices(true);
      const { data, error } = await supabase
        .from("servicos_colaboradores")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setAdminServices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdminServices(false);
    }
  };

  useEffect(() => {
    if ((user.nivel_acesso || 0) >= 3) {
      loadAdminServices();
    }
  }, [user.nivel_acesso]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("servicos_colaboradores")
        .update({ ativo: !currentStatus })
        .eq("id", id);
      if (!error) {
        setAdminServices(prev =>
          prev.map(s => s.id === id ? { ...s, ativo: !currentStatus } : s)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este anúncio de serviço permanentemente?")) return;
    try {
      const { error } = await supabase
        .from("servicos_colaboradores")
        .delete()
        .eq("id", id);
      if (!error) {
        setAdminServices(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20">
      
      <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <Shield size={120} className="text-[var(--brand)]" />
         </div>
         
         <div className="mb-12">
            <h2 className="text-3xl font-black text-[var(--text-primary)] italic tracking-tight">Configurações de Conta</h2>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2">Gerencie seus dados pessoais e segurança de acesso</p>
         </div>

         {message.text && (
            <div className={`mb-8 p-6 rounded-2xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} text-xs font-black uppercase tracking-widest animate-bounce-subtle`}>
               {message.text}
            </div>
         )}

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* 1. ATUALIZAR CADASTRO */}
            <form onSubmit={handleUpdateProfile} className="space-y-8 bg-[var(--bg-base)]/30 p-10 rounded-[2.5rem] border border-[var(--border)]">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[var(--brand)] shadow-md border border-[var(--border)]"><User size={22} /></div>
                  <h3 className="text-lg font-black uppercase italic">Dados Pessoais</h3>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-2"><User size={12} /> Nome Completo</label>
                     <input 
                        className="input-field w-full h-14" 
                        value={formData.nome} 
                        onChange={e => setFormData({...formData, nome: e.target.value})} 
                        required
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-2"><Mail size={12} /> E-mail</label>
                        <input 
                           type="email"
                           className="input-field w-full h-14" 
                           value={formData.email} 
                           onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest flex items-center gap-2"><Phone size={12} /> WhatsApp/Tel</label>
                        <input 
                           className="input-field w-full h-14" 
                           value={formData.telefone} 
                           onChange={e => setFormData({...formData, telefone: e.target.value})} 
                        />
                     </div>
                  </div>

                  {/* DADOS CORPORATIVOS (READ-ONLY) */}
                  <div className="pt-6 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-4 opacity-60">
                     <div className="p-4 bg-white rounded-xl border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Cargo</p>
                        <p className="text-[10px] font-black flex items-center gap-2"><Briefcase size={10} /> {user.cargo || '---'}</p>
                     </div>
                     <div className="p-4 bg-white rounded-xl border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Secretaria</p>
                        <p className="text-[10px] font-black flex items-center gap-2"><Building2 size={10} /> {user.unidade_alocacao || '---'}</p>
                     </div>
                     <div className="p-4 bg-white rounded-xl border border-[var(--border)]">
                        <p className="text-[8px] font-black uppercase text-[var(--text-muted)] mb-1">Nível</p>
                        <p className="text-[10px] font-black flex items-center gap-2"><KeyRound size={10} /> Nível {user.nivel_acesso || 1}</p>
                     </div>
                  </div>
                  <p className="text-[8px] font-bold text-orange-600 uppercase text-center italic mt-2">* Dados corporativos só podem ser alterados pelo RH ou Administração.</p>
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 bg-[var(--brand)] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[var(--brand)]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  <Save size={18} /> Salvar Alterações
               </button>
            </form>

            {/* 2. MUDAR SENHA */}
            <form onSubmit={handleChangePassword} className="space-y-8 bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-orange-500 shadow-md border border-slate-700"><Lock size={22} /></div>
                  <h3 className="text-lg font-black uppercase italic text-white">Privacidade & Senha</h3>
               </div>

               <div className="space-y-8">
                  <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                     <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
                        Ao definir uma nova senha, a regra dos "4 últimos dígitos do telefone" deixará de funcionar para sua conta. Escolha uma senha forte.
                     </p>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nova Senha</label>
                        <input 
                           type="password"
                           className="w-full h-14 bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 text-white text-sm outline-none focus:border-orange-500 transition-all" 
                           placeholder="••••••••"
                           value={passwordData.novaSenha}
                           onChange={e => setPasswordData({...passwordData, novaSenha: e.target.value})}
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Confirmar Nova Senha</label>
                        <input 
                           type="password"
                           className="w-full h-14 bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 text-white text-sm outline-none focus:border-orange-500 transition-all" 
                           placeholder="••••••••"
                           value={passwordData.confirmarSenha}
                           onChange={e => setPasswordData({...passwordData, confirmarSenha: e.target.value})}
                           required
                        />
                     </div>
                  </div>
               </div>

               <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-16 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-orange-900/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  <Lock size={18} /> Atualizar Senha de Acesso
               </button>
            </form>

          </div>

          {/* SEÇÃO: MODERAÇÃO CLUBE DE SERVIÇOS (Apenas Admins/Gestores) */}
          {(user.nivel_acesso || 0) >= 3 && (
            <div className="mt-12 border-t border-[var(--border)] pt-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-500/20">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic">Moderação - Clube de Serviços</h3>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Gerencie os anúncios publicados pelos colaboradores</p>
                </div>
              </div>

              <div className="overflow-x-auto bg-[var(--bg-base)]/20 rounded-[2.5rem] border border-[var(--border)] p-6">
                {loadingAdminServices ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-teal-500" size={24} />
                  </div>
                ) : adminServices.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-10 font-bold uppercase tracking-wider">Nenhum serviço anunciado no momento.</p>
                ) : (
                  <table className="w-full text-left text-xs leading-normal">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">
                        <th className="py-4 px-4">Prestador</th>
                        <th className="py-4 px-4">Título</th>
                        <th className="py-4 px-4">Categoria</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminServices.map(s => (
                        <tr key={s.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)]/20 transition-all">
                          <td className="py-4 px-4 font-bold text-[var(--text-primary)]">{s.colaborador_nome}</td>
                          <td className="py-4 px-4 text-[var(--text-muted)]">{s.titulo}</td>
                          <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 font-bold text-[9px] uppercase">{s.categoria}</span></td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase ${s.ativo ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {s.ativo ? 'Ativo' : 'Pausado'}
                            </span>
                          </td>
                          <td className="py-4 px-4 flex justify-center gap-3">
                            <button 
                              onClick={() => handleToggleStatus(s.id, s.ativo)}
                              className={`px-3 py-1.5 rounded-xl border text-[9px] font-bold uppercase tracking-wider transition-all ${s.ativo ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}
                            >
                              {s.ativo ? 'Pausar' : 'Ativar'}
                            </button>
                            <button 
                              onClick={() => handleDeleteService(s.id)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-[9px] font-bold uppercase tracking-wider transition-all"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

       </div>
     </div>
  );
}
