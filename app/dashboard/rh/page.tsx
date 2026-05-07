"use client";
import { useRouter } from "next/navigation";
import { Users, ClipboardList, Award, MapPin, ChevronRight } from "lucide-react";

const RH_MODULES = [
  {
    href: "/dashboard/rh/pessoal",
    icon: Users,
    label: "Pessoal & DP",
    desc: "Gestão de colaboradores, admissão, férias e desligamentos",
    color: "var(--brand)",
    bg: "var(--brand-alpha)",
  },
  {
    href: "/dashboard/rh/beneficios",
    icon: Award,
    label: "Benefícios",
    desc: "Vales, documentos e conformidade",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
  {
    href: "/dashboard/rh/ponto",
    icon: ClipboardList,
    label: "Ponto & Jornada",
    desc: "Controle de horários, extras e escalas",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.1)",
  },
  {
    href: "/dashboard/rh/prefeitura",
    icon: MapPin,
    label: "Portal PMG",
    desc: "RH da Prefeitura — SEMED, SEMSA, SEMAD, SEMOB",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
  },
];

export default function RHIndexPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-dark))" }}
        >
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
            Recursos Humanos
          </h1>
          <p className="text-[0.72rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
            Selecione o módulo desejado
          </p>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RH_MODULES.map((mod) => (
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
              <div className="text-[0.7rem] text-[var(--text-muted)] font-medium leading-snug mt-0.5 truncate">
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
