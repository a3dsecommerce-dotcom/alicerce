"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ShieldCheck, ArrowRight, Loader2, Smartphone, Lock } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "verify" | "restricted">("phone");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simula disparo via n8n
    setTimeout(() => {
      setLoading(false);
      setStep("verify");
    }, 1500);
  };

  const handleFinalize = () => {
    setLoading(true);
    // Simulação de validação de token e geração de JWT mock
    setTimeout(() => {
      // Simular busca de papel a partir do telefone (mock Supabase)
      const isLevelOne = phone.includes("1234"); // Nível 1 – acesso via WhatsApp
      if (isLevelOne) {
        setStep("restricted");
        setLoading(false);
        return;
      }

      // Gerar token mock: "ROLE|timestamp"
      const role = "ADMIN"; // Em produção, buscar papel real no Supabase
      const token = `${role}|${Date.now()}`;
      // Definir cookie (httpOnly não possível no client, mas será lido pelo middleware)
      document.cookie = `auth_token=${token}; path=/; max-age=3600; SameSite=Lax`;
      router.push("/dashboard");
    }, 1000);
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
      padding: "1rem"
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "400px", 
        padding: "2rem",
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
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
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Alicerce CRM</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Acesso Restrito: Administrativo e Gestão
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendLink} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ position: "relative" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "8px", display: "block" }}>
                NÚMERO DE WHATSAPP
              </label>
              <div style={{ position: "relative" }}>
                <Smartphone size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input 
                  type="text" 
                  placeholder="(92) 9XXXX-XXXX" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{ 
                    width: "100%", 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: "12px", 
                    padding: "0.875rem 1rem 0.875rem 2.5rem",
                    color: "white",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--brand)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: "var(--brand)", 
                color: "white", 
                border: "none", 
                borderRadius: "12px", 
                padding: "1rem", 
                fontSize: "0.95rem", 
                fontWeight: 700, 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                gap: "8px",
                transition: "0.2s",
                boxShadow: "0 10px 15px -3px rgba(232, 98, 26, 0.4)"
              }}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <MessageSquare size={18} />
                  Enviar Link de Acesso
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "1rem" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontWeight: 700 }}>Segurança Criptografada</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            </div>
          </form>
        ) : step === "verify" ? (
          <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              background: "rgba(16, 185, 129, 0.1)", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <MessageSquare size={24} color="#10B981" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Link Enviado!</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "2rem" }}>
              Verifique seu WhatsApp. Enviamos um link de acesso único para o número <strong>{phone}</strong>.
            </p>
            
            <div style={{ 
              background: "rgba(255,255,255,0.03)", 
              padding: "1rem", 
              borderRadius: "12px", 
              border: "1px solid rgba(255,255,255,0.05)",
              textAlign: "left",
              marginBottom: "2rem"
            }}>
               <div style={{ fontSize: "0.65rem", color: "#10B981", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                 <Lock size={10} /> MENSAGEM DO BOT ALICERCE
               </div>
               <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.9)", fontStyle: "italic" }}>
                 "Olá! Clique no botão abaixo para acessar o seu Portal Alicerce CRM com segurança..."
               </div>
            </div>

            <button 
              onClick={handleFinalize}
              className="btn-brand"
              style={{ width: "100%", height: "48px" }}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Entrar no Dashboard"}
            </button>
            
            <button 
              onClick={() => setStep("phone")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginTop: "1rem", cursor: "pointer" }}
            >
              Não recebeu? Tentar novamente
            </button>
          </div>
        ) : step === "restricted" ? (
          <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              background: "rgba(239, 68, 68, 0.1)", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}>
              <Smartphone size={24} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Acesso via WhatsApp</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", lineHeight: 1.5, marginBottom: "2rem" }}>
              Olá! Identificamos que você é um <strong>Colaborador Operacional</strong>. 
              <br/><br/>
              Seu acesso é feito exclusivamente pelo WhatsApp da Alicerce. O Portal Web é reservado para cargos administrativos e gerenciais.
            </p>
            
            <button 
              onClick={() => setStep("phone")}
              className="btn-brand"
              style={{ width: "100%", height: "48px", background: "rgba(255,255,255,0.1)", color: "white" }}
            >
              Voltar ao Início
            </button>
          </div>
        ) : null}
      </div>
      
      {/* Trabalhe Conosco Section */}
      {/* Trabalhe Conosco Section */}
      {step === "phone" && (
        <div style={{
          marginTop: "2rem",
          textAlign: "center",
          width: "100%",
          maxWidth: "400px",
          padding: "1.5rem",
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Faça parte da Alicerce!</h3>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "1.25rem", lineHeight: 1.4 }}>
            Estamos sempre em busca de novos talentos. Cadastre seu currículo em nosso banco de dados.
          </p>
          <a 
            href="/vagas"
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              width: "100%",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            Trabalhe Conosco
          </a>
        </div>
      )}

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
      `}</style>
    </div>
  );
}
