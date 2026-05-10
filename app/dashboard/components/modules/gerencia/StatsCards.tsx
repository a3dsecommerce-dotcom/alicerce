"use client";
import { Users, FileText, Briefcase, AlertCircle } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalColaboradores: number;
    totalRequisicoes: number;
    totalVagas: number;
    ticketsAbertos: number;
    diretoresAtivos: number;
    solicitacoesDiretor: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: "Colaboradores Ativos", value: stats.totalColaboradores, icon: Users, color: "bg-blue-500" },
    { label: "Requisições Totais", value: stats.totalRequisicoes, icon: FileText, color: "bg-orange-500" },
    { label: "Vagas em Aberto", value: stats.totalVagas, icon: Briefcase, color: "bg-green-500" },
    { label: "Tickets Pendentes", value: stats.ticketsAbertos, icon: AlertCircle, color: "bg-red-500" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl flex items-center gap-6 group hover:scale-[1.02] transition-all">
          <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10`}>
            <card.icon size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">{card.label}</p>
            <h4 className="text-3xl font-black text-[var(--text-primary)] mt-1 tracking-tighter">{card.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
}
