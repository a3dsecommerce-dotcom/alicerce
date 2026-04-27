"use client";
import { 
  ShieldAlert, Plus, MapPin, CheckCircle2, ArrowRight, Target, 
  Search, Calendar, ChevronRight 
} from "lucide-react";
import React from "react";

// 1. Header Estratégico
export const GestaoHeader = ({ onNewTask, onNewMeeting }: { onNewTask: () => void, onNewMeeting: () => void }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass p-12 lg:px-16 rounded-lg border border-[var(--border)] relative overflow-hidden gap-8">
    <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--brand)]/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
    <div className="relative z-10">
      <h1 className="text-4xl font-black text-[var(--text-primary)] flex items-center gap-6">
        <ShieldAlert className="text-[var(--brand)]" size={40} /> Gestão Estratégica
      </h1>
      <p className="text-[var(--text-secondary)] text-base font-semibold mt-3 max-w-lg leading-relaxed">Controle centralizado de rotas, supervisão operacional e missões de campo em tempo real.</p>
    </div>
    <div className="flex gap-4 relative z-10">
      <button 
        onClick={onNewMeeting}
        className="btn-ghost !py-5 !px-10 text-[1rem] border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
      >
        <Calendar size={24} /> Agendar Reunião
      </button>
      <button 
        onClick={onNewTask}
        className="btn-brand !py-5 !px-10 text-[1rem] shadow-xl"
      >
        <Plus size={24} /> Nova Missão de Campo
      </button>
    </div>
  </div>
);

// 2. Controle de Rotas e Supervisores
export const ControleRotas = ({ rotas, onEdit }: { rotas: any[], onEdit: (rota: any) => void }) => (
  <div className="card p-6 flex flex-col h-full">
    <h2 className="text-lg font-black text-[var(--text-primary)] mb-6 flex items-center gap-2">
      <MapPin className="text-[var(--brand)]" size={20} /> Controle de Supervisão
    </h2>
    <div className="overflow-x-auto flex-1">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Unidade / Rota</th>
            <th className="table-header">Supervisor</th>
            <th className="table-header">Sincronismo</th>
            <th className="table-header text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rotas.map((rota) => (
            <tr key={rota.id} className="group hover:bg-[var(--bg-card-hover)] transition-colors">
              <td className="table-cell">
                <div className="font-black text-[var(--text-primary)]">{rota.nome}</div>
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{rota.latitude}, {rota.longitude}</div>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] font-black text-xs border border-[var(--brand)]/20">
                    {rota.encarregado_nome?.charAt(0) || '?'}
                  </div>
                  <span className="font-bold text-[var(--text-secondary)]">{rota.encarregado_nome || "Não Atribuído"}</span>
                </div>
              </td>
              <td className="table-cell">
                <span className="badge badge-green flex items-center gap-1 w-fit">
                  <CheckCircle2 size={10} /> Canal Ativo
                </span>
              </td>
              <td className="table-cell text-right">
                <button 
                  onClick={() => onEdit(rota)}
                  className="text-[var(--brand)] hover:underline text-[11px] font-black uppercase flex items-center gap-1 ml-auto"
                >
                  Alterar <ArrowRight size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 3. Tabela de Missões e Metas
export const ListaMissoes = ({ missoes, busca, onBusca }: { missoes: any[], busca: string, onBusca: (v: string) => void }) => (
  <div className="card p-6">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
        <Target className="text-[var(--brand)]" size={20} /> Missões em Campo
      </h2>
      <div className="relative w-72 group">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand)]" />
        <input 
          placeholder="Pesquisar missão..."
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          className="input-field w-full pl-11 !py-2"
        />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-header">Missão</th>
            <th className="table-header">Responsável</th>
            <th className="table-header">Prazo</th>
            <th className="table-header text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {missoes.map((m) => (
            <tr key={m.id} className="hover:bg-[var(--bg-card-hover)] transition-colors">
              <td className="table-cell">
                <div className="font-black text-[var(--text-primary)]">{m.titulo}</div>
                <div className="text-[10px] font-medium text-[var(--text-muted)] max-w-xs truncate uppercase mt-0.5">{m.descricao}</div>
              </td>
              <td className="table-cell font-bold text-[var(--text-secondary)]">
                {m.usuarios?.nome || "Externo"}
              </td>
              <td className="table-cell font-black text-[var(--text-muted)] text-xs">
                {new Date(m.data_limite).toLocaleDateString('pt-BR')}
              </td>
              <td className="table-cell text-right">
                <span className={`badge ${m.status === 'CONCLUIDO' ? 'badge-green' : 'badge-amber'}`}>
                  {m.status === 'CONCLUIDO' ? 'Finalizado' : 'Pendente'}
                </span>
              </td>
            </tr>
          ))}
          {missoes.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-[var(--text-muted)] font-bold uppercase text-[10px]">Nenhuma missão ativa no momento.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// 4. Feed de Campo Real-Time
export const FeedCampo = () => (
  <div className="card p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
        <Plus className="text-[#25D366]" size={20} /> Feed em Tempo Real
      </h2>
      <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 rounded-lg text-[10px] font-black text-green-500">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> AO VIVO
      </div>
    </div>
    <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
      {[
        { quem: "Maria (ASG)", acao: "Reportou Falta de Material", onde: "UBS Norte", hora: "11:45" },
        { quem: "João (Porteiro)", acao: "Ponto Batido via Foto", onde: "SEMED", hora: "11:40" },
        { quem: "Paulo (Encarregado)", acao: "Checklist Finalizado", onde: "Escola Nabuco", hora: "11:30" },
        { quem: "Anônimo", acao: "Denúncia Registrada", onde: "Portal Ético", hora: "11:15" },
        { quem: "Ricardo (Zelador)", acao: "Solicitação de Férias", onde: "via Bot", hora: "10:50" },
      ].map((feed, i) => (
        <div key={i} className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/30 transition-all cursor-pointer group">
          <div className="flex justify-between mb-2">
            <span className="font-black text-[0.9rem] text-[var(--text-primary)]">{feed.quem}</span>
            <span className="text-[11px] font-bold text-[var(--text-muted)]">{feed.hora}</span>
          </div>
          <div className="text-[var(--text-secondary)] text-[0.85rem] font-semibold mb-3 group-hover:text-[var(--text-primary)] transition-colors leading-relaxed">{feed.acao}</div>
          <div className="flex items-center gap-2 text-[var(--brand)] font-black uppercase text-[10px] bg-[var(--brand)]/5 w-fit px-3 py-1 rounded-lg">
            <MapPin size={12} /> {feed.onde}
          </div>
        </div>
      ))}
    </div>
    <button className="w-full mt-6 py-4 border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-muted)] text-[10px] font-black uppercase hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">
      Visualizar Histórico Completo
    </button>
  </div>
);
