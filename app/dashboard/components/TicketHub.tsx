"use client";
import React, { useState } from 'react';
import { Ticket, Clock, CheckCircle2, AlertCircle, ArrowRight, MessageSquare, Zap } from 'lucide-react';

export default function TicketHub() {
  const [activeTab, setActiveTab] = useState<'meus' | 'pendentes'>('meus');

  // Mock data for tickets - In a real app, this would come from Supabase or an API
  const meusTickets = [
    { id: 'TK-120', titulo: 'Ajuste de Salário Insalubridade', setor: 'RH', status: 'PENDENTE', data: '22/04' },
    { id: 'TK-118', titulo: 'Troca de Uniforme (Botina)', setor: 'Almoxarifado', status: 'EM ROTA', data: '20/04' },
    { id: 'TK-115', titulo: 'Solicitação de Abono', setor: 'DP', status: 'CONCLUÍDO', data: '18/04' },
  ];

  const pendentesComigo = [
    { id: 'TK-125', titulo: 'Aprovação de Advertência (João)', setor: 'Operacional', status: 'AGUARDANDO', data: 'Hoje' },
    { id: 'TK-122', titulo: 'Validar Ocorrência de Ponto', setor: 'DP', status: 'URGENTE', data: 'Ontem' },
  ];

  const data = activeTab === 'meus' ? meusTickets : pendentesComigo;

  return (
    <div className="card flex flex-col gap-4 overflow-hidden border border-[var(--brand-alpha)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-[var(--bg-card)]/80 backdrop-blur-md">
      <div className="px-2 pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[#10B981] flex items-center justify-center text-white shadow-lg shadow-[var(--brand-alpha)]">
            <Ticket size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[var(--text-primary)]">Central de Tickets</h3>
            <p className="text-[10px] text-[var(--text-muted)] font-bold">Acompanhamento e Resolução</p>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-[var(--bg-base)]/50 rounded-xl mb-2 border border-[var(--border-light)]">
          <button 
            onClick={() => setActiveTab('meus')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'meus' ? 'bg-[var(--bg-card)] text-[var(--brand)] shadow-md border border-[var(--brand-alpha)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Meus Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('pendentes')}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'pendentes' ? 'bg-[var(--bg-card)] text-[var(--info)] shadow-md border border-[var(--info-alpha)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Para Resolver
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-auto max-h-[350px] px-2 pb-2 custom-scrollbar">
        {data.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-[var(--text-muted)]">
            <CheckCircle2 size={32} className="opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Nada pendente aqui</span>
          </div>
        ) : data.map(tk => (
          <div key={tk.id} className="group p-3 rounded-xl bg-[var(--bg-base)]/30 border border-[var(--border-light)] hover:border-[var(--brand-alpha)] hover:bg-[var(--bg-card)] transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-[var(--brand)] px-2 py-0.5 bg-[var(--brand-alpha)] rounded-full uppercase tracking-tighter">{tk.id}</span>
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{tk.setor}</span>
              </div>
              <span className="text-[9px] font-bold text-[var(--text-muted)]">{tk.data}</span>
            </div>
            <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--brand)] transition-colors line-clamp-1">{tk.titulo}</h4>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  tk.status === 'PENDENTE' || tk.status === 'AGUARDANDO' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                  tk.status === 'URGENTE' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' : 
                  tk.status === 'CONCLUÍDO' ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                }`} />
                <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--text-muted)]">{tk.status}</span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-[var(--bg-card)] border border-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--brand)] group-hover:border-[var(--brand-alpha)] transition-all">
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-[var(--bg-base)]/50 border-t border-[var(--border-light)] flex justify-between items-center">
        <div className="flex -space-x-2">
          {[1,2,3].map(i => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--bg-card)] bg-gradient-to-tr from-slate-700 to-slate-500 flex items-center justify-center overflow-hidden shadow-sm">
               <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white/50">{i}</div>
            </div>
          ))}
          <div className="w-6 h-6 rounded-full border-2 border-[var(--bg-card)] bg-[var(--brand-alpha)] flex items-center justify-center text-[8px] font-black text-[var(--brand)] shadow-sm">+5</div>
        </div>
        <button className="text-[9px] font-black uppercase text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors flex items-center gap-1.5 group">
          Painel Completo <Zap size={10} className="fill-[var(--brand)] group-hover:scale-125 transition-transform" />
        </button>
      </div>
    </div>
  );
}
