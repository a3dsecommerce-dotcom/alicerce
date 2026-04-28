"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
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
      // Busca Omni-Format (Com 55, Sem 55, Com WhatsApp suffix)
      const telCom55 = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
      const telSem55 = telLimpo.startsWith("55") ? telLimpo.slice(2) : telLimpo;

      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .or(`telefone.eq.${telCom55},telefone.eq.${telSem55},telefone.eq.${telCom55}@s.whatsapp.net,telefone.eq.${telSem55}@s.whatsapp.net`)
        .single();

      if (userError || !user) {
        console.warn("Login falhou para:", telLimpo, userError);
        setError("Usuário não encontrado. Verifique se o número está no banco.");
        setLoading(false);
        return;
      }

      // Set cookie to bypass middleware checks
      document.cookie = `auth_token=al_sovereign_${user.id}; path=/; max-age=86400`;

      localStorage.setItem("crm_user", JSON.stringify({ 
        email: user.telefone, 
        role: user.cargo, 
        name: user.nome,
        nivel: user.nivel_acesso 
      }));
      
      let dest = "/dashboard";
      if (user.cargo === "COMPRADOR") dest = "/dashboard/compras";
      else if (user.cargo === "ALMOXARIFADO") dest = "/dashboard/almoxarifado";
      
      router.push(dest);
    } catch (err: any) {
      console.error("ERRO LOGIN DETALHADO:", err);
      setError(`Erro: ${err.message || String(err)}. Verifique o Console (F12).`);
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
          rg: candidato.rg,
          pis: candidato.pis,
          titulo_eleitor: candidato.titulo,
          telefone: candidato.telefone.replace(/\D/g, ""),
          email: candidato.email,
          data_nascimento: candidato.data_nascimento,
          cargo_pretendido: candidato.cargo,
          escolaridade: candidato.escolaridade,
          cep: candidato.cep.replace(/\D/g, ""),
          rua: candidato.rua,
          numero: candidato.numero,
          bairro: candidato.bairro,
          cidade: candidato.cidade,
          estado: candidato.estado,
          tamanho_camisa: candidato.tamanho_camisa,
          tamanho_calca: candidato.tamanho_calca,
          tamanho_calcado: parseInt(candidato.tamanho_calcado),
          experiencia_previa: candidato.experiencia,
          ultimo_emprego: candidato.ultimo_emprego
        }]);

      if (error) throw error;
      
      alert("Cadastro realizado com sucesso! Aguarde contato do RH.");
      setModalTrabalhe(false);
      setStep(1);
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || "Verifique os dados."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)] font-sans text-[var(--text-primary)] overflow-hidden transition-colors duration-300">
      
      {/* --- THEME TOGGLE --- */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand)]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand)]/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay dark:opacity-[0.05]" />
      </div>

      {/* --- FORMULÁRIO DE ACESSO CENTRALIZADO --- */}
      <div className="w-full max-w-[460px] flex flex-col justify-center items-center relative z-10 animate-fade-in">
        
        {/* Logo & Slogan Centralizados */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-[var(--bg-card)] p-4 rounded-3xl shadow-2xl shadow-[var(--border)] mb-5 border border-[var(--border)] flex items-center justify-center">
            <img src="/logo.png" alt="Alicerce Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-[2.25rem] font-black text-[var(--text-primary)] tracking-tight">Alicerce ERP</h1>
          <p className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-[0.4em] mt-1">Sovereign Command</p>
        </div>
          
        {/* Formulário Container - Enterprise Clean Style */}
        <div className="w-full bg-[var(--bg-card)] border border-[var(--border)] p-8 sm:p-12 rounded-[1.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none relative flex flex-col justify-center min-h-[480px]">
          
          <div className="mb-10 text-left">
            <h2 className="text-[1.75rem] font-black text-[var(--text-primary)] mb-2 tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="text-[var(--text-secondary)] font-medium text-[0.95rem]">
              Insira suas credenciais corporativas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6 flex-1">
            <div className="group">
              <input
                type="tel" required
                className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-5 py-4 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:bg-[var(--bg-card)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 outline-none transition-all font-medium text-[1rem] hover:border-[var(--text-muted)]"
                placeholder="Login"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
              />
            </div>

            <div className="group">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  required maxLength={4}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl px-5 py-4 pr-12 text-[var(--text-primary)] tracking-[0.25em] font-mono text-xl placeholder-[var(--text-muted)] focus:bg-[var(--bg-card)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 outline-none transition-all hover:border-[var(--text-muted)]"
                  placeholder="Senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--brand)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-card-hover)]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-fade-in shadow-sm">
                <Shield size={18} className="shrink-0 text-red-500" /> 
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="mt-4 w-full py-4 rounded-xl bg-[var(--text-primary)] text-[var(--bg-card)] hover:opacity-90 font-bold text-[1rem] shadow-lg shadow-[var(--text-primary)]/10 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 group/btn"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight size={18} className="text-[var(--bg-card)] group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[var(--border)] text-center">
            <button 
              onClick={() => setModalTrabalhe(true)} 
              className="text-[0.85rem] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2 group/link w-full py-3 rounded-xl hover:bg-[var(--bg-card-hover)]"
            >
              Candidatar-se à Vaga <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        {/* FOOTER DO CARTÃO */}
        <div className="mt-8 flex gap-6 text-slate-400 text-[0.65rem] font-black uppercase tracking-widest">
          <span>Alicerce © 2026</span>
          <span>•</span>
          <span>Sovereign Security</span>
        </div>
      </div>

      {/* --- MODAL DE CADASTRO: CORPORATIVO E MINIMALISTA --- */}
      <AdaptiveModal
        title={``}
        isOpen={modalTrabalhe}
        onClose={() => { setModalTrabalhe(false); setStep(1); }}
        width="800px"
      >
        <div className="flex flex-col p-2 lg:p-6">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cadastro de Candidato</h2>
            <p className="text-slate-500 font-medium text-sm mt-2">Siga as etapas para registrar suas informações no banco de talentos da Alicerce.</p>
          </div>

          {/* PROGRESS BAR ESTILO STRIPE */}
          <div className="w-full flex gap-2 mb-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex-1 h-2 rounded-full overflow-hidden bg-slate-100 relative">
                <div className={`absolute top-0 left-0 h-full w-full transition-transform duration-700 ease-out ${i <= step ? 'translate-x-0 bg-[var(--brand)]' : '-translate-x-full bg-[var(--brand)]'}`} />
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3">1. Informações Pessoais Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo Oficial *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.nome} onChange={e => setCandidato({...candidato, nome: e.target.value})} placeholder="Conforme documento" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Celular / WhatsApp *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.telefone} onChange={e => setCandidato({...candidato, telefone: e.target.value})} placeholder="(92) 99999-9999" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">E-mail Profissional *</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.email} onChange={e => setCandidato({...candidato, email: e.target.value})} placeholder="nome@exemplo.com" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Data de Nascimento *</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm text-slate-600" required value={candidato.data_nascimento} onChange={e => setCandidato({...candidato, data_nascimento: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3">2. Documentação e eSocial</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">CPF *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.cpf} onChange={e => setCandidato({...candidato, cpf: e.target.value})} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Identidade (RG)</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" value={candidato.rg} onChange={e => setCandidato({...candidato, rg: e.target.value})} placeholder="Opcional neste passo" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">PIS / NIS</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" value={candidato.pis} onChange={e => setCandidato({...candidato, pis: e.target.value})} placeholder="Número do PIS" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Título de Eleitor</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" value={candidato.titulo} onChange={e => setCandidato({...candidato, titulo: e.target.value})} placeholder="Opcional" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3">3. Localização Estratégica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">CEP *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.cep} onChange={e => setCandidato({...candidato, cep: e.target.value})} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Endereço (Rua/Av) *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.rua} onChange={e => setCandidato({...candidato, rua: e.target.value})} placeholder="Sua rua" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Número *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.numero} onChange={e => setCandidato({...candidato, numero: e.target.value})} placeholder="Nº" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bairro *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.bairro} onChange={e => setCandidato({...candidato, bairro: e.target.value})} placeholder="Seu bairro" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cidade *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.cidade} onChange={e => setCandidato({...candidato, cidade: e.target.value})} placeholder="Manaus" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Estado *</label>
                  <input className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.estado} onChange={e => setCandidato({...candidato, estado: e.target.value})} placeholder="AM" maxLength={2} />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 pb-3">4. Vaga & Logística Operacional (SST)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cargo Pretendido *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.cargo} onChange={e => setCandidato({...candidato, cargo: e.target.value})}>
                    <option value="ASG">Auxiliar de Serviços Gerais (ASG)</option>
                    <option value="Porteiro">Porteiro</option>
                    <option value="Zelador">Zelador</option>
                    <option value="Encarregado">Encarregado(a)</option>
                    <option value="Administrativo">Auxiliar Administrativo</option>
                    <option value="Tecnico_SST">Técnico de Seg. do Trabalho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Escolaridade *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.escolaridade} onChange={e => setCandidato({...candidato, escolaridade: e.target.value})}>
                    <option value="Fundamental Incompleto">Fundamental Incompleto</option>
                    <option value="Fundamental Completo">Fundamental Completo</option>
                    <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                    <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                    <option value="Superior Completo">Superior Completo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tamanho da Camisa (EPI) *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.tamanho_camisa} onChange={e => setCandidato({...candidato, tamanho_camisa: e.target.value})}>
                    <option value="PP">PP</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="XG">XG / EXG</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tamanho da Calça (EPI) *</label>
                  <select className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.tamanho_calca} onChange={e => setCandidato({...candidato, tamanho_calca: e.target.value})}>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                    <option value="44">44</option>
                    <option value="46">46</option>
                    <option value="48">48</option>
                    <option value="50">50</option>
                    <option value="52">52+</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tamanho do Calçado (Botina) *</label>
                  <input type="number" min="30" max="50" className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" required value={candidato.tamanho_calcado} onChange={e => setCandidato({...candidato, tamanho_calcado: e.target.value})} placeholder="Ex: 40" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Último Emprego / Resumo (Opcional)</label>
                  <textarea className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 rounded-xl px-4 py-4 outline-none transition-all font-medium text-sm" rows={3} value={candidato.ultimo_emprego} onChange={e => setCandidato({...candidato, ultimo_emprego: e.target.value})} placeholder="Onde você trabalhou por último e o que fazia?" />
                </div>
                <div className="md:col-span-2 flex items-start gap-4 bg-slate-50 p-5 rounded-[1rem] border border-slate-200 mt-2 hover:border-[var(--brand)]/30 transition-colors">
                  <div className="mt-1">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center cursor-pointer overflow-hidden transition-colors" onClick={() => setCandidato({...candidato, experiencia: !candidato.experiencia})}>
                       {candidato.experiencia ? <CheckCircle2 className="text-[var(--brand)] w-full h-full" /> : <div className="w-full h-full bg-transparent" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-[13px] font-bold text-slate-700 cursor-pointer" onClick={() => setCandidato({...candidato, experiencia: !candidato.experiencia})}>
                      Confirmo a veracidade das informações
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1">Declaro que possuo experiência na área e que os dados informados acima são reais.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-10 pt-6 border-t border-slate-100">
            {step > 1 && (
              <button className="flex-1 py-4 bg-white text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors rounded-xl font-black uppercase text-[11px] tracking-widest shadow-sm" onClick={() => setStep(step - 1)}>
                Voltar
              </button>
            )}
            {step < 4 ? (
              <button className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-800 transition-colors shadow-lg flex justify-center items-center gap-2" onClick={() => setStep(step + 1)}>
                Próxima Etapa <ArrowRight size={14} />
              </button>
            ) : (
              <button className="flex-[2] py-4 bg-[var(--brand)] text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-[var(--brand)]/30 flex justify-center items-center gap-2 disabled:opacity-50" onClick={handleCadastroCandidato} disabled={loading || !candidato.experiencia}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando Banco...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Finalizar Inscrição
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </AdaptiveModal>

    </div>
  );
}
