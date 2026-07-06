"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  Home, MessageSquare, Bot, Bell, User, Send, ChevronLeft,
  Package, AlertTriangle, ShieldAlert, Megaphone, HelpCircle,
  LogOut, Check, CheckCheck, Loader2, Sparkles, Phone, ShieldCheck, Info, FileText, Calendar, Upload, X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface MobileAppShellProps {
  user: any;
  onLogout?: () => void;
}

export function MobileAppShell({ user, onLogout }: MobileAppShellProps) {
  const [activeTab, setActiveTab] = useState<"home" | "chat" | "clara" | "notifs" | "profile">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  
  // Real-time peer-to-peer chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Clara Chat state
  const [claraMessages, setClaraMessages] = useState<any[]>([
    { id: "1", sender: "clara", text: `Olá! Eu sou a Clara, assistente virtual da Alicerce. Posso tirar suas dúvidas sobre escalas, férias e regulamentos internos!` }
  ]);
  const [claraInput, setClaraInput] = useState("");
  const [claraLoading, setClaraLoading] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState<any[]>([]);
  
  // Modals state for Independent Forms
  const [epiModal, setEpiModal] = useState(false);
  const [faltaModal, setFaltaModal] = useState(false);
  const [ocorrenciaModal, setOcorrenciaModal] = useState(false);
  const [denunciaModal, setDenunciaModal] = useState(false);

  // EPI Form State
  const [epiCamisa, setEpiCamisa] = useState(user.tamanho_camisa || "M");
  const [epiCalca, setEpiCalca] = useState(user.tamanho_calca || "38");
  const [epiSapato, setEpiSapato] = useState(user.tamanho_sapato || "40");
  const [epiObs, setEpiObs] = useState("");
  const [enviandoEpi, setEnviandoEpi] = useState(false);

  // Falta/Atestado Form State
  const [faltaData, setFaltaData] = useState("");
  const [faltaTipo, setFaltaTipo] = useState("Falta Justificada (com Atestado)");
  const [faltaMotivo, setFaltaMotivo] = useState("");
  const [faltaFile, setFaltaFile] = useState<File | null>(null);
  const [enviandoFalta, setEnviandoFalta] = useState(false);

  // Ocorrência Form State
  const [ocPosto, setOcPosto] = useState(user.unidade_alocacao || "");
  const [ocCategoria, setOcCategoria] = useState("Incidente");
  const [ocGravidade, setOcGravidade] = useState("Média");
  const [ocDesc, setOcDesc] = useState("");
  const [enviandoOc, setEnviandoOc] = useState(false);

  // Denúncia State
  const [denunciaNatureza, setDenunciaNatureza] = useState("Conduta Ética / Assédio");
  const [denunciaDetalhe, setDenunciaDetalhe] = useState("");
  const [enviandoDenuncia, setEnviandoDenuncia] = useState(false);

  // Agendamento Form State
  const [agendamentoModal, setAgendamentoModal] = useState(false);
  const [agendaData, setAgendaData] = useState("");
  const [agendaHora, setAgendaHora] = useState("");
  const [agendaMotivo, setAgendaMotivo] = useState("");
  const [enviandoAgenda, setEnviandoAgenda] = useState(false);

  // Clube de Serviços States
  const [servicosModal, setServicosModal] = useState(false);
  const [novoServicoModal, setNovoServicoModal] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
  const [servicoTitulo, setServicoTitulo] = useState("");
  const [servicoCategoria, setServicoCategoria] = useState("Construção & Reformas");
  const [servicoDesc, setServicoDesc] = useState("");
  const [enviandoServico, setEnviandoServico] = useState(false);
  const [loadingServicos, setLoadingServicos] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const claraEndRef = useRef<HTMLDivElement>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // play sound chime synthesized via Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (err) {}
  };

  // Scroll to bottom helper
  useEffect(() => {
    if (activeTab === "chat" && selectedContact) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, selectedContact, activeTab]);

  useEffect(() => {
    if (activeTab === "clara") {
      claraEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [claraMessages, activeTab]);

  // Fetch contacts for chat
  useEffect(() => {
    async function loadContacts() {
      setLoadingContacts(true);
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, nome, cargo, telefone, unidade_alocacao")
          .eq("status", "ATIVO")
          .order("nome");
        
        if (!error && data) {
          setContacts(data.filter((c: any) => c.id !== user.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    }
    
    if (user?.id) {
      loadContacts();
    }
  }, [user?.id]);

  // Load chat messages when contact is selected
  useEffect(() => {
    if (!selectedContact || !user?.id) return;
    
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("chat_mensagens")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: true });
        
        if (!error && data) {
          setChatMessages(data);
          
          const unreadIds = data
            .filter((m: any) => m.receiver_id === user.id && !m.lida)
            .map((m: any) => m.id);
          
          if (unreadIds.length > 0) {
            await supabase
              .from("chat_mensagens")
              .update({ lida: true })
              .in("id", unreadIds);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    }
    
    loadMessages();
  }, [selectedContact, user?.id]);

  // Realtime messages subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_mensagens" },
        (payload) => {
          const newMsg = payload.new as any;
          
          if (selectedContact && (
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === user.id) ||
            (newMsg.sender_id === user.id && newMsg.receiver_id === selectedContact.id)
          )) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.receiver_id === user.id) {
              supabase.from("chat_mensagens").update({ lida: true }).eq("id", newMsg.id).then();
              playChime();
            }
          } else if (newMsg.receiver_id === user.id) {
            playChime();
            toast.info(`Nova mensagem de outro colaborador no Chat!`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_mensagens" },
        (payload) => {
          const updatedMsg = payload.new as any;
          setChatMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedContact, user?.id]);

  // Load system notifications
  useEffect(() => {
    async function loadNotifications() {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("notificacoes")
          .select("*")
          .or(`user_id.eq.${user.id}${user.secretaria ? `,setor_destino.eq.${user.secretaria}` : ""}`)
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (!error && data) {
          setNotifs(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    if (activeTab === "notifs") {
      loadNotifications();
    }
  }, [activeTab, user?.id, user?.secretaria]);

  // Submit EPI Request Form
  const handleSubmitEpi = async () => {
    if (!user?.id) return;
    setEnviandoEpi(true);
    try {
      const demandDescription = `Solicitação de Uniforme/EPI: Camisa ${epiCamisa}, Calça ${epiCalca}, Calçado ${epiSapato}. Obs: ${epiObs || "Sem observações"}`;
      
      const { error } = await supabase
        .from("chamados_interacoes")
        .insert([{
          colaborador_id: user.id,
          categoria: "Uniforme/EPI",
          descricao_demanda: demandDescription,
          status: "Pendente"
        }]);

      if (!error) {
        toast.success("Solicitação de EPI enviada com sucesso para a plataforma!");
        setEpiModal(false);
        setEpiObs("");
      } else {
        toast.error("Erro ao enviar solicitação: " + error.message);
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro ao processar a solicitação.");
    } finally {
      setEnviandoEpi(false);
    }
  };

  // Submit Falta/Atestado Form
  const handleSubmitFalta = async () => {
    if (!user?.id || !faltaData) {
      toast.error("Selecione a data da ausência.");
      return;
    }
    setEnviandoFalta(true);
    try {
      let fileUrl = "";
      if (faltaFile) {
        const fileExt = faltaFile.name.split('.').pop();
        const filePath = `atestados/${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("curriculos") // Utilizing the default open public bucket for simple storage
          .upload(filePath, faltaFile);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("curriculos")
            .getPublicUrl(filePath);
          fileUrl = publicUrl;
        }
      }

      const demandDescription = `Falta informada (${faltaTipo}) em ${faltaData}. Motivo: ${faltaMotivo || "Não informado"}. Anexo: ${fileUrl || "Nenhum arquivo anexado"}`;
      
      const { error } = await supabase
        .from("chamados_interacoes")
        .insert([{
          colaborador_id: user.id,
          categoria: "Atestado",
          descricao_demanda: demandDescription,
          status: "Pendente"
        }]);

      if (!error) {
        toast.success("Aviso de falta/atestado registrado com sucesso!");
        setFaltaModal(false);
        setFaltaData("");
        setFaltaMotivo("");
        setFaltaFile(null);
      } else {
        toast.error("Erro ao enviar: " + error.message);
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro ao processar.");
    } finally {
      setEnviandoFalta(false);
    }
  };

  // Submit Ocorrência Form
  const handleSubmitOcorrencia = async () => {
    if (!ocDesc.trim()) {
      toast.error("Descreva o fato da ocorrência.");
      return;
    }
    setEnviandoOc(true);
    try {
      const { error } = await supabase
        .from("ocorrencias_campo")
        .insert([{
          posto_afetado: ocPosto || "Não especificado",
          categoria: ocCategoria,
          gravidade: ocGravidade,
          descricao_fato: ocDesc,
          trecho_original: `Registrado diretamente via App Mobile por ${user.nome} (${user.telefone})`,
          resolvido: false
        }]);

      if (!error) {
        toast.success("Ocorrência operacional registrada com sucesso na plataforma!");
        setOcorrenciaModal(false);
        setOcDesc("");
      } else {
        toast.error("Erro ao registrar ocorrência: " + error.message);
      }
    } catch (err: any) {
      toast.error("Erro de conexão com o banco de dados.");
    } finally {
      setEnviandoOc(false);
    }
  };

  // Handle direct message sending
  const handleSendDirectMessage = async () => {
    if (!inputText.trim() || !selectedContact || !user?.id) return;
    
    setSendingMessage(true);
    const textToSend = inputText.trim();
    setInputText("");
    
    try {
      const { data, error } = await supabase
        .from("chat_mensagens")
        .insert([{
          sender_id: user.id,
          receiver_id: selectedContact.id,
          conteudo: textToSend
        }])
        .select()
        .single();
      
      if (!error && data) {
        setChatMessages(prev => [...prev, data]);
      }
    } catch (err) {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Clara AI message sending
  const handleSendClaraMessage = async () => {
    const textToSend = claraInput.trim();
    if (!textToSend) return;
    
    setClaraInput("");
    const userMsg = { id: Date.now().toString(), sender: "user", text: textToSend };
    setClaraMessages(prev => [...prev, userMsg]);
    setClaraLoading(true);
    
    try {
      const history = claraMessages.map(m => ({ sender: m.sender, text: m.text }));
      
      const res = await fetch("/api/clara/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          userVariables: {
            nome: user.nome,
            cargo: user.cargo,
            unidade: user.unidade_alocacao,
            supervisor: user.encarregado_rota || "Não informado",
            escala: user.carga_horaria || "Não informada",
            uniforme_camisa: user.tamanho_camisa || "Não informado",
            uniforme_calca: user.tamanho_calca || "Não informado",
            uniforme_calcado: user.tamanho_sapato || "Não informado"
          }
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setClaraMessages(prev => [...prev, { id: Date.now().toString(), sender: "clara", text: data.response }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      setClaraMessages(prev => [...prev, { id: Date.now().toString(), sender: "clara", text: "Desculpe, tive uma oscilação na minha conexão. Pode repetir, por favor?" }]);
    } finally {
      setClaraLoading(false);
    }
  };

  // Handle Anonymous Denúncia registration
  const handleRegisterDenuncia = async () => {
    if (!denunciaDetalhe.trim()) return;
    setEnviandoDenuncia(true);
    const protocol = `ETI-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    try {
      const { error } = await supabase
        .from("denuncias_anonimas")
        .insert([{
          natureza: denunciaNatureza,
          detalhamento: denunciaDetalhe,
          protocolo: protocol
        }]);

      if (!error) {
        toast.success(`Denúncia registrada com sucesso! Guarde seu protocolo: ${protocol}`);
        setDenunciaModal(false);
        setDenunciaDetalhe("");
      } else {
        toast.error("Falha ao registrar relato.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviandoDenuncia(false);
    }
  };

  // Submit Agendamento (Google Calendar & Supabase)
  const handleRegisterAgendamento = async () => {
    if (!agendaData || !agendaHora) {
      toast.error("Informe a data e o horário desejado.");
      return;
    }
    setEnviandoAgenda(true);
    try {
      const res = await fetch("/api/agendamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: user.id,
          colaboradorNome: user.nome,
          dataAgendamento: agendaData,
          horario: agendaHora,
          motivo: agendaMotivo
        })
      });

      if (res.ok) {
        toast.success("Atendimento agendado! Verifique a confirmação no painel.");
        setAgendamentoModal(false);
        setAgendaData("");
        setAgendaHora("");
        setAgendaMotivo("");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Erro ao solicitar agendamento.");
      }
    } catch (err) {
      toast.error("Erro de conexão ao salvar agendamento.");
    } finally {
      setEnviandoAgenda(false);
    }
  };

  // Load active services
  const loadServicos = async () => {
    try {
      setLoadingServicos(true);
      const { data, error } = await supabase
        .from("servicos_colaboradores")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setServicos(data);
      }
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoadingServicos(false);
    }
  };

  // Submit new service
  const handleSubmitServico = async () => {
    if (!servicoTitulo.trim() || !servicoDesc.trim()) {
      toast.error("Preencha o título e a descrição do serviço.");
      return;
    }
    setEnviandoServico(true);
    try {
      const { error } = await supabase
        .from("servicos_colaboradores")
        .insert([{
          colaborador_id: user.id,
          colaborador_nome: user.nome,
          colaborador_telefone: user.telefone,
          titulo: servicoTitulo,
          categoria: servicoCategoria,
          descricao: servicoDesc,
          ativo: true
        }]);

      if (!error) {
        toast.success("Serviço cadastrado com sucesso!");
        setNovoServicoModal(false);
        setServicoTitulo("");
        setServicoDesc("");
        loadServicos();
      } else {
        toast.error("Erro ao cadastrar serviço: " + error.message);
      }
    } catch (err) {
      toast.error("Erro de conexão ao salvar.");
    } finally {
      setEnviandoServico(false);
    }
  };

  // Trigger loading when modal opens
  useEffect(() => {
    if (servicosModal) {
      loadServicos();
    }
  }, [servicosModal]);

  const filteredContacts = contacts.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.cargo && c.cargo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="mobile-app-shell">
      {/* Dynamic CSS Styling */}
      <style>{`
        .mobile-app-shell {
          position: fixed;
          inset: 0;
          background: #09090b;
          color: #f4f4f5;
          font-family: var(--font-inter), -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          z-index: 9999;
          overflow: hidden;
        }

        .glow-text {
          text-shadow: 0 0 10px rgba(234, 88, 12, 0.4);
        }

        .glow-card {
          background: rgba(24, 24, 27, 0.75);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px 85px;
          display: flex;
          flex-direction: column;
        }

        .bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(18, 18, 18, 0.85);
          backdrop-filter: blur(25px);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #71717a;
          font-size: 10px;
          font-weight: 600;
          gap: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-btn.active {
          color: #ea580c;
          transform: translateY(-2px);
          text-shadow: 0 0 8px rgba(234, 88, 12, 0.3);
        }

        .action-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 18px 16px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .action-button:active {
          transform: scale(0.95);
          background: rgba(234, 88, 12, 0.1) !important;
          border-color: rgba(234, 88, 12, 0.3);
        }

        .chat-bubble {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 20px;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 8px;
          word-break: break-word;
        }

        .chat-bubble.sent {
          background: linear-gradient(135deg, #ea580c, #f97316);
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 15px rgba(234, 88, 12, 0.25);
        }

        .chat-bubble.received {
          background: rgba(39, 39, 42, 0.85);
          color: #f4f4f5;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px 16px;
          color: white;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #ea580c;
          background: rgba(234, 88, 12, 0.05);
        }
      `}</style>

      {/* TOP HEADER */}
      <header className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 p-0.5 shadow-lg shadow-orange-600/10">
            <div className="w-full h-full rounded-2xl bg-zinc-900 flex items-center justify-center font-bold text-orange-500 text-sm uppercase">
              {user.nome.slice(0, 2)}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
              Olá, {user.nome.split(" ")[0]}
            </h2>
            <p className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">
              {user.cargo || "COLABORADOR"} • {user.unidade_alocacao || "NÃO ALOCADO"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onLogout && (
            <button onClick={onLogout} className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* TAB CONTENT HOUSING */}
      <div className="tab-content hide-scrollbar">
        {/* ==================== TAB: HOME ==================== */}
        {activeTab === "home" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* User credentials summary */}
            <div className="glow-card p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
              <div>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                  Posto de Trabalho
                </span>
                <span className="text-lg font-black text-white leading-snug">
                  {user.unidade_alocacao || "Aguardando Alocação"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest block mb-0.5">
                    Escala
                  </span>
                  <span className="text-xs font-bold text-white">
                    {user.carga_horaria || "Administrativo"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-zinc-400 uppercase tracking-widest block mb-0.5">
                    Supervisor
                  </span>
                  <span className="text-xs font-bold text-white">
                    {user.encarregado_rota || "Diretoria"}
                  </span>
                </div>
              </div>
            </div>

            {/* PWA Install Banner */}
            {showInstallBanner && (
              <div className="p-4 rounded-3xl bg-orange-600/10 border border-orange-500/20 flex flex-col gap-3 relative overflow-hidden">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-white leading-tight">Instalar Aplicativo Alicerce</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Adicione o portal à tela inicial do celular como um aplicativo.</p>
                  </div>
                  <button 
                    onClick={() => setShowInstallBanner(false)}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {deferredPrompt ? (
                  <button 
                    onClick={handleInstallApp}
                    className="w-full py-2.5 rounded-2xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    Instalar Agora
                  </button>
                ) : (
                  <div className="text-[10px] text-zinc-400 bg-zinc-950/50 p-3 rounded-2xl leading-relaxed">
                    💡 **No iPhone (iOS)**: clique no botão de **Compartilhar** do navegador e escolha **"Adicionar à Tela de Início"**.
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Serviços Operacionais
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => setEpiModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-3">
                    <Package size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Pedir Uniforme/EPI</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Calça, sapato, camisa</span>
                </div>

                <div 
                  onClick={() => setFaltaModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Falta e Atestado</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Justificar ausência</span>
                </div>

                <div 
                  onClick={() => setOcorrenciaModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-3">
                    <ShieldAlert size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Nova Ocorrência</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Reportar incidente</span>
                </div>

                <div 
                  onClick={() => setDenunciaModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
                    <Megaphone size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Canal de Ética</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Anonimato total</span>
                </div>

                <div 
                  onClick={() => setAgendamentoModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3">
                    <Calendar size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Agendar Escritório</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Atendimento presencial</span>
                </div>

                <div 
                  onClick={() => setServicosModal(true)}
                  className="action-button bg-zinc-900/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-3">
                    <Sparkles size={20} />
                  </div>
                  <span className="text-xs font-bold text-center">Clube de Serviços</span>
                  <span className="text-[9px] text-zinc-500 text-center mt-1">Divulgar e contratar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CHAT ==================== */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col gap-4 animate-fade-in overflow-hidden h-full">
            {!selectedContact ? (
              // CONTACT LIST VIEW
              <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                <input 
                  type="text" 
                  placeholder="Pesquisar colega..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-semibold"
                />

                {loadingContacts ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-500" size={28} />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 hide-scrollbar">
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <div 
                          key={contact.id}
                          onClick={() => setSelectedContact(contact)}
                          className="w-full p-4 rounded-2xl bg-zinc-900/30 border border-white/5 flex items-center justify-between active:bg-zinc-900/75 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center font-bold text-orange-500 text-sm">
                              {contact.nome.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white leading-snug">{contact.nome}</h4>
                              <p className="text-[10px] text-zinc-500 font-semibold">{contact.cargo || "Operacional"}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-10 font-bold">Nenhum colega encontrado.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // DIRECT MESSAGE BOX VIEW
              <div className="fixed inset-0 z-50 bg-[#09090b] flex flex-col overflow-hidden">
                <header className="px-5 py-4 border-b border-white/5 flex items-center gap-3 bg-zinc-950">
                  <button onClick={() => setSelectedContact(null)} className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center font-bold text-orange-500 text-sm">
                    {selectedContact.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{selectedContact.nome}</h3>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{selectedContact.cargo || "OPERACIONAL"}</p>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 hide-scrollbar">
                  {loadingMessages ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="animate-spin text-orange-500" size={28} />
                    </div>
                  ) : chatMessages.length > 0 ? (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div 
                          key={msg.id}
                          className={`chat-bubble ${isMe ? 'sent' : 'received'}`}
                        >
                          <p>{msg.conteudo}</p>
                          <div className="flex justify-end items-center gap-1 mt-1 text-[8px] opacity-70">
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              msg.lida ? <CheckCheck size={10} className="text-blue-200" /> : <Check size={10} />
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 py-10">
                      <MessageSquare size={36} className="opacity-20 mb-3" />
                      <p className="text-xs font-bold">Sem histórico de mensagens.</p>
                      <p className="text-[10px] opacity-70 mt-1">Envie uma mensagem para iniciar o chat!</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/5 bg-zinc-950 flex gap-2 items-center">
                  <input 
                    type="text" 
                    placeholder="Digite sua mensagem..." 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendDirectMessage()}
                    className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500 font-semibold"
                  />
                  <button 
                    onClick={handleSendDirectMessage}
                    disabled={sendingMessage || !inputText.trim()}
                    className="p-3.5 rounded-2xl bg-orange-600 text-white disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: CLARA ==================== */}
        {activeTab === "clara" && (
          <div className="flex-1 flex flex-col animate-fade-in overflow-hidden h-full relative">
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 hide-scrollbar pb-4">
              {claraMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`chat-bubble ${msg.sender === "user" ? "sent" : "received"}`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
              {claraLoading && (
                <div className="chat-bubble received flex items-center gap-2">
                  <Loader2 className="animate-spin text-orange-500" size={14} />
                  <span className="text-xs font-bold text-zinc-400">Clara está digitando...</span>
                </div>
              )}
              <div ref={claraEndRef} />
            </div>

            <div className="mt-auto flex gap-2 items-center pt-3 border-t border-white/5">
              <input 
                type="text" 
                placeholder="Pergunte à Clara..." 
                value={claraInput}
                onChange={(e) => setClaraInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendClaraMessage()}
                className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-orange-500 font-semibold"
              />
              <button 
                onClick={() => handleSendClaraMessage()}
                disabled={claraLoading || !claraInput.trim()}
                className="p-3.5 rounded-2xl bg-orange-600 text-white disabled:opacity-50 active:scale-95 transition-all"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB: NOTIFS ==================== */}
        {activeTab === "notifs" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
              Informativos e Avisos
            </h3>
            <div className="flex flex-col gap-2">
              {notifs.length > 0 ? (
                notifs.map((n) => (
                  <div 
                    key={n.id}
                    className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 flex gap-3 items-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 mt-0.5">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{n.titulo || "Informativo"}</h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{n.mensagem}</p>
                      <span className="text-[8px] text-zinc-600 font-semibold block mt-2">
                        {new Date(n.created_at).toLocaleDateString("pt-BR")} às {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-zinc-500">
                  <Bell size={36} className="opacity-20 mx-auto mb-3" />
                  <p className="text-xs font-bold">Sem avisos no momento.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: PROFILE ==================== */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div className="glow-card p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center font-bold text-orange-500 text-lg">
                  {user.nome.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{user.nome}</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold">{user.cargo || "Colaborador"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/5 pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Contato</span>
                  <span className="font-semibold">{user.telefone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Unidade Alocada</span>
                  <span className="font-semibold">{user.unidade_alocacao || "Não alocado"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Turno de Trabalho</span>
                  <span className="font-semibold">{user.turno || "Manhã"}</span>
                </div>
              </div>
            </div>

            {/* Uniform Size Info */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
                Medidas Cadastradas
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Camisa</span>
                  <span className="text-sm font-black text-white mt-1">{user.tamanho_camisa || "M"}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Calça</span>
                  <span className="text-sm font-black text-white mt-1">{user.tamanho_calca || "38"}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 border border-white/5 rounded-2xl flex flex-col items-center">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">Calçado</span>
                  <span className="text-sm font-black text-white mt-1">{user.tamanho_sapato || "40"}</span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button 
                onClick={onLogout}
                className="w-full py-4 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 font-bold text-xs hover:bg-red-600 hover:text-white transition-all mt-4 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Sair da Conta
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: FORM SOLICITAR EPI/UNIFORME */}
      {epiModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-orange-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                <Package size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Solicitar Fardamento/EPI</h3>
                <p className="text-[9px] text-zinc-400">Os dados serão enviados à central de suprimentos.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Tamanho Camisa</label>
                  <select 
                    className="form-input"
                    value={epiCamisa}
                    onChange={e => setEpiCamisa(e.target.value)}
                  >
                    <option>PP</option><option>P</option><option>M</option><option>G</option><option>GG</option><option>EG</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Tamanho Calça</label>
                  <select 
                    className="form-input"
                    value={epiCalca}
                    onChange={e => setEpiCalca(e.target.value)}
                  >
                    {Array.from({ length: 18 }, (_, i) => 34 + i).map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Tamanho Calçado</label>
                  <select 
                    className="form-input"
                    value={epiSapato}
                    onChange={e => setEpiSapato(e.target.value)}
                  >
                    {Array.from({ length: 13 }, (_, i) => 34 + i).map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Observações ou Itens Extras</label>
                <textarea 
                  className="form-input resize-none min-h-[90px]"
                  placeholder="Ex: Preciso também de luvas de raspa ou protetor auricular..."
                  value={epiObs}
                  onChange={e => setEpiObs(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400" onClick={() => setEpiModal(false)}>Voltar</button>
              <button 
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoEpi}
                onClick={handleSubmitEpi}
              >
                {enviandoEpi ? "Enviando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FORM FALTA OU ATESTADO */}
      {faltaModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-amber-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Informar Falta / Atestado</h3>
                <p className="text-[9px] text-zinc-400">Aviso imediato para gestão de escalas da equipe.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Tipo de Ausência</label>
                <select 
                  className="form-input"
                  value={faltaTipo}
                  onChange={e => setFaltaTipo(e.target.value)}
                >
                  <option>Falta Justificada (com Atestado)</option>
                  <option>Falta sem Justificativa / Atraso</option>
                  <option>Ausência Planejada (Licença/Folga)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Data da Falta</label>
                  <input 
                    type="date"
                    className="form-input"
                    value={faltaData}
                    onChange={e => setFaltaData(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Foto do Atestado (Opcional)</label>
                  <label className="form-input flex items-center justify-center gap-2 cursor-pointer text-zinc-400 border-dashed hover:border-orange-500/30">
                    <Upload size={14} />
                    <span className="text-[10px] truncate max-w-[120px]">{faltaFile ? faltaFile.name : "Anexar arquivo"}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={e => e.target.files && setFaltaFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Motivo / Justificativa</label>
                <textarea 
                  className="form-input resize-none min-h-[70px]"
                  placeholder="Explique o motivo do seu afastamento..."
                  value={faltaMotivo}
                  onChange={e => setFaltaMotivo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400" onClick={() => setFaltaModal(false)}>Voltar</button>
              <button 
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoFalta}
                onClick={handleSubmitFalta}
              >
                {enviandoFalta ? "Processando..." : "Registrar Falta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FORM REGISTRAR OCORRÊNCIA */}
      {ocorrenciaModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-red-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Registrar Ocorrência Operacional</h3>
                <p className="text-[9px] text-zinc-400">Relate incidentes, faltas de insumos ou problemas no posto.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Categoria</label>
                  <select 
                    className="form-input"
                    value={ocCategoria}
                    onChange={e => setOcCategoria(e.target.value)}
                  >
                    <option>Incidente</option>
                    <option>Infraestrutura</option>
                    <option>Insumos</option>
                    <option>Falta/Atraso</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Gravidade</label>
                  <select 
                    className="form-input"
                    value={ocGravidade}
                    onChange={e => setOcGravidade(e.target.value)}
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Posto Afetado (Unidade)</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={ocPosto}
                  onChange={e => setOcPosto(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Descrição Completa dos Fatos</label>
                <textarea 
                  className="form-input resize-none min-h-[90px]"
                  placeholder="Relate detalhadamente o que ocorreu no canteiro/posto..."
                  value={ocDesc}
                  onChange={e => setOcDesc(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400" onClick={() => setOcorrenciaModal(false)}>Voltar</button>
              <button 
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoOc}
                onClick={handleSubmitOcorrencia}
              >
                {enviandoOc ? "Registrando..." : "Enviar Ocorrência"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CANAL DE ÉTICA / DENÚNCIA */}
      {denunciaModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-orange-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Canal de Ética Seguro</h3>
                <p className="text-[9px] text-zinc-400">Sua identidade é mantida em sigilo total.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Natureza do Assunto</label>
                <select 
                  className="form-input"
                  value={denunciaNatureza}
                  onChange={e => setDenunciaNatureza(e.target.value)}
                >
                  <option>Conduta Ética / Assédio</option>
                  <option>Fraude / Desvio de Patrimônio</option>
                  <option>Segurança do Trabalho (Risco)</option>
                  <option>Irregularidade Operacional</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Detalhe o ocorrido</label>
                <textarea 
                  className="form-input resize-none min-h-[120px]"
                  placeholder="Descreva a situação com o máximo de detalhes possível..."
                  value={denunciaDetalhe}
                  onChange={e => setDenunciaDetalhe(e.target.value)}
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-dashed border-white/5 flex gap-2 items-start">
                <Info size={14} className="text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-zinc-500 leading-snug">
                  Este protocolo será encaminhado diretamente ao comitê de conformidade para apuração sem registro do seu usuário.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400"
                onClick={() => setDenunciaModal(false)}
              >
                Voltar
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoDenuncia || !denunciaDetalhe.trim()}
                onClick={handleRegisterDenuncia}
              >
                {enviandoDenuncia ? "Enviando..." : "Enviar Denúncia"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: AGENDAMENTO ATENDIMENTO */}
      {agendamentoModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-blue-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Agendar Atendimento</h3>
                <p className="text-[9px] text-zinc-400">Solicite sua visita de atendimento ao escritório.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Data da Visita</label>
                <input 
                  type="date"
                  className="form-input"
                  value={agendaData}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setAgendaData(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Horário de Chegada</label>
                <select 
                  className="form-input"
                  value={agendaHora}
                  onChange={e => setAgendaHora(e.target.value)}
                >
                  <option value="">Selecione um horário...</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Motivo do Atendimento</label>
                <textarea 
                  className="form-input resize-none min-h-[80px]"
                  placeholder="Ex: Entrega de documentos, tirar dúvidas de holerite, etc..."
                  value={agendaMotivo}
                  onChange={e => setAgendaMotivo(e.target.value)}
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-dashed border-white/5 flex gap-2 items-start">
                <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-zinc-500 leading-snug">
                  Este agendamento será inserido automaticamente no Google Calendar do Escritório e ficará registrado no portal.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400"
                onClick={() => setAgendamentoModal(false)}
              >
                Voltar
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoAgenda || !agendaData || !agendaHora}
                onClick={handleRegisterAgendamento}
              >
                {enviandoAgenda ? "Agendando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CLUBE DE SERVIÇOS (VITRINE) */}
      {servicosModal && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4">
          <div className="glow-card w-full lg:max-w-[600px] h-[85vh] lg:h-[80vh] p-6 rounded-t-[2.5rem] lg:rounded-[2.5rem] flex flex-col bg-zinc-950 border-t-4 border-teal-500 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Clube de Serviços</h3>
                  <p className="text-[9px] text-zinc-400">Contrate serviços dos seus colegas de trabalho.</p>
                </div>
              </div>
              <button 
                onClick={() => setServicosModal(false)}
                className="p-2 bg-zinc-900 border border-white/5 rounded-xl text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* List and Actions */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar mb-6">
              <button 
                onClick={() => setNovoServicoModal(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20"
              >
                <Sparkles size={16} />
                Quero Divulgar um Serviço
              </button>

              <div className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-black text-white mb-3">Serviços Disponíveis</h4>
                
                {loadingServicos ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-teal-500" size={24} />
                  </div>
                ) : servicos.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-10">Nenhum serviço divulgado ainda. Seja o primeiro!</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {servicos.map(s => (
                      <div key={s.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 px-3 py-1 bg-teal-500/10 text-teal-500 text-[8px] font-black uppercase tracking-wider rounded-bl-xl border-l border-b border-teal-500/20">
                          {s.categoria}
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-white">{s.titulo}</h5>
                          <span className="text-[9px] text-zinc-500 mt-0.5 block">Oferecido por: <strong>{s.colaborador_nome.split(" ")[0]}</strong></span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{s.descricao}</p>
                        
                        <a 
                          href={`https://wa.me/${s.colaborador_telefone.replace(/\D/g, "")}?text=Olá%20${s.colaborador_nome.split(" ")[0]},%20vi%20seu%20anúncio%20de%20${s.titulo}%20no%20Clube%20de%20Serviços%20da%20Alicerce!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-4 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-teal-400 font-bold text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all mt-1"
                        >
                          <Phone size={12} />
                          Falar com o Prestador no WhatsApp
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: CADASTRO DE NOVO SERVIÇO */}
      {novoServicoModal && (
        <div className="fixed inset-0 z-[1100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glow-card w-full max-w-[450px] p-6 rounded-3xl animate-fade-in border-t-4 border-teal-500">
            <div className="flex gap-3 items-center mb-6">
              <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Divulgar Meu Serviço</h3>
                <p className="text-[9px] text-zinc-400">Anuncie seus talentos e bicos para toda a equipe.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Título do Anúncio</label>
                <input 
                  type="text"
                  placeholder="Ex: Eletricista Residencial, Pinturas, Bolos e Doces..."
                  className="form-input"
                  value={servicoTitulo}
                  onChange={e => setServicoTitulo(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Categoria</label>
                <select 
                  className="form-input"
                  value={servicoCategoria}
                  onChange={e => setServicoCategoria(e.target.value)}
                >
                  <option>Construção & Reformas</option>
                  <option>Elétrica & Hidráulica</option>
                  <option>Gastronomia & Eventos</option>
                  <option>Beleza & Estética</option>
                  <option>Transportes & Mudanças</option>
                  <option>Outros Serviços</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold text-zinc-400 uppercase mb-1 block">Descrição do Serviço</label>
                <textarea 
                  className="form-input resize-none min-h-[100px]"
                  placeholder="Descreva o que você faz, valores aproximados se quiser, e sua disponibilidade..."
                  value={servicoDesc}
                  onChange={e => setServicoDesc(e.target.value)}
                />
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-dashed border-white/5 flex gap-2 items-start">
                <Info size={14} className="text-teal-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-zinc-500 leading-snug">
                  Seu contato de WhatsApp será disponibilizado nos detalhes do anúncio para os interessados falarem direto com você.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 py-3 rounded-xl bg-zinc-900 border border-white/5 text-xs font-bold text-zinc-400"
                onClick={() => setNovoServicoModal(false)}
              >
                Voltar
              </button>
              <button 
                className="flex-1 py-3 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-50"
                disabled={enviandoServico || !servicoTitulo.trim() || !servicoDesc.trim()}
                onClick={handleSubmitServico}
              >
                {enviandoServico ? "Anunciando..." : "Publicar Anúncio"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM TAB NAV BAR */}
      <nav className="bottom-bar">
        <button 
          onClick={() => setActiveTab("home")}
          className={`tab-btn ${activeTab === "home" ? "active" : ""}`}
        >
          <Home size={22} strokeWidth={activeTab === "home" ? 2.5 : 1.8} />
          <span>Início</span>
        </button>

        <button 
          onClick={() => setActiveTab("chat")}
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
        >
          <MessageSquare size={22} strokeWidth={activeTab === "chat" ? 2.5 : 1.8} />
          <span>Conversas</span>
        </button>

        <button 
          onClick={() => setActiveTab("clara")}
          className={`tab-btn ${activeTab === "clara" ? "active" : ""}`}
        >
          <div className="relative">
            <Bot size={22} strokeWidth={activeTab === "clara" ? 2.5 : 1.8} />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </div>
          </div>
          <span>Clara IA</span>
        </button>

        <button 
          onClick={() => setActiveTab("notifs")}
          className={`tab-btn ${activeTab === "notifs" ? "active" : ""}`}
        >
          <Bell size={22} strokeWidth={activeTab === "notifs" ? 2.5 : 1.8} />
          <span>Avisos</span>
        </button>

        <button 
          onClick={() => setActiveTab("profile")}
          className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
        >
          <User size={22} strokeWidth={activeTab === "profile" ? 2.5 : 1.8} />
          <span>Perfil</span>
        </button>
      </nav>
    </div>
  );
}
