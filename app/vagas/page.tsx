"use client";
import { useState } from "react";
import { ShieldCheck, Loader2, Briefcase, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function VagasPage() {
  const [candNome, setCandNome] = useState("");
  const [candTelefone, setCandTelefone] = useState("");
  const [candVaga, setCandVaga] = useState("");
  const [candLink, setCandLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCandidatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch("/api/candidatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: candNome,
          telefone: candTelefone,
          cargo: candVaga,
          link_curriculo: candLink
        })
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar candidato");
      }
      
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Ocorreu um erro ao enviar seu currículo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "radial-gradient(circle at top right, #1a1a1a, #000)", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      color: "white",
      padding: "2rem 1rem"
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "450px", 
        padding: "2.5rem 2rem",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            background: "var(--brand)", 
            borderRadius: "16px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            margin: "0 auto 1rem",
            boxShadow: "0 0 30px rgba(232, 98, 26, 0.3)"
          }}>
            <Briefcase size={32} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Trabalhe Conosco</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Venha fazer parte da equipe Alicerce
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ width: "60px", height: "60px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <ShieldCheck size={24} color="#10B981" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Currículo Recebido!</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "2rem" }}>
              Agradecemos seu interesse. Seu perfil foi registrado na nossa base de dados e o RH entrará em contato se houver oportunidade.
            </p>
            <button onClick={() => setSuccess(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", padding: "12px", borderRadius: "8px", color: "white", width: "100%", cursor: "pointer" }}>
              Enviar outro currículo
            </button>
            
            <div style={{ marginTop: "1rem" }}>
              <Link href="/login" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--brand)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
                <ChevronLeft size={16} /> Voltar ao Portal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCandidatura} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", animation: "fadeIn 0.5s ease-out" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px", display: "block" }}>NOME COMPLETO</label>
              <input type="text" placeholder="Digite seu nome" value={candNome} onChange={(e) => setCandNome(e.target.value)} required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontSize: "0.9rem", transition: "all 0.2s", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px", display: "block" }}>TELEFONE / WHATSAPP</label>
              <input type="text" placeholder="(92) 9XXXX-XXXX" value={candTelefone} onChange={(e) => setCandTelefone(e.target.value)} required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontSize: "0.9rem", transition: "all 0.2s", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px", display: "block" }}>CARGO DESEJADO</label>
              <input type="text" placeholder="Ex: ASG, Motorista, Administrativo" value={candVaga} onChange={(e) => setCandVaga(e.target.value)} required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontSize: "0.9rem", transition: "all 0.2s", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px", display: "block" }}>LINK DO LINKEDIN OU CURRÍCULO (PDF/DRIVE)</label>
              <input type="url" placeholder="https://" value={candLink} onChange={(e) => setCandLink(e.target.value)} required style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "white", fontSize: "0.9rem", transition: "all 0.2s", outline: "none" }} />
            </div>
            
            <button type="submit" className="btn-brand" style={{ width: "100%", height: "48px", marginTop: "1rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {loading ? <Loader2 className="animate-spin" /> : "Enviar Currículo"}
            </button>
            
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <Link href="/login" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", textDecoration: "none" }}>
                Já é colaborador? Ir para o Login
              </Link>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input:focus {
          border-color: var(--brand) !important;
          background: rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </div>
  );
}
