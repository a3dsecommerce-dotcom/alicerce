"use client";
import { useState } from "react";
import { ShieldCheck, Loader2, Briefcase, ChevronLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

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
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-16 flex flex-col gap-6 relative">
          
          <div className="flex flex-col items-center text-center mt-4">
            <div className="w-16 h-16 bg-orange-500 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-orange-500/40 mb-6 transform transition-transform hover:rotate-6">
              <Briefcase className="text-white w-8 h-8 drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Trabalhe Conosco</h1>
            <p className="text-slate-500 dark:text-neutral-500 font-bold text-xs uppercase tracking-widest">Venha fazer parte da equipe Alicerce</p>
          </div>

          <div className="bg-slate-50 dark:bg-neutral-900/50 backdrop-blur-xl border border-slate-200 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-sm dark:shadow-none">
            {success ? (
              <div className="text-center py-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="text-green-500 w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-4">Currículo Recebido!</h2>
                <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-8">
                  Agradecemos seu interesse. Seu perfil foi registrado na nossa base de dados e o RH entrará em contato se houver oportunidade.
                </p>
                
                <button 
                  onClick={() => setSuccess(false)}
                  className="w-full py-4 rounded-2xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors mb-4"
                >
                  Enviar outro currículo
                </button>
                
                <Link href="/login" className="flex items-center justify-center gap-2 text-orange-600 font-bold text-sm hover:underline">
                  <ChevronLeft size={16} /> Voltar ao Portal
                </Link>
              </div>
            ) : (
              <form onSubmit={handleCandidatura} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">Nome Completo</label>
                  <input
                    type="text" required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-sm"
                    placeholder="Digite seu nome"
                    value={candNome}
                    onChange={e => setCandNome(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                  <input
                    type="tel" required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-sm"
                    placeholder="(92) 9XXXX-XXXX"
                    value={candTelefone}
                    onChange={e => setCandTelefone(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">Cargo Desejado</label>
                  <input
                    type="text" required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-sm"
                    placeholder="Ex: ASG, Motorista..."
                    value={candVaga}
                    onChange={e => setCandVaga(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">Link do Currículo (PDF/Drive)</label>
                  <input
                    type="url" required
                    className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-sm"
                    placeholder="https://"
                    value={candLink}
                    onChange={e => setCandLink(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="mt-2 w-full py-5 rounded-2xl bg-orange-600 text-white font-black text-sm shadow-lg shadow-orange-600/20 hover:bg-orange-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Enviar Currículo</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <Link href="/login" className="text-slate-400 dark:text-neutral-600 text-[11px] font-bold uppercase tracking-wider hover:text-orange-500 transition-colors">
                    Já é colaborador? Ir para o Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          <div className="text-center mt-auto pb-4">
            <p className="text-[10px] font-black text-slate-300 dark:text-neutral-800 uppercase tracking-[0.2em]">Criptografia Militar</p>
            <p className="text-[8px] text-slate-400 dark:text-neutral-600 mt-1 font-bold">VERSÃO 5.0.2  •  STATUS ONLINE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

