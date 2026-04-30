"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, Shield, ShieldCheck, Zap, Network, Database, CheckCircle2, ArrowLeftRight } from "lucide-react";
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
  const [step, setStep] = useState(1);
  const [candidato, setCandidato] = useState({
    nome: "", cpf: "", rg: "", telefone: "", email: "",
    cargo: "ASG", cep: "", rua: "", numero: "", experiencia: false,
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) { setError("Telefone inválido."); setLoading(false); return; }
    const senhaCorreta = telLimpo.slice(-4);
    if (senha !== senhaCorreta) { setError("Senha incorreta — use os 4 últimos dígitos."); setLoading(false); return; }
    try {
      const telCom55 = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
      const telSem55 = telLimpo.startsWith("55") ? telLimpo.slice(2) : telLimpo;
      const { data: user, error: userError } = await supabase.from('usuarios').select('*')
        .or(`telefone.eq.${telCom55},telefone.eq.${telSem55},telefone.eq.${telCom55}@s.whatsapp.net,telefone.eq.${telSem55}@s.whatsapp.net`)
        .single();
      if (userError || !user) { setError("Usuário não encontrado."); setLoading(false); return; }
      document.cookie = `auth_token=al_sovereign_${user.id}; path=/; max-age=86400`;
      const cargoResolvido = user.cargo || (user.nivel_acesso >= 4 ? 'ADMIN' : user.nivel_acesso >= 3 ? 'GERENTE' : user.nivel_acesso >= 2 ? 'SUPERVISOR' : 'COLABORADOR');
      localStorage.setItem("crm_user", JSON.stringify({ email: user.telefone, role: cargoResolvido, name: user.nome, nivel: user.nivel_acesso || 1 }));
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
      const { error } = await supabase.from('candidatos').insert([{
        nome: candidato.nome, cpf: candidato.cpf.replace(/\D/g, ""),
        telefone: candidato.telefone.replace(/\D/g, ""), email: candidato.email,
        cargo_pretendido: candidato.cargo, cep: candidato.cep.replace(/\D/g, ""),
        rua: candidato.rua, numero: candidato.numero, experiencia_previa: candidato.experiencia,
      }]);
      if (error) throw error;
      alert("Cadastro realizado com sucesso! Entraremos em contato.");
      setModalTrabalhe(false); setStep(1);
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || "Erro desconhecido."));
    } finally { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .login-body {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #0f1117;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          pointer-events: none;
        }
        .blob-1 { width: 500px; height: 500px; background: #ea580c; top: -15%; left: -10%; }
        .blob-2 { width: 600px; height: 600px; background: #c2410c; bottom: -20%; right: -10%; }
        .blob-3 { width: 300px; height: 300px; background: #fb923c; top: 40%; left: 40%; }
        .glass-card {
          width: min(900px, 95vw);
          min-height: 520px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 28px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          display: flex;
          position: relative;
          z-index: 10;
          overflow: hidden;
        }
        .left-panel {
          flex: 1;
          padding: 50px 45px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(255,255,255,0.08);
          position: relative;
        }
        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(234,88,12,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .right-panel {
          flex: 1;
          padding: 50px 45px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .swap-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 48px;
          height: 48px;
          background: #ea580c;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 0 0 6px rgba(234,88,12,0.15), 0 8px 25px rgba(234,88,12,0.4);
          z-index: 20;
          cursor: default;
        }
        .brand-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(234,88,12,0.2);
          border: 1px solid rgba(234,88,12,0.4);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          color: #fb923c;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 24px;
        }
        .brand-tag span { width: 6px; height: 6px; background: #ea580c; border-radius: 50%; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .welcome-h2 { font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.5); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
        .brand-name { font-size: 42px; font-weight: 900; color: white; line-height: 1; letter-spacing: -2px; }
        .brand-name span { color: #ea580c; }
        .brand-sub { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.4); margin-top: 10px; letter-spacing: 0.1em; text-transform: uppercase; }
        .btn-trabalhe {
          padding: 14px 28px;
          border-radius: 30px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.05em;
          align-self: flex-start;
        }
        .btn-trabalhe:hover { background: rgba(234,88,12,0.25); border-color: rgba(234,88,12,0.5); }
        .footer-icons { display: flex; gap: 16px; align-items: center; }
        .footer-icon { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); cursor: default; transition: all 0.3s; }
        .footer-icon:hover { background: rgba(234,88,12,0.15); border-color: rgba(234,88,12,0.3); color: #ea580c; }
        .login-title { font-size: 22px; font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 6px; text-align: center; }
        .login-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 32px; text-align: center; }
        .login-form { width: 100%; max-width: 320px; display: flex; flex-direction: column; align-items: center; }
        .input-wrap {
          width: 100%;
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          padding: 14px 18px;
          margin-bottom: 14px;
          transition: all 0.3s;
        }
        .input-wrap:focus-within { border-color: rgba(234,88,12,0.6); background: rgba(234,88,12,0.07); box-shadow: 0 0 0 3px rgba(234,88,12,0.1); }
        .input-wrap svg { color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .input-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.12); margin: 0 14px; }
        .input-wrap input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif; }
        .input-wrap input::placeholder { color: rgba(255,255,255,0.25); }
        .input-wrap button { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.35); padding: 0; display: flex; transition: color 0.2s; }
        .input-wrap button:hover { color: rgba(255,255,255,0.7); }
        .form-opts { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .remember { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.45); cursor: pointer; }
        .remember input[type=checkbox] { accent-color: #ea580c; cursor: pointer; }
        .forgot { font-size: 12px; color: #fb923c; text-decoration: none; font-weight: 600; transition: color 0.2s; }
        .forgot:hover { color: white; }
        .btn-entrar {
          width: 100%;
          padding: 15px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.3s;
          box-shadow: 0 8px 25px rgba(234,88,12,0.4);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-entrar:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(234,88,12,0.5); }
        .btn-entrar:disabled { opacity: 0.6; transform: none; cursor: not-allowed; }
        .error-box {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .security-row { display: flex; gap: 8px; margin-top: 24px; align-items: center; }
        .sec-badge { display: flex; align-items: center; gap: 5px; font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
        .sec-dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        @media (max-width: 640px) {
          .glass-card { flex-direction: column; min-height: auto; }
          .left-panel { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 36px 30px; }
          .swap-btn { display: none; }
          .right-panel { padding: 36px 30px; }
        }
      `}</style>

      <div className="login-body">
        {/* Blobs de fundo */}
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />

        <div className="glass-card">
          {/* PAINEL ESQUERDO — Marca */}
          <section className="left-panel">
            <div>
              <div className="brand-tag">
                <span /> Sistema Ativo
              </div>
              <p className="welcome-h2">Bem-vindo ao</p>
              <h1 className="brand-name">Ali<span>cerce</span></h1>
              <p className="brand-sub">Portal de Gestão Soberana · v5.0</p>
            </div>

            <button className="btn-trabalhe" onClick={() => setModalTrabalhe(true)}>
              Trabalhe Conosco
            </button>

            <div className="footer-icons">
              <div className="footer-icon" title="Rede segura"><Network size={16} /></div>
              <div className="footer-icon" title="Banco de dados"><Database size={16} /></div>
              <div className="footer-icon" title="Segurança SSL"><Shield size={16} /></div>
            </div>
          </section>

          {/* Botão central */}
          <div className="swap-btn">
            <ShieldCheck size={20} color="white" />
          </div>

          {/* PAINEL DIREITO — Formulário */}
          <section className="right-panel">
            <h2 className="login-title">Acesso Restrito</h2>
            <p className="login-sub">Use seu WhatsApp e os 4 últimos dígitos</p>

            <form className="login-form" onSubmit={handleLogin}>
              {error && (
                <div className="error-box">
                  <Shield size={14} />
                  {error}
                </div>
              )}

              <div className="input-wrap">
                <Phone size={16} />
                <div className="input-divider" />
                <input
                  type="tel"
                  placeholder="WhatsApp / Login"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  required
                />
              </div>

              <div className="input-wrap">
                <Lock size={16} />
                <div className="input-divider" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="form-opts">
                <label className="remember">
                  <input type="checkbox" /> Lembrar acesso
                </label>
                <a href="#" className="forgot">Esqueceu a senha?</a>
              </div>

              <button type="submit" className="btn-entrar" disabled={loading}>
                {loading ? <div className="spinner" /> : <><Zap size={15} /> Entrar no Sistema</>}
              </button>

              <div className="security-row">
                <div className="sec-badge"><ShieldCheck size={10} /> SSL Ativo</div>
                <div className="sec-dot" />
                <div className="sec-badge"><Database size={10} /> Dados Seguros</div>
                <div className="sec-dot" />
                <div className="sec-badge">v5.0</div>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* Modal Trabalhe Conosco */}
      <AdaptiveModal title="" isOpen={modalTrabalhe} onClose={() => { setModalTrabalhe(false); setStep(1); }} width="440px">
        <div style={{ padding: "2.5rem", background: "#0f1117", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontFamily: "'Inter', sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", background: "rgba(234,88,12,0.15)", border: "1px solid rgba(234,88,12,0.3)", borderRadius: "20px", fontSize: "10px", fontWeight: 700, color: "#fb923c", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
              <Zap size={12} /> Recrutamento Alicerce
            </div>
            <h2 style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>Nova Inscrição</h2>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Preencha seus dados para participar do processo seletivo</p>
          </div>

          {/* Indicador de passos */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= step ? "#ea580c" : "rgba(255,255,255,0.1)", transition: "background 0.4s", boxShadow: i <= step ? "0 0 8px rgba(234,88,12,0.5)" : "none" }} />
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Nome Completo", key: "nome", placeholder: "Seu nome oficial", type: "text" },
                { label: "WhatsApp", key: "telefone", placeholder: "92 9...", type: "tel" },
                { label: "E-mail", key: "email", placeholder: "exemplo@gmail.com", type: "email" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(candidato as any)[f.key]} onChange={e => setCandidato({...candidato, [f.key]: e.target.value})}
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", fontFamily: "'Inter', sans-serif" }} />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "CPF", key: "cpf", placeholder: "Apenas números", type: "text" },
                { label: "CEP", key: "cep", placeholder: "00000-000", type: "text" },
                { label: "Endereço", key: "rua", placeholder: "Rua e bairro", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={(candidato as any)[f.key]} onChange={e => setCandidato({...candidato, [f.key]: e.target.value})}
                    style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", fontFamily: "'Inter', sans-serif" }} />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Cargo Desejado</label>
                <select value={candidato.cargo} onChange={e => setCandidato({...candidato, cargo: e.target.value})}
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "white", fontSize: "14px", outline: "none", fontFamily: "'Inter', sans-serif" }}>
                  <option value="ASG">Auxiliar de Serviços Gerais</option>
                  <option value="Porteiro">Porteiro</option>
                  <option value="Zelador">Zelador</option>
                  <option value="Encarregado">Encarregado(a)</option>
                </select>
              </div>
              <div onClick={() => setCandidato({...candidato, experiencia: !candidato.experiencia})}
                style={{ padding: "20px", borderRadius: "12px", border: `2px solid ${candidato.experiencia ? "rgba(234,88,12,0.5)" : "rgba(255,255,255,0.1)"}`, background: candidato.experiencia ? "rgba(234,88,12,0.08)" : "rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "center", transition: "all 0.3s" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: candidato.experiencia ? "#ea580c" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", transition: "all 0.3s" }}>
                  {candidato.experiencia && <CheckCircle2 size={22} color="white" />}
                </div>
                <p style={{ fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Declaração de Veracidade</p>
                <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>Confirmo que todos os dados fornecidos são verdadeiros.</p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "28px" }}>
            <button onClick={step < 3 ? () => setStep(step + 1) : handleCadastroCandidato}
              disabled={step === 3 && (!candidato.experiencia || loading)}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #ea580c, #c2410c)", border: "none", color: "white", fontSize: "13px", fontWeight: 800, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", opacity: (step === 3 && (!candidato.experiencia || loading)) ? 0.5 : 1, fontFamily: "'Inter', sans-serif" }}>
              {loading ? "Aguarde..." : step === 3 ? "Finalizar Inscrição" : "Próximo"}
            </button>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                ← Voltar etapa anterior
              </button>
            )}
          </div>
        </div>
      </AdaptiveModal>
    </>
  );
}
