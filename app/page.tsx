"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Zap } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function LoginPage() {
  const router = useRouter();
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalTrabalhe, setModalTrabalhe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [candidato, setCandidato] = useState({ 
    nome: "", telefone: "", cargo: "ASG", cep: "", rua: "", bairro: "", uniforme: "", experiencia: false 
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Normalizar telefone (ex: 5511999999999)
    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) {
      setError("Por favor, insira um telefone válido com DDD.");
      setLoading(false);
      return;
    }

    // A senha devem ser os 4 últimos dígitos do telefone
    const senhaCorreta = telLimpo.slice(-4);
    if (senha !== senhaCorreta) {
      setError("Senha incorreta. Use os 4 últimos dígitos do seu telefone.");
      setLoading(false);
      return;
    }

    try {
      // Verificar usuário no Supabase
      // O banco armazena com @s.whatsapp.net ou apenas números
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .or(`telefone.eq.${telLimpo},telefone.eq.${telLimpo}@s.whatsapp.net`)
        .single();

      if (userError || !user) {
        setError("Usuário não cadastrado ou inativo.");
        setLoading(false);
        return;
      }

      // Login bem sucedido
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
    } catch (err) {
      setError("Falha na autenticação com o servidor.");
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

            {etapa === "codigo" && (
              <button type="button" onClick={() => setEtapa("telefone")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer", marginTop: "0.5rem" }}>
                Alterar número de telefone
              </button>
            )}
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

        {/* Modal Trabalhe Conosco Padronizado */}
        <AdaptiveModal
          title="Pré-Cadastro de Candidato"
          isOpen={modalTrabalhe}
          onClose={() => setModalTrabalhe(false)}
          width="550px"
        >
          <div className="flex flex-col gap-4">
            <p className="text-[0.8rem] text-[var(--text-secondary)] mb-2">Preencha seus dados para entrar no nosso banco de talentos oficial.</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="label-sm">Nome Completo *</label>
                <input className="input-field" required value={candidato.nome} onChange={e => setCandidato({...candidato, nome: e.target.value})} placeholder="Seu nome completo" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm">Telefone / WhatsApp *</label>
                  <input className="input-field" required value={candidato.telefone} onChange={e => setCandidato({...candidato, telefone: e.target.value})} placeholder="(XX) 99999-9999" />
                </div>
                <div>
                  <label className="label-sm">CEP *</label>
                  <input className="input-field" required value={candidato.cep} onChange={e => setCandidato({...candidato, cep: e.target.value})} placeholder="00000-000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div style={{ gridColumn: "span 2" }}>
                  <label className="label-sm">Rua / Av *</label>
                  <input className="input-field" required value={candidato.rua} onChange={e => setCandidato({...candidato, rua: e.target.value})} placeholder="Nome da rua" />
                </div>
                <div>
                  <label className="label-sm">Bairro *</label>
                  <input className="input-field" required value={candidato.bairro} onChange={e => setCandidato({...candidato, bairro: e.target.value})} placeholder="Bairro" />
                </div>
                <div>
                  <label className="label-sm">Cidade</label>
                  <input className="input-field" value="Manaus / AM" disabled />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm">Cargo de Interesse *</label>
                  <select className="input-field" required value={candidato.cargo} onChange={e => setCandidato({...candidato, cargo: e.target.value})}>
                    <option value="ASG">ASG</option>
                    <option value="Porteiro">Porteiro</option>
                    <option value="Zelador">Zelador</option>
                    <option value="Encarregado">Encarregado</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Tamanho Uniforme *</label>
                  <select className="input-field" required value={candidato.uniforme} onChange={e => setCandidato({...candidato, uniforme: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="exp" checked={candidato.experiencia} onChange={e => setCandidato({...candidato, experiencia: e.target.checked})} className="w-4 h-4 cursor-pointer" />
                <label htmlFor="exp" className="text-xs text-[var(--text-primary)] cursor-pointer">Já possuo experiência na função selecionada</label>
              </div>
            </div>
            
            <button 
              className="btn-brand w-full mt-4 !h-14"
              onClick={() => { alert("Cadastro enviado com sucesso para o RH!"); setModalTrabalhe(false); }}
            >
              Enviar Currículo para Triagem
            </button>
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
