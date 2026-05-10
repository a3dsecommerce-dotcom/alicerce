import { useState } from "react";
import { BookOpen, Sparkles, Rocket, ShieldCheck, Zap, Activity, Clock, Users, Package, AlertTriangle, ChevronRight, FileText, History } from "lucide-react";

/**
 * PROTOCOLO DE MANUTENÇÃO (OBRIGATÓRIO):
 * A cada deploy que contenha melhorias, correções ou novas funcionalidades, 
 * este arquivo DEVE ser atualizado com uma nova entrada no array UPDATES.
 */

const UPDATES = [
  {
    version: "v753.6",
    date: "10/05/2026",
    title: "Motor de Checklist RH v2.1",
    description: "Lançamento do Cockpit de Gestão Documental e UX Otimista.",
    tags: ["RH", "DADOS", "UX"],
    details: [
      "Cockpit de Configuração: Personalização total de nomes e cores via ícone de engrenagem.",
      "Reordenamento Dinâmico: Movimentação de colunas com persistência automática.",
      "Zero-Blink UX: Atualizações otimistas para resposta instantânea em campo.",
      "Sincronização Master: Vinculação robusta entre documentos extras e colaboradores."
    ]
  },
  {
    version: "v753.5",
    date: "09/05/2026",
    title: "SLA em Horário Comercial",
    description: "Implementação global de 'Horas Úteis' para cálculo de prazos e vencimentos.",
    tags: ["SLA", "GOVERNANÇA", "OPERACIONAL"],
    details: [
      "O relógio de ocorrências agora 'congela' automaticamente em fins de semana e feriados.",
      "Contagem válida apenas de Segunda a Sexta, das 07:00 às 17:00.",
      "Eliminação de falsos atrasos em tickets abertos antes do final de semana.",
      "Centralização da lógica em utilitário único para todos os módulos (RH, Gerência, Encarregado)."
    ]
  },
  {
    version: "v753.4",
    date: "09/05/2026",
    title: "Telemetria de Governança",
    description: "Novo sistema de monitoramento de acessos e presença em tempo real.",
    tags: ["DADOS", "SISTEMA", "AUDITORIA"],
    details: [
      "Contador de 'Acessos Totais' por usuário para estatísticas de engajamento.",
      "Sistema de Heartbeat para detecção ultra-precisa de usuários online.",
      "Novo filtro de 15 minutos para status 'Ativo' no painel de gerência.",
      "Otimização de performance na listagem de atividades do sistema."
    ]
  },
  {
    version: "v753.3",
    date: "09/05/2026",
    title: "Recrutamento Segmentado",
    description: "Otimização do formulário 'Trabalhe Conosco' com seleção precisa de cargos.",
    tags: ["RECRUTAMENTO", "RH", "UX"],
    details: [
      "Atualização da lista de cargos pretendidos com opções operacionais e técnicas.",
      "Inclusão de cargos como Engenheiro, Motorista e Técnico de Segurança.",
      "Melhoria na integridade dos dados para triagem automática pelo DP.",
      "Reset de valores padrão para evitar seleções acidentais (ex: ASG)."
    ]
  },
  {
    version: "v753.2",
    date: "09/05/2026",
    title: "Central de Governança Viva",
    description: "Lançamento do Manual de Boas Práticas e Protocolo de Documentação Contínua.",
    tags: ["DOCUMENTAÇÃO", "BOAS PRÁTICAS", "SIDEBAR"],
    details: [
      "Criação do módulo de Manual de Boas Práticas integrado ao cockpit.",
      "Implementação de filtros RBAC para ocultação automática no nível PMG-1.",
      "Estabelecimento de protocolo de atualização obrigatória a cada deploy.",
      "Interface premium com timeline de evolução do sistema."
    ]
  },
  {
    version: "v753.1",
    date: "09/05/2026",
    title: "Governança de SLA & Workforce",
    description: "Refatoração profunda da lógica de SLA e monitoramento de presença em tempo real.",
    tags: ["SLA", "PRESENÇA", "PERFORMANCE"],
    details: [
      "Novo cálculo de SLA baseado exclusivamente em Horário Comercial (07:00 - 17:00) e Dias Úteis.",
      "Monitoramento de Usuários Online com detecção de atividade em tempo real no dashboard.",
      "Novo Painel de Gerência com visão setorial (RH, Almoxarifado, Operacional).",
      "Normalização de nomenclatura de cargos para unificação da base de dados."
    ]
  },
  {
    version: "v752.0",
    date: "06/05/2026",
    title: "Módulo Encarregado & SST",
    description: "Lançamento da Admissão Rápida e registro crítico de CAT.",
    tags: ["ADMISSÃO", "SST", "SEGURANÇA"],
    details: [
      "Admissão Rápida para povoamento imediato da base operacional via celular.",
      "Registro de CAT (Comunicado de Acidente de Trabalho) com workflow jurídico.",
      "Sistema de Missões Operacionais para encarregados de rota.",
      "Integração de entrega de EPI com baixa automática no estoque."
    ]
  },
  {
    version: "v751.0",
    date: "28/04/2026",
    title: "Inteligência de Compras",
    description: "Novo catálogo inteligente e rastreio de logística.",
    tags: ["COMPRAS", "LOGÍSTICA"],
    details: [
      "Catálogo de produtos com precificação dinâmica por unidade.",
      "Workflow de aprovação de pedidos multinível.",
      "Dashboard de tracking de pedidos em tempo real."
    ]
  }
];

