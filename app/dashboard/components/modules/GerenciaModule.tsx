"use client";
import { useState, useEffect } from "react";
import { 
  Settings, Database, Truck, Shield
} from "lucide-react";
import { useGerenciaData } from "./gerencia/useGerenciaData";
import VolantesEscala from "./rh/VolantesEscala";

export default function GerenciaModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading: loadingGerencia, volantes, requisicoesVolantes, refresh } = useGerenciaData();
  const [activeTab, setActiveTab] = useState<"CONFIG" | "DB" | "VOLANTES">((initialTab?.toUpperCase() as any) || "VOLANTES");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab.toUpperCase() as any);
    }
  }, [initialTab]);

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* HEADER GESTÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Painel de Controle Central</h2>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Shield size={16} className="text-[var(--brand)]" /> Governança & Auditoria Alicerce ERP
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-md overflow-x-auto w-full lg:w-auto">
          {[
            { id: "VOLANTES", label: "Escala Volantes", icon: Truck },
            { id: "CONFIG", label: "Configurações", icon: Settings },
            { id: "DB", label: "Banco de Dados", icon: Database }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-10 overflow-hidden">
        {activeTab === "VOLANTES" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <VolantesEscala 
              volantes={volantes}
              requisicoes={requisicoesVolantes}
              refresh={refresh}
              user={user}
            />
          </div>
        )}

        {(activeTab === "CONFIG" || activeTab === "DB") && (
          <div className="flex-1 flex items-center justify-center p-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] opacity-40">
            <div className="text-center">
              <Settings size={64} className="mx-auto mb-6 text-[var(--brand)] animate-pulse" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Módulo em Desenvolvimento</h3>
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                As funcionalidades de {activeTab === "DB" ? "Gerenciamento de Dados" : "Configurações do Sistema"} estão sendo implementadas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
