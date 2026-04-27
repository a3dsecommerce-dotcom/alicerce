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
    tamanho_camisa: "M", tamanho_calcado: "40",
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
    <div className="login-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      {/* Partículas decorativas */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(232,98,26,0.06)" : "rgba(59,130,246,0.04)",
            width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
            top: `${10 + i * 15}%`, left: `${5 + i * 18}%`,
            filter: "blur(40px)"
          }} />
        ))}
      </div>

      <div className="animate-fade-in" style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "200px", height: "80px",
            marginBottom: "0.5rem",
          }}>
            <img src="/logo.png" alt="Alicerce Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Alicerce ERP
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Intelligence Operations Center
          </p>
        </div>

        {/* Card de Login */}
        <div className="card" style={{ padding: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Acesso Soberano
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
              Utilize seu telefone e os 4 últimos dígitos como senha.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Telefone (Usuário)
              </label>
              <input
                type="tel" required
                className="input-field"
                placeholder="(92) 9XXXX-XXXX"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
                Senha (4 últimos dígitos)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"} 
                  required maxLength={4}
                  className="input-field"
                  placeholder="****"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "0.75rem", fontSize: "0.8rem", color: "#EF4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={14} /> {error}
              </div>
            )}

            <button type="submit" className="btn-brand" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Autenticando...
                </>
              ) : "Entrar no Sistema"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)", textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Sua segurança é nossa prioridade. O acesso é biométrico via dispositivo.
            </p>
            <button onClick={() => setModalTrabalhe(true)} style={{ background: "none", border: "none", color: "var(--brand)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
              Quer fazer parte da equipe? Trabalhe Conosco
            </button>
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

        {/* Níveis de acesso */}
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
          {[
            { label: "Colaborador", color: "var(--text-muted)" },
            { label: "Encarregado", color: "var(--info)" },
            { label: "RH / Supervisor", color: "var(--warning)" },
            { label: "Diretoria", color: "var(--brand)" },
          ].map(n => (
            <span key={n.label} style={{ fontSize: "0.7rem", color: n.color, fontWeight: 500 }}>● {n.label}</span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
