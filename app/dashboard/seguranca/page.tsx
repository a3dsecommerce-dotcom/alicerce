"use client";
import { useRouter } from "next/navigation";
import { ShieldCheck, HardHat, FileText, ChevronRight } from "lucide-react";

const SST_MODULES = [
  {
    href: "/dashboard/seguranca/epis",
    icon: HardHat,
    label: "Gestão de EPIs",
    desc: "Controle de entrega, validade e conformidade de equipamentos",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
  },
  {
    href: "/dashboard/seguranca/cat",
    icon: FileText,
    label: "CAT — Investigação de Acidentes",
    desc: "Registro e acompanhamento de comunicações de acidente de trabalho",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.1)",
  },
  {
    href: "/dashboard/seguranca/treinamentos",
    icon: ShieldCheck,
    label: "Treinamentos NR",
    desc: "Controle de treinamentos obrigatórios e vencimentos de certificados",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
];

export default function SegurancaIndexPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
            Segurança do Trabalho (SST)
          </h1>
          <p className="text-[0.72rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
            Selecione o módulo desejado
          </p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="flex flex-col gap-4">
        {SST_MODULES.map((mod) => (
          <button
            key={mod.href}
            onClick={() => router.push(mod.href)}
            className="flex items-center gap-4 p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] hover:border-[var(--brand)]/40 hover:bg-[var(--bg-card-hover)] transition-all text-left group"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ background: mod.bg, color: mod.color }}
            >
              <mod.icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">
                {mod.label}
              </div>
              <div className="text-[0.7rem] text-[var(--text-muted)] font-medium leading-snug mt-0.5">
                {mod.desc}
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[var(--text-muted)] group-hover:text-[var(--brand)] transition-colors flex-shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
