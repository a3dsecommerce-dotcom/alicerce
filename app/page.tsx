"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalTrabalhe, setModalTrabalhe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado Expandido do Candidato (ONDA 2)
  const [candidato, setCandidato] = useState({ 
    nome: "", cpf: "", rg: "", pis: "", titulo: "", 
    telefone: "", email: "", data_nascimento: "",
    cargo: "ASG", escolaridade: "Ensino Médio Completo",
    cep: "", rua: "", numero: "", bairro: "", cidade: "Manaus", estado: "AM",
    tamanho_camisa: "M", tamanho_calca: "38", tamanho_calcado: "40",
    experiencia: false, ultimo_emprego: ""
  });

  // Passo do Modal de Cadastro
  const [step, setStep] = useState(1);

  // Função principal de login: valida telefone e senha (4 últimos dígitos)
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) {
      setError("Telefone inválido.");
      setLoading(false);
      return;
    }

    const senhaCorreta = telLimpo.slice(-4);
    if (senha !== senhaCorreta) {
      setError("Senha incorreta (últimos 4 dígitos).");
      setLoading(false);
      return;
    }

    try {
      const telCom55 = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
      const telSem55 = telLimpo.startsWith("55") ? telLimpo.slice(2) : telLimpo;

      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .or(`telefone.eq.${telCom55},telefone.eq.${telSem55},telefone.eq.${telCom55}@s.whatsapp.net,telefone.eq.${telSem55}@s.whatsapp.net`)
        .single();

      if (userError || !user) {
        setError("Usuário não encontrado.");
        setLoading(false);
        return;
      }

      document.cookie = `auth_token=al_sovereign_${user.id}; path=/; max-age=86400`;
      
      // Determina o cargo/role com base no nivel_acesso quando cargo for nulo
      const cargoResolvido = user.cargo || (user.nivel_acesso >= 4 ? 'ADMIN' : user.nivel_acesso >= 3 ? 'GERENTE' : user.nivel_acesso >= 2 ? 'SUPERVISOR' : 'COLABORADOR');
      
      localStorage.setItem("crm_user", JSON.stringify({ 
        email: user.telefone, 
        role: cargoResolvido,
        name: user.nome,
        nivel: user.nivel_acesso || 1
      }));
      
      let dest = "/dashboard";
      if (user.cargo === "COMPRADOR") dest = "/dashboard/compras";
      else if (user.cargo === "ALMOXARIFADO") dest = "/dashboard/almoxarifado";
      
      router.push(dest);
    } catch (err: any) {
      setError(`Erro: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastroCandidato() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('candidatos')
        .insert([{
          nome: candidato.nome,
          cpf: candidato.cpf.replace(/\D/g, ""),
          telefone: candidato.telefone.replace(/\D/g, ""),
          email: candidato.email,
          cargo_pretendido: candidato.cargo,
          cep: candidato.cep.replace(/\D/g, ""),
          rua: candidato.rua,
          numero: candidato.numero,
          experiencia_previa: candidato.experiencia
        }]);

      if (error) throw error;
      
      alert("Cadastro realizado com sucesso!");
      setModalTrabalhe(false);
      setStep(1);
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || "Erro desconhecido."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-neutral-950 transition-colors duration-500 font-sans selection:bg-orange-500/30 overflow-hidden">
      
      {/* Botão de Troca de Tema */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Background Decorativo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* --- MOCKUP DE CELULAR MODERNO --- */}
      <div className="relative w-full max-w-[420px] aspect-[9/19.5] max-h-[92vh] flex flex-col bg-white dark:bg-black rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border-[10px] border-slate-900 dark:border-neutral-900 overflow-hidden animate-fade-in">
        
        {/* Notch / Dynamic Island Sutil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 dark:bg-neutral-900 rounded-b-2xl z-40 flex items-center justify-center">
          <div className="w-10 h-1 bg-neutral-800 rounded-full" />
        </div>

        {/* Conteúdo do "Celular" */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-16 flex flex-col gap-8 relative">
          
          <div className="flex flex-col items-center text-center mt-4">
            <div className="w-20 h-20 bg-orange-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-8 transform transition-transform hover:rotate-6">
              <ShieldCheck className="text-white w-12 h-12 drop-shadow-lg" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Alicerce CRM</h1>
            <p className="text-slate-500 dark:text-neutral-500 font-bold text-xs uppercase tracking-widest">Sovereign Management System</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-50 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200 dark:border-neutral-800 p-8 rounded-[2.5rem] shadow-sm dark:shadow-none">
              <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-neutral-200">Acesso Restrito</h2>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">WhatsApp / Login</label>
                  <input
                    type="tel" required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-base shadow-sm"
                    placeholder="Seu número ou login"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} 
                      required
                      className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white tracking-[0.2em] font-sans text-xl placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-sm"
                      placeholder="Sua senha"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-600 hover:text-orange-500 transition-colors p-2"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px] font-bold flex items-center gap-3 animate-shake">
                    <Shield size={16} className="shrink-0 text-red-500" /> 
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="mt-4 w-full py-5 rounded-[1.5rem] bg-orange-600 text-white font-black text-sm shadow-[0_8px_30px_rgba(234,88,12,0.4)] hover:bg-orange-500 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      ENTRAR
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-slate-900 dark:bg-neutral-900/80 p-8 rounded-[2.5rem] text-center shadow-xl">
              <h2 className="text-white font-black text-lg mb-2">Seja Alicerce</h2>
              <p className="text-slate-400 dark:text-neutral-400 text-[13px] leading-relaxed mb-6 font-medium">
                Faça parte do nosso time. Cadastre seu currículo agora.
              </p>
              <button 
                onClick={() => setModalTrabalhe(true)} 
                className="w-full py-4 rounded-2xl bg-white text-slate-900 font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Trabalhe Conosco
              </button>
            </div>
          </div>

          <div className="mt-auto pt-8 flex flex-col items-center gap-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-[0.3em]">Criptografia Militar</p>
            <div className="flex gap-4 text-slate-300 dark:text-neutral-800 text-[9px] font-bold uppercase tracking-widest">
              <span>Versão 5.0.2</span>
              <span>•</span>
              <span>Status Online</span>
            </div>
          </div>
        </div>
      </div>

      <AdaptiveModal
        title={``}
        isOpen={modalTrabalhe}
        onClose={() => { setModalTrabalhe(false); setStep(1); }}
        width="440px"
      >
        <div className="flex flex-col min-h-[720px] p-10 lg:p-12 bg-white dark:bg-black rounded-[3.5rem] border-[8px] border-slate-900 dark:border-neutral-900 shadow-2xl relative overflow-hidden transition-all duration-500">
          
          {/* Luzes de fundo sutis no modal */}
          <div className="absolute top-[-5%] right-[-5%] w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header do Cadastro - Mais Espaçado */}
          <div className="text-center space-y-4 mb-10 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20">
              <Zap size={14} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 dark:text-orange-400">RECRUTAMENTO</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">Nova Inscrição</h2>
            <p className="text-slate-400 dark:text-neutral-500 font-bold text-[10px] uppercase tracking-widest">Portal Alicerce v5.0</p>
          </div>

          {/* Indicador de Passos Ultra-Minimalista */}
          <div className="flex items-center justify-between gap-2 mb-12 relative z-10 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
                <div 
                  className={`h-full bg-orange-600 transition-all duration-1000 ease-in-out ${i <= step ? 'w-full shadow-[0_0_8px_#ea580c]' : 'w-0'}`} 
                />
              </div>
            ))}
          </div>

          {/* Conteúdo Dinâmico - Mais Respiro Vertical */}
          <div className="flex-1 flex flex-col relative z-10 pb-16">
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="Identificação oficial"
                      value={candidato.nome}
                      onChange={e => setCandidato({...candidato, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">WhatsApp</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="92 9..."
                      value={candidato.telefone}
                      onChange={e => setCandidato({...candidato, telefone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">E-mail</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="exemplo@gmail.com"
                      value={candidato.email}
                      onChange={e => setCandidato({...candidato, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">CPF</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="Apenas números"
                      value={candidato.cpf}
                      onChange={e => setCandidato({...candidato, cpf: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">RG</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="Opcional"
                      value={candidato.rg}
                      onChange={e => setCandidato({...candidato, rg: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">CEP</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="00000-000"
                      value={candidato.cep}
                      onChange={e => setCandidato({...candidato, cep: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">Rua / Bairro</label>
                    <input 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
                      placeholder="Endereço completo"
                      value={candidato.rua}
                      onChange={e => setCandidato({...candidato, rua: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest ml-1">Cargo Desejado</label>
                    <select 
                      className="w-full bg-slate-50 dark:bg-neutral-900/50 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold text-base outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none"
                      value={candidato.cargo}
                      onChange={e => setCandidato({...candidato, cargo: e.target.value})}
                    >
                      <option value="ASG">Auxiliar de Serviços Gerais</option>
                      <option value="Porteiro">Porteiro</option>
                      <option value="Zelador">Zelador</option>
                      <option value="Encarregado">Encarregado(a)</option>
                    </select>
                  </div>
                  
                  <div 
                    onClick={() => setCandidato({...candidato, experiencia: !candidato.experiencia})}
                    className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-4 ${candidato.experiencia ? 'bg-orange-500/5 border-orange-500/40' : 'bg-slate-50 dark:bg-neutral-900/50 border-slate-200 dark:border-neutral-800'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${candidato.experiencia ? 'bg-orange-600 shadow-xl shadow-orange-600/40' : 'bg-slate-200 dark:bg-neutral-800'}`}>
                      {candidato.experiencia && <CheckCircle2 className="text-white w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Declaração de Veracidade</p>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-500 font-bold mt-2 leading-relaxed">Confirmo que todos os dados fornecidos são reais.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Vertical e Harmônico */}
          <div className="flex flex-col gap-4 mt-12 relative z-10">
            <button 
              onClick={step < 4 ? () => setStep(step + 1) : handleCadastroCandidato}
              disabled={step === 4 && (loading || !candidato.experiencia)}
              className="w-full py-6 rounded-[2rem] bg-orange-600 text-white font-black text-sm uppercase tracking-widest hover:bg-orange-500 active:scale-[0.98] transition-all shadow-2xl shadow-orange-600/30 disabled:opacity-50"
            >
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : (step === 4 ? "Finalizar" : "Próximo")}
            </button>
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="w-full py-4 rounded-2xl bg-transparent text-slate-400 dark:text-neutral-600 font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all"
              >
                Voltar etapa anterior
              </button>
            )}
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
