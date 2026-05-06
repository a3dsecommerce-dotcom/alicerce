"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, Shield, ShieldCheck, Zap, Network, Database, CheckCircle2, User, MapPin, Briefcase, Ruler, ArrowRight } from "lucide-react";
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
    // Passo 1 - Identificação
    nome: "", data_nascimento: "", sexo: "", estado_civil: "",
    // Passo 2 - Documentos
    cpf: "", rg: "", pis: "", titulo_eleitor: "",
    // Passo 3 - Contato e Endereço
    telefone: "", email: "", cep: "", rua: "", numero: "", bairro: "", cidade: "Manaus", estado: "AM",
    // Passo 4 - Perfil Profissional
    cargo: "ASG", escolaridade: "Ensino Médio Completo", experiencia: false, ultimo_emprego: "", tempo_experiencia: "",
    // Passo 5 - Uniformes e SST
    tamanho_camisa: "M", tamanho_calca: "38", tamanho_calcado: "40", possui_nr: false, declaracao: false,
    curriculo_file: null as File | null,
    curriculo_url: "",
  });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const telLimpo = telefone.replace(/\D/g, "");
    if (telLimpo.length < 10) { setError("Telefone inválido."); setLoading(false); return; }
    
    try {
      const telCom55 = telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
      const telSem55 = telLimpo.startsWith("55") ? telLimpo.slice(2) : telLimpo;
      
      const { data: user, error: userError } = await supabase.from('usuarios').select('*')
        .or(`telefone.eq.${telCom55},telefone.eq.${telSem55},telefone.eq.${telCom55}@s.whatsapp.net,telefone.eq.${telSem55}@s.whatsapp.net`)
        .single();
        
      if (userError || !user) { setError("Usuário não encontrado."); setLoading(false); return; }

      // Validação de Senha (Suporta senha customizada ou legado de 4 dígitos)
      const senhaPadrao = telLimpo.slice(-4);
      const senhaCorreta = user.senha || senhaPadrao;
      
      if (senha !== senhaCorreta) { 
        setError(user.senha ? "Senha incorreta." : "Senha incorreta — use os 4 últimos dígitos."); 
        setLoading(false); 
        return; 
      }
      document.cookie = `auth_token=al_sovereign_${user.id}; path=/; max-age=86400`;
      const dbFuncao = user.cargo;
      const rawFuncao = dbFuncao ? String(dbFuncao).toUpperCase() : null;
      const cargoResolvido = rawFuncao || (user.nivel_acesso >= 4 ? 'ADMIN' : user.nivel_acesso >= 3 ? 'GERENTE' : user.nivel_acesso >= 2 ? 'SUPERVISOR' : 'COLABORADOR');
      localStorage.setItem("crm_user", JSON.stringify({ 
        id: user.id,
        email: user.telefone, 
        role: cargoResolvido, 
        name: user.nome, 
        nivel: user.nivel_acesso || 1,
        unidade_alocacao: user.unidade_alocacao,
        secretaria: user.secretaria,
        funcao: dbFuncao
      }));
      let dest = "/dashboard";
      if (rawFuncao === "COMPRADOR") dest = "/dashboard?module=COMPRAS";
      else if (rawFuncao === "ALMOXARIFADO" || rawFuncao === "ALMOXARIFE") dest = "/dashboard?module=ALMOXARIFADO";
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
      let curriculoUrl = "";
      
      // Upload do Currículo se existir
      if (candidato.curriculo_file) {
        const fileExt = candidato.curriculo_file.name.split('.').pop();
        const fileName = `${candidato.cpf.replace(/\D/g, "")}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('curriculos')
          .upload(filePath, candidato.curriculo_file);

        if (uploadError) throw new Error("Erro ao enviar arquivo: " + uploadError.message);
        
        const { data: { publicUrl } } = supabase.storage
          .from('curriculos')
          .getPublicUrl(filePath);
          
        curriculoUrl = publicUrl;
      }

      const { error } = await supabase.from('candidatos').insert([{
        nome: candidato.nome,
        data_nascimento: candidato.data_nascimento || null,
        cpf: candidato.cpf.replace(/\D/g, ""),
        rg: candidato.rg,
        pis: candidato.pis,
        titulo_eleitor: candidato.titulo_eleitor,
        telefone: candidato.telefone.replace(/\D/g, ""),
        email: candidato.email,
        cargo_pretendido: candidato.cargo,
        escolaridade: candidato.escolaridade,
        cep: candidato.cep.replace(/\D/g, ""),
        rua: candidato.rua,
        numero: candidato.numero,
        bairro: candidato.bairro,
        cidade: candidato.cidade,
        estado: candidato.estado,
        experiencia_previa: candidato.experiencia,
        ultimo_emprego: candidato.ultimo_emprego,
        tamanho_camisa: candidato.tamanho_camisa,
        tamanho_calca: candidato.tamanho_calca,
        tamanho_calcado: parseInt(candidato.tamanho_calcado) || null,
        curriculo_url: curriculoUrl
      }]);
      if (error) throw error;
      alert("✅ Inscrição realizada com sucesso! Entraremos em contato pelo WhatsApp.");
      setModalTrabalhe(false); setStep(1);
    } catch (err: any) {
      alert("Erro ao cadastrar: " + (err.message || "Erro desconhecido."));
    } finally { setLoading(false); }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)] transition-colors duration-500 font-sans selection:bg-orange-500/30 overflow-hidden">
      
      {/* Background Decorativo — Aura Alicerce */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <style>{`
        .login-card {
          width: min(480px, 95vw);
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 2.5rem;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.4);
          position: relative;
          z-index: 10;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 60px 45px 45px;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .login-card::-webkit-scrollbar { width: 0; }

        .input-group {
          margin-bottom: 20px;
        }
        .input-label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          display: block;
          padding-left: 4px;
        }
        .modern-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 16px 20px;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          outline: none;
        }
        .modern-input:focus {
          border-color: #ea580c;
          background: rgba(234, 88, 12, 0.05);
          box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1);
        }
        .btn-primary {
          width: 100%;
          padding: 18px;
          border-radius: 20px;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          color: white;
          font-weight: 800;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(234, 88, 12, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(234, 88, 12, 0.4);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-secondary {
          width: 100%;
          padding: 16px;
          border-radius: 18px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 24px;
        }
        .btn-secondary:hover {
          background: var(--border);
          color: var(--text-primary);
        }
      `}</style>

      <div className="login-card animate-fade-in">
        <div className="flex flex-col items-center text-center mb-12">
            <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-600/30 mb-6">
              <ShieldCheck size={32} color="white" />
            </div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-2">Alicerce</h1>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em]">Portal Corporativo</p>
          </div>

          <form onSubmit={handleLogin} className="flex-1">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Identificação</label>
              <input
                type="tel"
                className="modern-input"
                placeholder="WhatsApp / Login"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Chave de Acesso</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="modern-input pr-14"
                  placeholder="••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-orange-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-10 px-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--border)] accent-orange-600" />
                <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Manter conectado</span>
              </label>
              <a href="#" className="text-[11px] font-bold text-orange-600 hover:underline">Esqueci a senha</a>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button type="button" className="btn-secondary" onClick={() => setModalTrabalhe(true)}>
              Trabalhe Conosco
            </button>
          </form>

          <div className="mt-auto pt-8 pb-4 text-center">
            <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] opacity-40">Segurança de Nível Militar</p>
            <p className="text-[8px] text-[var(--text-secondary)] mt-1 font-bold opacity-20 uppercase tracking-widest">Alicerce ERP • v1.0.0</p>
          </div>
      </div>

      {/* Modal Trabalhe Conosco com Tema Smartphone */}
      <AdaptiveModal title="" isOpen={modalTrabalhe} onClose={() => { setModalTrabalhe(false); setStep(1); }} width="440px" fullHeight>
        <div className="h-full bg-[var(--bg-base)] flex flex-col p-8 pt-12 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-14 h-14 bg-orange-600/10 rounded-2xl flex items-center justify-center mb-6 border border-orange-600/20">
              <Zap size={24} className="text-orange-600" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Recrutamento</h2>
            <p className="text-xs font-bold text-[var(--text-secondary)] mt-2 max-w-[280px]">Faça parte da inteligência operacional da Alicerce.</p>
          </div>

          <div className="flex gap-2 mb-8">
            {[1,2,3,4,5].map(i => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.4)]' : 'bg-[var(--border)]'}`} />
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="input-group">
                  <label className="input-label">Nome Completo</label>
                  <input type="text" className="modern-input" placeholder="Seu nome completo" value={candidato.nome} onChange={e => setCandidato({...candidato, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Nascimento</label>
                    <input type="date" className="modern-input" value={candidato.data_nascimento} onChange={e => setCandidato({...candidato, data_nascimento: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Estado Civil</label>
                    <select className="modern-input" value={candidato.estado_civil} onChange={e => setCandidato({...candidato, estado_civil: e.target.value})}>
                      <option value="">Selecione</option>
                      <option value="SOLTEIRO">Solteiro(a)</option>
                      <option value="CASADO">Casado(a)</option>
                      <option value="DIVORCIADO">Divorciado(a)</option>
                      <option value="VIUVO">Viúvo(a)</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Sexo</label>
                  <div className="flex gap-4">
                    {["M", "F"].map(s => (
                      <button 
                        key={s}
                        onClick={() => setCandidato({...candidato, sexo: s})}
                        className={`flex-1 p-4 rounded-2xl border-2 transition-all font-bold text-xs ${candidato.sexo === s ? 'border-orange-600 bg-orange-600/10 text-orange-600' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
                      >
                        {s === "M" ? "Masculino" : "Feminino"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="input-group">
                  <label className="input-label">CPF</label>
                  <input type="text" className="modern-input" placeholder="000.000.000-00" value={candidato.cpf} onChange={e => setCandidato({...candidato, cpf: e.target.value})} />
                </div>
                <div className="input-group">
                  <label className="input-label">RG</label>
                  <input type="text" className="modern-input" placeholder="Número do RG" value={candidato.rg} onChange={e => setCandidato({...candidato, rg: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">PIS</label>
                    <input type="text" className="modern-input" placeholder="PIS" value={candidato.pis} onChange={e => setCandidato({...candidato, pis: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Título Eleitor</label>
                    <input type="text" className="modern-input" placeholder="Título" value={candidato.titulo_eleitor} onChange={e => setCandidato({...candidato, titulo_eleitor: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-500 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Telefone (WhatsApp)</label>
                    <input type="tel" className="modern-input" placeholder="(00) 00000-0000" value={candidato.telefone} onChange={e => setCandidato({...candidato, telefone: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">E-mail</label>
                    <input type="email" className="modern-input" placeholder="seu@email.com" value={candidato.email} onChange={e => setCandidato({...candidato, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 input-group">
                    <label className="input-label">CEP</label>
                    <input type="text" className="modern-input" placeholder="00000-000" value={candidato.cep} onChange={e => setCandidato({...candidato, cep: e.target.value})} />
                  </div>
                  <div className="col-span-2 input-group">
                    <label className="input-label">Rua</label>
                    <input type="text" className="modern-input" placeholder="Nome da rua" value={candidato.rua} onChange={e => setCandidato({...candidato, rua: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <div className="input-group">
                    <label className="input-label">Nº</label>
                    <input type="text" className="modern-input" placeholder="00" value={candidato.numero} onChange={e => setCandidato({...candidato, numero: e.target.value})} />
                  </div>
                  <div className="col-span-2 input-group">
                    <label className="input-label">Bairro</label>
                    <input type="text" className="modern-input" placeholder="Bairro" value={candidato.bairro} onChange={e => setCandidato({...candidato, bairro: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-500">
                <div className="input-group">
                  <label className="input-label">Cargo Pretendido</label>
                  <select className="modern-input" value={candidato.cargo} onChange={e => setCandidato({...candidato, cargo: e.target.value})}>
                    <option value="ASG">Auxiliar de Serviços Gerais (ASG)</option>
                    <option value="ALMOXARIFE">Almoxarife</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="COORDENADOR">Coordenador de Área</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Escolaridade</label>
                  <select className="modern-input" value={candidato.escolaridade} onChange={e => setCandidato({...candidato, escolaridade: e.target.value})}>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                    <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                    <option value="Ensino Superior">Ensino Superior</option>
                  </select>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-[var(--border)]">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[11px] font-black uppercase text-[var(--text-secondary)]">Possui Experiência Prévia?</span>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded accent-orange-600" 
                      checked={candidato.experiencia} 
                      onChange={() => setCandidato({...candidato, experiencia: !candidato.experiencia})} 
                    />
                  </label>
                  {candidato.experiencia && (
                    <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                      <input type="text" className="modern-input" placeholder="Última Empresa" value={candidato.ultimo_emprego} onChange={e => setCandidato({...candidato, ultimo_emprego: e.target.value})} />
                      <input type="text" className="modern-input" placeholder="Tempo (ex: 2 anos)" value={candidato.tempo_experiencia} onChange={e => setCandidato({...candidato, tempo_experiencia: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="input-group">
                      <label className="input-label">Camisa</label>
                      <select className="modern-input" value={candidato.tamanho_camisa} onChange={e => setCandidato({...candidato, tamanho_camisa: e.target.value})}>
                        {['PP','P','M','G','GG','XG'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Calça</label>
                      <input type="number" className="modern-input text-center" value={candidato.tamanho_calca} onChange={e => setCandidato({...candidato, tamanho_calca: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Calçado</label>
                      <input type="number" className="modern-input text-center" value={candidato.tamanho_calcado} onChange={e => setCandidato({...candidato, tamanho_calcado: e.target.value})} />
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Currículo (PDF)</label>
                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${candidato.curriculo_file ? 'border-green-500 bg-green-500/5' : 'border-[var(--border)] hover:border-orange-500 bg-white/5'}`}>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === 'application/pdf') {
                            setCandidato({...candidato, curriculo_file: file});
                          } else {
                            alert("Por favor, selecione um arquivo PDF.");
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${candidato.curriculo_file ? 'bg-green-500 text-white' : 'bg-orange-600/10 text-orange-600'}`}>
                          {candidato.curriculo_file ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                        </div>
                        <span className="text-xs font-black uppercase text-[var(--text-primary)]">
                          {candidato.curriculo_file ? candidato.curriculo_file.name : "Clique ou arraste seu PDF"}
                        </span>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Tamanho máx: 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-orange-600/5 border border-orange-600/10">
                    <p className="text-[11px] font-bold text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Shield size={14} /> Declaração e Termos
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed font-medium">
                      Declaro que todas as informações acima são verdadeiras. Estou ciente de que meu cadastro passará por análise da equipe de RH e poderei ser convocado via WhatsApp para entrevista presencial.
                    </p>
                    <label className="flex items-center gap-3 mt-6 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${candidato.declaracao ? 'bg-orange-600 border-orange-600 shadow-lg shadow-orange-600/30' : 'border-[var(--border)] group-hover:border-orange-500'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={candidato.declaracao} 
                          onChange={() => setCandidato({...candidato, declaracao: !candidato.declaracao})} 
                        />
                        {candidato.declaracao && <CheckCircle2 size={16} className="text-white" />}
                      </div>
                      <span className="text-xs font-black text-[var(--text-primary)]">Aceito os Termos e Condições</span>
                    </label>
                  </div>
               </div>
            )}
          </div>

          <div className="mt-auto pt-10 flex flex-col gap-4">
            <button
              onClick={step < 5 ? () => setStep(step + 1) : handleCadastroCandidato}
              disabled={step === 5 && (!candidato.declaracao || loading)}
              className="btn-primary"
            >
              {loading ? "Enviando..." : step === 5 ? "Enviar Proposta" : `Próximo Passo (${step}/5)`}
            </button>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest hover:text-orange-600 transition-colors">
                Voltar
              </button>
            )}
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
