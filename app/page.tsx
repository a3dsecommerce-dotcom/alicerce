"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Zap } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { supabase } from "@/lib/supabase";

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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden">
      
      {/* BACKGROUND PREMIUM SOBERANO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand)]/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="animate-fade-in w-full max-w-[480px] relative z-10 flex flex-col items-center">
        
        {/* LOGO & BRANDING */}
        <div className="text-center mb-12 flex flex-col items-center">
          <div className="w-20 h-20 mb-6 p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] backdrop-blur-xl flex items-center justify-center relative group">
            <div className="absolute inset-0 rounded-3xl border border-[var(--brand)]/40 opacity-0 group-hover:opacity-100 transition-all duration-700 scale-[1.02]" />
            <img src="/logo.png" alt="Alicerce Logo" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight mb-2">
            Alicerce <span className="text-[var(--brand)]">ERP</span>
          </h1>
          <p className="text-[0.7rem] font-bold text-white/40 uppercase tracking-[0.4em] mt-1">
            Sovereign Command Center
          </p>
        </div>

        {/* CARD DE LOGIN "CARTÃO DE VISITAS PREMIUM" */}
        <div className="w-full bg-[#0d0d0d]/80 backdrop-blur-3xl border border-white/10 p-10 lg:p-12 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent opacity-60" />
          
          <div className="mb-10 text-center">
            <h2 className="text-xl font-medium text-white mb-2">
              Acesso Restrito
            </h2>
            <p className="text-[0.8rem] text-white/40">
              Credenciais biométricas atreladas ao número de contato.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-bold text-white/50 uppercase tracking-widest pl-1">
                Identificação (Telefone)
              </label>
              <input
                type="tel" required
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/20 focus:bg-white/[0.06] focus:border-[var(--brand)]/60 focus:ring-4 focus:ring-[var(--brand)]/10 outline-none transition-all duration-300"
                placeholder="(92) 9XXXX-XXXX"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-bold text-white/50 uppercase tracking-widest pl-1">
                Chave de Acesso (4 Dígitos)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  required maxLength={4}
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 pr-14 text-white tracking-[0.3em] font-mono text-lg placeholder-white/20 focus:bg-white/[0.06] focus:border-[var(--brand)]/60 focus:ring-4 focus:ring-[var(--brand)]/10 outline-none transition-all duration-300"
                  placeholder="••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-3 animate-fade-in">
                <Shield size={16} className="shrink-0" /> 
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="mt-6 w-full py-5 rounded-2xl bg-white text-black hover:bg-gray-100 font-black uppercase text-[0.8rem] tracking-[0.2em] shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:bg-white/20 disabled:text-white flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  Entrar no Hub
                  <Zap size={16} className="text-black group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-3">
            <button 
              onClick={() => setModalTrabalhe(true)} 
              className="text-[0.75rem] font-bold text-white/50 hover:text-[var(--brand)] uppercase tracking-wider transition-colors"
            >
              Trabalhe Conosco (Cadastro)
            </button>
          </div>
        </div>
        
        {/* FOOTER DO CARTÃO */}
        <div className="mt-8 flex gap-6 text-white/20 text-[0.65rem] font-black uppercase tracking-widest">
          <span>Alicerce © 2026</span>
          <span>•</span>
          <span>Sovereign Security</span>
        </div>
      </div>

        {/* Modal de Cadastro Avançado V45.0 (PREMIUM SOBERANO) */}
        <AdaptiveModal
          title={`Triagem de Talentos (Passo ${step} de 4)`}
          isOpen={modalTrabalhe}
          onClose={() => { setModalTrabalhe(false); setStep(1); }}
          width="800px"
        >
          <div className="flex flex-col gap-6 p-2">
            
            {/* PROGRESS BAR EXECUTIVA */}
            <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden flex shadow-inner">
               {[1,2,3,4].map(i => (
                 <div key={i} className={`h-full flex-1 border-r border-[var(--bg-card)] transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)]' : 'bg-transparent'}`} />
               ))}
            </div>

            {step === 1 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-[var(--border)] pb-2 mb-2">
                  <h3 className="text-sm font-black uppercase text-[var(--brand)] tracking-widest">1. Identificação Básica</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Preencha seus dados de contato e identificação primária.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Nome Completo Oficial *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.nome} onChange={e => setCandidato({...candidato, nome: e.target.value})} placeholder="Conforme documento de identidade" />
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Telefone / WhatsApp *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.telefone} onChange={e => setCandidato({...candidato, telefone: e.target.value})} placeholder="(92) 99999-9999" />
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">E-mail de Contato *</label>
                    <input type="email" className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.email} onChange={e => setCandidato({...candidato, email: e.target.value})} placeholder="seu.email@exemplo.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Data de Nascimento *</label>
                    <input type="date" className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.data_nascimento} onChange={e => setCandidato({...candidato, data_nascimento: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-[var(--border)] pb-2 mb-2">
                  <h3 className="text-sm font-black uppercase text-[var(--brand)] tracking-widest">2. Documentação Oficial</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Dados necessários para o processo de admissão (eSocial).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">CPF *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.cpf} onChange={e => setCandidato({...candidato, cpf: e.target.value})} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">RG / Identidade</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" value={candidato.rg} onChange={e => setCandidato({...candidato, rg: e.target.value})} placeholder="Número do RG" />
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">PIS / NIS</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" value={candidato.pis} onChange={e => setCandidato({...candidato, pis: e.target.value})} placeholder="Número do PIS" />
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Título de Eleitor</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" value={candidato.titulo} onChange={e => setCandidato({...candidato, titulo: e.target.value})} placeholder="Número do Título" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-[var(--border)] pb-2 mb-2">
                  <h3 className="text-sm font-black uppercase text-[var(--brand)] tracking-widest">3. Endereço e Logística</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Para análise de rota e auxílio transporte.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <label className="label-sm text-[var(--text-secondary)]">CEP *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.cep} onChange={e => setCandidato({...candidato, cep: e.target.value})} placeholder="00000-000" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Logradouro / Rua *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.rua} onChange={e => setCandidato({...candidato, rua: e.target.value})} placeholder="Ex: Av. Sete de Setembro" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="label-sm text-[var(--text-secondary)]">Número *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.numero} onChange={e => setCandidato({...candidato, numero: e.target.value})} placeholder="S/N ou Nº" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Bairro *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.bairro} onChange={e => setCandidato({...candidato, bairro: e.target.value})} placeholder="Nome do Bairro" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Cidade *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.cidade} onChange={e => setCandidato({...candidato, cidade: e.target.value})} placeholder="Manaus" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="label-sm text-[var(--text-secondary)]">UF *</label>
                    <input className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.estado} onChange={e => setCandidato({...candidato, estado: e.target.value})} placeholder="AM" maxLength={2} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="border-b border-[var(--border)] pb-2 mb-2">
                  <h3 className="text-sm font-black uppercase text-[var(--brand)] tracking-widest">4. Perfil Profissional & SST</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Alocação de cargo e preparação de fardamento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Cargo de Interesse *</label>
                    <select className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.cargo} onChange={e => setCandidato({...candidato, cargo: e.target.value})}>
                      <option value="ASG">Auxiliar de Serviços Gerais (ASG)</option>
                      <option value="Porteiro">Porteiro</option>
                      <option value="Zelador">Zelador</option>
                      <option value="Encarregado">Encarregado(a)</option>
                      <option value="Administrativo">Auxiliar Administrativo</option>
                      <option value="Tecnico_SST">Técnico de Seg. do Trabalho</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Grau de Escolaridade *</label>
                    <select className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.escolaridade} onChange={e => setCandidato({...candidato, escolaridade: e.target.value})}>
                      <option value="Fundamental Incompleto">Fundamental Incompleto</option>
                      <option value="Fundamental Completo">Fundamental Completo</option>
                      <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                      <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                      <option value="Superior Completo">Superior Completo</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Tamanho do Fardamento (Camisa) *</label>
                    <select className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.tamanho_camisa} onChange={e => setCandidato({...candidato, tamanho_camisa: e.target.value})}>
                      <option value="PP">PP</option>
                      <option value="P">P</option>
                      <option value="M">M</option>
                      <option value="G">G</option>
                      <option value="GG">GG</option>
                      <option value="XG">XG / EXG</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-sm text-[var(--text-secondary)]">Tamanho do Fardamento (Calça) *</label>
                    <select className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.tamanho_calca} onChange={e => setCandidato({...candidato, tamanho_calca: e.target.value})}>
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
                    <label className="label-sm text-[var(--text-secondary)]">Numeração do Calçado de Segurança *</label>
                    <input type="number" min="30" max="50" className="input-field bg-[var(--bg-base)] border-[var(--border)]" required value={candidato.tamanho_calcado} onChange={e => setCandidato({...candidato, tamanho_calcado: e.target.value})} placeholder="Ex: 40" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-sm text-[var(--text-secondary)]">Último Emprego / Resumo Profissional</label>
                    <textarea className="input-field bg-[var(--bg-base)] border-[var(--border)]" rows={3} value={candidato.ultimo_emprego} onChange={e => setCandidato({...candidato, ultimo_emprego: e.target.value})} placeholder="Cite suas últimas empresas e funções exercidas..." />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)]">
                    <input type="checkbox" id="exp" checked={candidato.experiencia} onChange={e => setCandidato({...candidato, experiencia: e.target.checked})} className="w-5 h-5 cursor-pointer accent-[var(--brand)]" />
                    <label htmlFor="exp" className="text-sm font-semibold text-[var(--text-primary)] cursor-pointer">
                      Declaro que possuo experiência na função pretendida e que as informações são verdadeiras.
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6 pt-4 border-t border-[var(--border)]">
              {step > 1 && (
                <button className="flex-1 px-8 py-4 bg-[var(--bg-base)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors rounded-2xl font-black uppercase text-xs tracking-wider shadow-sm" onClick={() => setStep(step - 1)}>
                  Voltar Passo
                </button>
              )}
              {step < 4 ? (
                <button className="flex-[2] btn-brand !h-14 shadow-lg shadow-[var(--brand)]/20" onClick={() => setStep(step + 1)}>
                  Avançar <span className="opacity-50 ml-1">({step}/4)</span>
                </button>
              ) : (
                <button className="flex-[2] btn-brand !h-14 shadow-xl shadow-[var(--brand)]/30 border border-white/10" onClick={handleCadastroCandidato} disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando para Triagem...
                    </div>
                  ) : "Finalizar Cadastro de Candidato"}
                </button>
              )}
            </div>
          </div>
        </AdaptiveModal>

      </div>
  );
}
