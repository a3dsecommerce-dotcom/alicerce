"use client";
import { useState, useEffect } from "react";
import { User, Lock, Save, Shield, Mail, Phone, Building2, Briefcase, KeyRound, Sparkles, Loader2, Info, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ConfiguracoesModule({ user: propUser }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(propUser || {});
  const [activeTab, setActiveTab] = useState<"perfil" | "seguranca" | "sobre" | "moderacao">("perfil");
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
      
      // Update local storage
      const saved = localStorage.getItem("crm_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        localStorage.setItem("crm_user", JSON.stringify({
          ...parsed,
          name: formData.nome,
          email: formData.telefone
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

  const isModerator = (user.nivel_acesso || 0) >= 3;

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-900/60 rounded-2xl border border-white/5 self-start max-w-full">
        <button 
          onClick={() => { setActiveTab("perfil"); setMessage({ type: "", text: "" }); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'perfil' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' : 'text-zinc-400 hover:text-white'}`}
        >
          <User size={14} /> Meu Perfil
        </button>
        <button 
          onClick={() => { setActiveTab("seguranca"); setMessage({ type: "", text: "" }); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'seguranca' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' : 'text-zinc-400 hover:text-white'}`}
        >
          <Lock size={14} /> Alterar Senha
        </button>
        <button 
          onClick={() => { setActiveTab("sobre"); setMessage({ type: "", text: "" }); }}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'sobre' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' : 'text-zinc-400 hover:text-white'}`}
        >
          <Info size={14} /> Sobre o App
        </button>
        {isModerator && (
          <button 
            onClick={() => { setActiveTab("moderacao"); setMessage({ type: "", text: "" }); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'moderacao' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' : 'text-zinc-400 hover:text-white'}`}
          >
            <Sparkles size={14} /> Moderação
          </button>
        )}
      </div>

      <div className="bg-zinc-900/40 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
         
         {message.text && (
            <div className={`mb-8 p-5 rounded-2xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} text-xs font-black uppercase tracking-widest`}>
               {message.text}
            </div>
         )}

         {/* 1. EDIT PROFILE TAB */}
         {activeTab === "perfil" && (
           <form onSubmit={handleUpdateProfile} className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20"><User size={22} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Dados do Colaborador</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mantenha suas informações de contato atualizadas</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><User size={12} /> Nome Completo</label>
                    <input 
                       className="w-full h-14 bg-zinc-900/60 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all" 
                       value={formData.nome} 
                       onChange={e => setFormData({...formData, nome: e.target.value})} 
                       required
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><Phone size={12} /> WhatsApp/Tel</label>
                    <input 
                       className="w-full h-14 bg-zinc-900/60 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all" 
                       value={formData.telefone} 
                       onChange={e => setFormData({...formData, telefone: e.target.value})} 
                       required
                    />
                 </div>

                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2"><Mail size={12} /> E-mail</label>
                    <input 
                       type="email"
                       className="w-full h-14 bg-zinc-900/60 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all" 
                       value={formData.email} 
                       onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                 </div>
              </div>

              {/* READ-ONLY CORPORATE INFO */}
              <div className="pt-8 border-t border-white/5">
                 <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4">Informações de Alocação (RH)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Cargo</p>
                       <p className="text-xs font-bold text-white flex items-center gap-2"><Briefcase size={13} className="text-orange-500" /> {user.cargo || 'Operacional'}</p>
                    </div>
                    <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Posto de Trabalho</p>
                       <p className="text-xs font-bold text-white flex items-center gap-2"><Building2 size={13} className="text-orange-500" /> {user.unidade_alocacao || 'Sem Alocação'}</p>
                    </div>
                    <div className="p-4 bg-zinc-950/40 rounded-2xl border border-white/5">
                       <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Nível de Acesso</p>
                       <p className="text-xs font-bold text-white flex items-center gap-2"><KeyRound size={13} className="text-orange-500" /> Nível {user.nivel_acesso || 1}</p>
                    </div>
                 </div>
                 <p className="text-[9px] text-zinc-500 italic mt-3">* Informações corporativas são protegidas e auditadas pelo setor de Recursos Humanos.</p>
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full h-14 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-600/10 active:scale-98"
              >
                 <Save size={16} /> Salvar Alterações
              </button>
           </form>
         )}

         {/* 2. CHANGE PASSWORD TAB */}
         {activeTab === "seguranca" && (
           <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-in max-w-xl">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20"><Lock size={22} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Segurança de Acesso</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Defina uma chave de acesso forte e exclusiva</p>
                 </div>
              </div>

              <div className="p-4 bg-orange-600/5 rounded-2xl border border-orange-600/10 flex gap-3">
                 <Shield size={18} className="text-orange-500 shrink-0 mt-0.5" />
                 <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                    Recomendamos definir uma senha personalizada de sua preferência. A regra de login baseada nos 4 últimos dígitos do seu telefone deixará de funcionar assim que cadastrar sua senha.
                 </p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Nova Senha</label>
                    <input 
                       type="password"
                       className="w-full h-14 bg-zinc-900/60 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all" 
                       placeholder="Mínimo 4 caracteres"
                       value={passwordData.novaSenha}
                       onChange={e => setPasswordData({...passwordData, novaSenha: e.target.value})}
                       required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Confirmar Nova Senha</label>
                    <input 
                       type="password"
                       className="w-full h-14 bg-zinc-900/60 border border-white/5 rounded-2xl px-5 text-white text-sm outline-none focus:border-orange-500 focus:bg-orange-600/5 transition-all" 
                       placeholder="Repita a nova senha"
                       value={passwordData.confirmarSenha}
                       onChange={e => setPasswordData({...passwordData, confirmarSenha: e.target.value})}
                       required
                    />
                 </div>
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-orange-600/10 active:scale-98"
              >
                 <Lock size={16} /> Atualizar Senha
              </button>
           </form>
         )}

         {/* 3. ABOUT THE APP TAB */}
         {activeTab === "sobre" && (
           <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20"><Info size={22} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Sobre o Portal</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">História, Propósito e Autoria do Sistema</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                {/* History Section */}
                <div className="space-y-5 text-zinc-300 text-sm leading-relaxed font-semibold">
                  <p>
                    O **Alicerce ERP** é uma plataforma inovadora de Governança Soberana, criada e desenvolvida com o firme propósito de modernizar a gestão de serviços terceirizados, integrando as demandas administrativas e de campo de maneira fluida e automatizada.
                  </p>
                  <p>
                    O sistema nasceu com o intuito de simplificar a rotina diária dos colaboradores. Pensando nisso, a interface foi desenhada com alto rigor de acessibilidade para garantir que todos os membros da nossa equipe, inclusive os mais experientes e idosos, possam interagir e navegar com total facilidade, clareza visual e autonomia.
                  </p>
                  <p>
                    Seja solicitando equipamentos (EPI), informando faltas, consultando escalas ou se comunicando no chat corporativo seguro, a plataforma entrega controle e transparência imediata.
                  </p>
                  <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">Propósito Central</span>
                    <p className="text-xs text-zinc-400">
                      "Prover controle operacional absoluto com simplicidade e soberania digital, valorizando a comunicação interna e o cuidado com cada colaborador de ponta a ponta."
                    </p>
                  </div>
                </div>

                {/* Credits Card */}
                <div className="glow-card p-6 rounded-3xl border border-white/5 bg-zinc-950/50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="w-20 h-20 rounded-3xl bg-orange-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-orange-600/20 mb-4 uppercase">
                    D
                  </div>
                  <h4 className="text-base font-black text-white">Diogo</h4>
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Fundador & Desenvolvedor Principal</span>
                  <p className="text-[11px] text-zinc-400 mt-4 max-w-[240px] leading-relaxed">
                    Idealizador e supervisor de todo o ecossistema tecnológico do Alicerce ERP, liderando a transformação digital para trazer profissionalismo e segurança operacional.
                  </p>
                  <div className="w-full border-t border-white/5 mt-6 pt-4 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Versão do ERP</span>
                    <span className="text-white bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">v1.0.1 Stable</span>
                  </div>
                </div>
              </div>
           </div>
         )}

         {/* 4. MODERATION TAB */}
         {activeTab === "moderacao" && isModerator && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 border border-teal-500/20"><Sparkles size={22} /></div>
                 <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Moderação - Clube de Serviços</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Aprove ou pause anúncios no mural do colaborador</p>
                 </div>
              </div>

              <div className="overflow-x-auto bg-zinc-950/30 rounded-2xl border border-white/5 p-4">
                {loadingAdminServices ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-teal-500" size={24} />
                  </div>
                ) : adminServices.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-10 font-bold uppercase tracking-wider">Nenhum serviço cadastrado.</p>
                ) : (
                  <table className="w-full text-left text-xs leading-normal">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                        <th className="py-4 px-4">Prestador</th>
                        <th className="py-4 px-4">Título</th>
                        <th className="py-4 px-4">Categoria</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminServices.map(s => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-4 px-4 font-bold text-white">{s.colaborador_nome}</td>
                          <td className="py-4 px-4 text-zinc-400">{s.titulo}</td>
                          <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-500 font-bold text-[9px] uppercase">{s.categoria}</span></td>
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
