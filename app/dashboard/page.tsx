"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, Users, ShoppingBag, Megaphone, 
  Package, ShieldCheck, Activity, Bell, Settings,
  Loader
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import QuickActions from "./components/QuickActions";

import dynamic from "next/dynamic";

import RHModule from "./components/modules/RHModule";
import GerenciaModule from "./components/modules/GerenciaModule";
import OperacionalModule from "./components/modules/OperacionalModule";
import ComprasModule from "./components/modules/ComprasModule";
import ComunicacaoModule from "./components/modules/ComunicacaoModule";
import AlmoxarifadoModule from "./components/modules/AlmoxarifadoModule";
import ConfiguracoesModule from "./components/modules/ConfiguracoesModule";
import EncarregadoModule from "./components/modules/EncarregadoModule";
// Definição Estática dos Módulos do Sistema e suas permissões (RBAC)
const ALL_MODULES = [
  { id: "COMMAND", label: "Painel de Controle", icon: LayoutDashboard, roles: ["ADMIN", "DIRETORIA", "GERENTE", "ENCARREGADO"] },
  { id: "RH", label: "Recursos Humanos", icon: Users, roles: ["ADMIN", "DIRETORIA", "GERENTE", "RH_DP", "RH_PESSOAL"] },
  { id: "COMPRAS", label: "Compras", icon: ShoppingBag, roles: ["ADMIN", "DIRETORIA", "GERENTE", "COMPRADOR"] },
  { id: "ALMOXARIFADO", label: "Almoxarifado", icon: Package, roles: ["ADMIN", "DIRETORIA", "GERENTE", "ALMOXARIFE", "ALMOXARIFADO"] },
  { id: "OPERACIONAL", label: "Operacional", icon: Activity, roles: ["ADMIN", "DIRETORIA", "GERENTE", "OPERACIONAL", "ENCARREGADO"] },
  { id: "SST", label: "Segurança (SST)", icon: ShieldCheck, roles: ["ADMIN", "DIRETORIA", "GERENTE", "TECNICO_SEGURANCA"] },
  { id: "SETTINGS", label: "Configurações", icon: Settings, roles: ["ADMIN", "DIRETORIA", "GERENTE", "RH_DP", "RH_PESSOAL", "COMPRADOR", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA", "COLABORADOR", "SUPERVISOR", "ENCARREGADO"] },
];

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
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  const [user, setUser] = useState<any>(null);
  const [reducaoGeral, setReducaoGeral] = useState(20);
  const [loading, setLoading] = useState(true);

  // Carrega dados do usuário logado e sincroniza com o banco para garantir campos novos (como secretaria)
  useEffect(() => {
    async function syncUser() {
      try {
        const saved = localStorage.getItem("crm_user");
        if (saved) {
          const localUser = JSON.parse(saved);
          setUser(localUser);

          // Sincroniza com o banco para pegar campos novos (ex: secretaria)
          if (localUser.id || localUser.email) {
            const { data: dbUser } = await supabase
              .from('usuarios')
              .select('*')
              .or(`id.eq.${localUser.id},email.eq.${localUser.email}`)
              .single();
            
            if (dbUser) {
              const updatedUser = { ...localUser, ...dbUser };
              setUser(updatedUser);
              localStorage.setItem("crm_user", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar usuário:", err);
      } finally {
        setLoading(false);
      }
    }
    syncUser();
  }, []);

  // Lógica de Filtragem de Módulos (RBAC)
  const filteredModules = useMemo(() => {
    const nivel = user?.nivel || 0;
    const safeRole = user?.role ? String(user.role).toUpperCase() : "";
    const isStrictRole = ["COMPRADOR", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA"].includes(safeRole);
    const isManager = !isStrictRole && (nivel >= 3 || ["ADMIN", "DIRETORIA", "GERENTE"].includes(safeRole));
    
    if (!user) return [];
    
    return isManager
      ? ALL_MODULES
      : ALL_MODULES.filter(m => m.roles.includes(safeRole));
  }, [user]);

  // Sincroniza o módulo ativo caso venha um parâmetro via URL ou baseando-se nas permissões
  useEffect(() => {
    // 1. Prioridade: Parâmetro da URL (Validado contra permissões)
    if (modParam && filteredModules.some(m => m.id === modParam)) {
      setActiveModule(modParam);
    } 
    // 2. Se o parâmetro for COMMAND mas não tem acesso (ou se não houver parâmetro)
    else if (filteredModules.length > 0) {
      if (!activeModule) {
        setActiveModule(filteredModules[0].id);
      } else if (!filteredModules.some(m => m.id === activeModule)) {
        // Se o módulo ativo atual não for permitido para este usuário, volta para o primeiro disponível
        setActiveModule(filteredModules[0].id);
      }
    }
  }, [modParam, filteredModules, activeModule]);

  const activeModuleData = useMemo(() => {
    return ALL_MODULES.find(m => m.id === activeModule) || ALL_MODULES[0];
  }, [activeModule]);

  const router = useRouter();

  // Handler para trocar de módulo atualizando a URL
  const handleModuleChange = (id: string) => {
    setActiveModule(id);
    const params = new URLSearchParams(window.location.search);
    params.set("module", id);
    params.delete("tab"); // Limpa a aba ao trocar de módulo principal
    router.push(`?${params.toString()}`);
  };

  const safeRole = user?.role ? String(user.role).toUpperCase() : "";
  const isManager = (user?.nivel || 0) >= 3 || ["ADMIN", "DIRETORIA", "GERENTE"].includes(safeRole);

  useEffect(() => {
    if (user) {
      console.log("🛠️ DASHBOARD STATE:", {
        activeModule,
        safeRole,
        isManager,
        nivel: user.nivel,
        modParam,
        tabParam
      });
    }
  }, [user, activeModule, modParam, tabParam, safeRole, isManager]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 h-full overflow-hidden">
      
      {/* 1. Header Dinâmico */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[var(--brand)]/20">
            {activeModuleData.icon ? <activeModuleData.icon size={24} /> : <Activity size={24} />}
          </div>
          <div>
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{activeModuleData.label}</h1>
            <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">Portal Administrativo Alicerce</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border)] overflow-x-auto max-w-[500px] custom-scrollbar flex-nowrap">
             {filteredModules.map(m => (
               <button 
                key={m.id}
                onClick={() => handleModuleChange(m.id)}
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
      <main className="flex-1 overflow-hidden min-h-[600px] relative">
        {user ? (
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 rounded-[3rem]">
              <div className="flex flex-col items-center gap-4">
                <Loader className="animate-spin text-[var(--brand)]" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand)]">Carregando Módulo...</p>
              </div>
            </div>
          }>
            { activeModule === "RH" && <RHModule user={user} />}
            { activeModule === "COMPRAS" && <ComprasModule reducao={reducaoGeral} />}
            { activeModule === "ALMOXARIFADO" && <AlmoxarifadoModule reducao={reducaoGeral} setReducao={setReducaoGeral} /> }
            { activeModule === "OPERACIONAL" && <OperacionalModule user={user} /> }
            { activeModule === "SETTINGS" && <ConfiguracoesModule user={user} /> }
            { (activeModule === "COMMAND" || !activeModule) && (
               (safeRole === 'ENCARREGADO') 
                 ? <EncarregadoModule user={user} initialTab={tabParam as any} />
                 : <GerenciaModule user={user} initialTab={tabParam as any} />
            )}
            
            {activeModule === "SST" && (
              <div className="flex flex-col items-center justify-center h-full py-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)]">
                <Settings size={48} className="text-[var(--text-muted)] opacity-20 mb-4" />
                <h3 className="text-lg font-black text-[var(--text-primary)]">Módulo SST em Sincronização</h3>
              </div>
            )}
            
            {/* Fallback caso nenhum módulo esteja ativo mas haja permissão */}
            {!activeModule && filteredModules.length > 0 && (
               <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Activity size={48} className="animate-pulse mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Sincronizando Módulo Operacional...</p>
               </div>
            )}
          </Suspense>
        ) : (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Carregando sessão...</p>
          </div>
        )}
      </main>

    </div>
  );
}
