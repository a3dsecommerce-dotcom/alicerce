"use client";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, ShoppingCart, Megaphone, 
  Package, ShieldCheck, Activity, Bell, Settings
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import QuickActions from "./components/QuickActions";

// Importando Módulos Unificados
import GerenciaModule from "./components/modules/GerenciaModule";
import RHModule from "./components/modules/RHModule";
import ComprasModule from "./components/modules/ComprasModule";
import ComunicacaoModule from "./components/modules/ComunicacaoModule";
import AlmoxarifadoModule from "./components/modules/AlmoxarifadoModule";

export default function UnifiedCockpitPage() {
  return (
    <Suspense fallback={<div>Carregando Painel de Controle...</div>}>
      <CockpitContent />
    </Suspense>
  );
}

function CockpitContent() {
  const searchParams = useSearchParams();
  const modParam = searchParams.get("module");
  const tabParam = searchParams.get("tab");
  
  // Estado que controla qual módulo funcional está visível (ex: Gerência, RH, Compras)
  const [activeModule, setActiveModule] = useState("COMMAND");
  
  // Sincroniza o módulo ativo caso venha um parâmetro via URL
  useEffect(() => {
    if (modParam && ["COMMAND", "RH", "COMPRAS", "ALMOXARIFADO", "SST"].includes(modParam)) {
      setActiveModule(modParam);
    }
  }, [modParam]);

  const [user, setUser] = useState<any>(null);
  const [reducaoGeral, setReducaoGeral] = useState(20);
  const [loading, setLoading] = useState(true);

  // Carrega dados do usuário logado do armazenamento local
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {
      console.error(err);
      localStorage.removeItem("crm_user");
    }
  }, []);

  // Definição dos Módulos do Sistema e suas permissões (RBAC)
  const modules = [
    { id: "COMMAND", label: "Painel de Controle", icon: LayoutDashboard, roles: ["ADMIN", "DIRETORIA", "GERENTE"] },
    { id: "RH", label: "Recursos Humanos", icon: Users, roles: ["RH_DP", "RH_PESSOAL"] },
    { id: "COMPRAS", label: "Compras", icon: ShoppingCart, roles: ["COMPRADOR"] },
    { id: "ALMOXARIFADO", label: "Almoxarifado", icon: Package, roles: ["ALMOXARIFE"] },
    { id: "SST", label: "Segurança (SST)", icon: ShieldCheck, roles: ["TECNICO_SEGURANCA"] },
  ];

  // Regra de Negócio: nivel_acesso >= 3 = Gestor/Admin → vê o Painel Consolidado
  // Exceção: Roles restritas (COMPRADOR, ALMOXARIFE) devem ver APENAS o próprio módulo
  const nivel = user?.nivel || 0;
  const safeRole = user?.role ? String(user.role).toUpperCase() : "";
  const isStrictRole = ["COMPRADOR", "ALMOXARIFE", "TECNICO_SEGURANCA"].includes(safeRole);
  const isManager = !isStrictRole && (nivel >= 3 || ["ADMIN", "DIRETORIA", "GERENTE"].includes(safeRole));
  
  // Se for gestor: mostra o painel de controle completo
  // Se for colaborador de área: mostra módulo do seu cargo
  // Fallback: se não tem role/nivel definido, mostra COMMAND (evita tela em branco)
  const filteredModules = isManager
    ? modules
    : modules.filter(m => m.roles.includes(safeRole)) || [modules[0]];

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 h-full overflow-hidden">
      
      {/* 1. Header: PAINEL DE CONTROLE (PT-BR) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--brand)]/20">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Painel de Controle</h1>
            <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">Gestão Soberana Alicerce</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto max-w-[500px] custom-scrollbar">
             {filteredModules.map(m => (
               <button 
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[0.7rem] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeModule === m.id ? 'bg-[var(--brand)] text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'}`}
               >
                 <m.icon size={14} />
                 <span>{m.label}</span>
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* 2. Barra de Ações Rápidas */}
      {activeModule !== "COMPRAS" && <QuickActions user={user || { role: 'ADMIN' }} />}

      {/* 3. Área de Conteúdo Dinâmico */}
      <main className="flex-1 overflow-hidden min-h-[600px]">
        {user ? (
          <>
            {(activeModule === "COMMAND" || !activeModule) && <GerenciaModule user={user} initialTab={tabParam as any} />}
            {activeModule === "RH" && <RHModule user={user} />}
            {activeModule === "COMPRAS" && <ComprasModule reducao={reducaoGeral} />}
            {activeModule === "ALMOXARIFADO" && <AlmoxarifadoModule reducao={reducaoGeral} setReducao={setReducaoGeral} />}
          </>
        ) : (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Carregando sessão...</p>
          </div>
        )}
        
        {activeModule === "SST" && (
          <div className="flex flex-col items-center justify-center h-full py-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
            <Settings size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
            <h3 className="text-lg font-black text-[var(--text-primary)]">Módulo SST em Sincronização</h3>
          </div>
        )}
      </main>

    </div>
  );
}