const BEST_PRACTICES = [
  {
    icon: ShieldCheck,
    title: "Segurança de Dados",
    category: "SEGURANÇA",
    description: "Nunca compartilhe sua senha. O sistema registra cada ação (log) para auditoria e proteção do colaborador.",
    longDescription: "A segurança é o pilar central do Alicerce ERP. Todas as ações realizadas por usuários autenticados são registradas na tabela de auditoria global, garantindo transparência e rastreabilidade absoluta."
  },
  {
    icon: Zap,
    title: "Agilidade Operacional",
    category: "OPERAÇÕES",
    description: "Use a Admissão Rápida assim que o colaborador chegar na unidade. Isso garante que ele receba EPI e benefícios no prazo.",
    longDescription: "O módulo de Admissão Rápida foi desenvolvido para eliminar o gap de registro entre a chegada no posto e o processamento no DP. O uso imediato reduz riscos jurídicos e garante a segurança do trabalhador."
  },
  {
    icon: Clock,
    title: "Prazos de SLA",
    category: "PERFORMANCE",
    description: "Ocorrências 'FALIT' impactam diretamente o KPI da unidade. Responda dentro do horário comercial para manter a saúde do processo.",
    longDescription: "O SLA em Horário Comercial (07h-17h) é a métrica de ouro da nossa eficiência. O sistema congela prazos em períodos não-úteis para garantir uma avaliação justa e precisa da performance setorial."
  },
  {
    icon: Users,
    title: "Canal de Ética",
    category: "GOVERNANÇA",
    description: "O Canal de Ética é anônimo. Use-o para relatar condutas que ferem os valores da Alicerce.",
    longDescription: "A integridade operacional é mantida através do Canal Ético. Relatos de má conduta são analisados diretamente pela alta gerência com garantia de anonimato e proteção ao denunciante."
  }
];

export default function ManualModule() {
  const [activeTab, setActiveTab] = useState<"UPDATES" | "PRACTICES">("UPDATES");

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-20 max-w-[1400px] mx-auto w-full px-4 lg:px-0">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 lg:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-4 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
              Documentação Oficial
            </div>
          </div>
          <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter mb-4 leading-tight">
            Manual de Boas Práticas <br /> & Atualizações <span className="text-indigo-400">Alicerce ERP</span>
          </h2>
          <p className="text-sm lg:text-lg font-medium text-slate-300 max-w-2xl leading-relaxed">
            Bem-vindo ao cockpit de inteligência. Aqui você encontra as diretrizes para uma operação de excelência e o histórico de evolução da nossa tecnologia.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-center lg:justify-start">
        <div className="flex items-center gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border)] shadow-sm">
          <button 
            onClick={() => setActiveTab("UPDATES")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "UPDATES" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-base)]"}`}
          >
            <History size={14} /> Atualizações
          </button>
          <button 
            onClick={() => setActiveTab("PRACTICES")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "PRACTICES" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-base)]"}`}
          >
            <BookOpen size={14} /> Boas Práticas e Manuais
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "UPDATES" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-12 space-y-8">
              <div className="flex items-center justify-between mb-2 px-2">
                 <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-[0.3em] flex items-center gap-3 italic">
                    <Rocket className="text-indigo-500" size={18} /> Histórico de Evolução
                 </h3>
                 <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full uppercase">Última: {UPDATES[0].date}</span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {UPDATES.map((up, idx) => (
                  <div key={idx} className="group relative bg-[var(--bg-card)] p-8 lg:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-xl hover:border-indigo-500/50 transition-all">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{up.version}</span>
                           <span className="text-[10px] font-bold text-[var(--text-muted)]">• {up.date}</span>
                        </div>
                        <h4 className="text-2xl font-black text-[var(--text-primary)] italic leading-tight uppercase tracking-tight">{up.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        {up.tags.map(t => (
                          <span key={t} className="px-3 py-1 bg-[var(--bg-base)] text-[8px] font-black uppercase tracking-widest text-[var(--text-muted)] rounded-lg border border-[var(--border)] group-hover:border-indigo-500/20 group-hover:text-indigo-500 transition-colors">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-8 leading-relaxed max-w-2xl">
                      {up.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {up.details.map((detail, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-3 p-4 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] group-hover:bg-indigo-500/[0.02] transition-colors">
                          <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500 mt-0.5">
                            <ChevronRight size={14} />
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-primary)] leading-snug">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex items-center gap-3 italic px-2">
              <Sparkles className="text-amber-500" size={18} />
              <h3 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-[0.3em]">Guia de Boas Práticas e Manuais Alicerce</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {BEST_PRACTICES.map((practice, idx) => (
                <div key={idx} className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.01] flex flex-col gap-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
                  
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 rounded-3xl flex items-center justify-center shadow-inner border border-indigo-500/10">
                      <practice.icon size={28} />
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-500/5 text-[9px] font-black uppercase tracking-widest text-indigo-500 rounded-full border border-indigo-500/10">
                      {practice.category}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-xl font-black text-[var(--text-primary)] uppercase italic mb-4">{practice.title}</h5>
                    <p className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed mb-6">
                      {practice.description}
                    </p>
                    <div className="p-6 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)] border-l-4 border-l-indigo-500">
                      <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed italic">
                        "{practice.longDescription}"
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suporte Técnico Section */}
            <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="max-w-xl">
                    <h4 className="text-2xl lg:text-3xl font-black uppercase italic mb-6 flex items-center gap-3">
                       <ShieldCheck size={32} /> Central de Suporte & Feedback
                    </h4>
                    <p className="text-sm lg:text-lg font-medium opacity-90 leading-relaxed mb-8">
                       Dúvidas sobre o funcionamento técnico, sugestões de novas funcionalidades ou relatos de inconsistências devem ser enviadas diretamente ao comitê de tecnologia.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button className="px-10 py-5 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                         Abrir Chamado Técnico
                      </button>
                      <button className="px-10 py-5 bg-transparent border-2 border-white/30 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                         Enviar Sugestão
                      </button>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                      <FileText size={64} className="text-white" />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
