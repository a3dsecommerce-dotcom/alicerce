"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, Users, ShoppingBag, Megaphone, 
  Package, ShieldCheck, Activity, Bell, Settings,
  Loader, AlertTriangle, FileText, BookOpen, Sparkles, Rocket, UserCheck, MessageSquare
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import QuickActions from "./components/QuickActions";

import dynamic from "next/dynamic";
import DevImpersonator from "./components/DevImpersonator";

// Dynamic imports: cada módulo é carregado sob demanda quando o usuário acessa a aba
const RHModule = dynamic(() => import("./components/modules/RHModule"), { ssr: false });
const GerenciaModule = dynamic(() => import("./components/modules/GerenciaModule"), { ssr: false });
const OperacionalModule = dynamic(() => import("./components/modules/OperacionalModule"), { ssr: false });
const ComprasModule = dynamic(() => import("./components/modules/ComprasModule"), { ssr: false });
const ComunicacaoModule = dynamic(() => import("./components/modules/ComunicacaoModule"), { ssr: false });
const AlmoxarifadoModule = dynamic(() => import("./components/modules/AlmoxarifadoModule"), { ssr: false });
const ConfiguracoesModule = dynamic(() => import("./components/modules/ConfiguracoesModule"), { ssr: false });
const EncarregadoModule = dynamic(() => import("./components/modules/EncarregadoModule"), { ssr: false });
const OcorrenciasModule = dynamic(() => import("./components/modules/OcorrenciasModule"), { ssr: false });
const ManualModule = dynamic(() => import("./components/modules/ManualModule"), { ssr: false });
const DiretorModule = dynamic(() => import("./components/modules/DiretorModule"), { ssr: false });
const ChatModule = dynamic(() => import("./components/modules/ChatModule"), { ssr: false });
// Definição Estática dos Módulos do Sistema e suas permissões (RBAC)
const ALL_MODULES = [
  { id: "COMMAND", label: "Painel de Controle", icon: LayoutDashboard, roles: ["ADMIN", "GERENTE", "GERENCIA", "ENCARREGADO"] },
  { id: "RH", label: "Recursos Humanos", icon: Users, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "RH_DP", "RH_PESSOAL"] },
  { id: "COMPRAS", label: "Compras", icon: ShoppingBag, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "COMPRADOR", "COMPRAS"] },
  { id: "ALMOXARIFADO", label: "Almoxarifado", icon: Package, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "ALMOXARIFE", "ALMOXARIFADO"] },
  { id: "OPERACIONAL", label: "Operacional", icon: Activity, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "OPERACIONAL"] },
  { id: "SST", label: "Segurança (SST)", icon: ShieldCheck, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "TECNICO_SEGURANCA"] },
  { id: "OCORRENCIAS", label: "Ocorrências", icon: AlertTriangle, roles: ["ADMIN", "GERENTE", "GERENCIA", "RH_DP", "RH_PESSOAL", "COMPRADOR", "COMPRAS", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA", "ENCARREGADO"] },
  { id: "SETTINGS", label: "Configurações", icon: Settings, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "RH_DP", "RH_PESSOAL", "COMPRADOR", "COMPRAS", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA", "COLABORADOR", "SUPERVISOR", "ENCARREGADO", "DIRETOR_UNIDADE"] },
  { id: "MANUAL", label: "Manual de Boas Práticas", icon: FileText, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "RH_DP", "RH_PESSOAL", "COMPRADOR", "COMPRAS", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA", "COLABORADOR", "SUPERVISOR", "ENCARREGADO", "DIRETOR_UNIDADE"] },
  { id: "DIRETOR", label: "Portal do Diretor", icon: UserCheck, roles: ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA", "DIRETOR_UNIDADE"] },
  { id: "CHAT", label: "Conversas / Chat", icon: MessageSquare, roles: ["ADMIN", "GERENTE", "GERENCIA", "ENCARREGADO", "RH_DP"] },
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
  const [originalDevUser, setOriginalDevUser] = useState<any>(null);
  const [reducaoGeral, setReducaoGeral] = useState(20);
  const [loading, setLoading] = useState(true);

  // Carrega dados do usuário logado e sincroniza com o banco para garantir campos novos (como secretaria)
  useEffect(() => {
    async function syncUser() {
      try {
        const impersonated = localStorage.getItem("impersonated_user");
        const saved = localStorage.getItem("crm_user");
        
        if (saved) {
          const localUser = JSON.parse(saved);
          
          // Se for um dev e estiver simulando alguém, o 'user' ativo será o simulado
          if (impersonated && localUser.nivel_acesso >= 4) {
            setOriginalDevUser(localUser);
            const impUser = JSON.parse(impersonated);
            const dbFuncao = impUser.cargo;
            const rawFuncao = dbFuncao 
              ? String(dbFuncao).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() 
              : null;
            const cargoResolvido = rawFuncao || (
              impUser.nivel_acesso >= 4 ? 'DEV' : 
              impUser.nivel_acesso >= 3 ? 'ADMIN' : 
              impUser.nivel_acesso >= 2 ? (
                (impUser.cargo || '').toUpperCase().includes('DIRETOR') || (impUser.cargo || '').toUpperCase().includes('FISCAL') 
                ? 'DIRETOR_UNIDADE' 
                : 'SUPERVISOR'
              ) : 'COLABORADOR'
            );
            setUser({ ...impUser, role: cargoResolvido });
            setLoading(false);
            return;
          }

          setUser(localUser);

          // Sincroniza com o banco para pegar campos novos (ex: secretaria)
          if (localUser.id || localUser.email) {
            const { data: dbUser } = await supabase
              .from('usuarios')
              .select('*')
              .or(`id.eq.${localUser.id},email.eq.${localUser.email}`)
              .single();
            
            if (dbUser) {
              const dbFuncao = dbUser.cargo;
              const rawFuncao = dbFuncao 
                ? String(dbFuncao).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() 
                : null;
              
              // Se a função for especial (Almoxarife, Comprador, etc), ela define o role
              // Caso contrário, usa o que vier do banco ou o nível de acesso
              const cargoResolvido = rawFuncao || (
                dbUser.nivel_acesso >= 4 ? 'DEV' : 
                dbUser.nivel_acesso >= 3 ? 'ADMIN' : 
                dbUser.nivel_acesso >= 2 ? (
                  (dbUser.cargo || '').toUpperCase().includes('DIRETOR') || (dbUser.cargo || '').toUpperCase().includes('FISCAL') 
                  ? 'DIRETOR_UNIDADE' 
                  : 'SUPERVISOR'
                ) : 'COLABORADOR'
              );
              
              const updatedUser = { 
                ...localUser, 
                ...dbUser, 
                role: cargoResolvido,
                funcao: dbFuncao 
              };
              setUser(updatedUser);
              localStorage.setItem("crm_user", JSON.stringify(updatedUser));

              // --- TELEMETRIA DE ACESSO ---
              const sessionKey = `acesso_contabilizado_${dbUser.id}`;
              if (!sessionStorage.getItem(sessionKey)) {
                await supabase.rpc('increment_user_access', { user_id: dbUser.id });
                // Fallback caso a RPC não exista ainda (incremento manual via update)
                await supabase.from('usuarios')
                  .update({ 
                    acessos_totais: (dbUser.acessos_totais || 0) + 1,
                    ultima_presenca: new Date().toISOString()
                  })
                  .eq('id', dbUser.id);
                sessionStorage.setItem(sessionKey, 'true');
              } else {
                // Apenas atualiza a presença
                await supabase.from('usuarios')
                  .update({ ultima_presenca: new Date().toISOString() })
                  .eq('id', dbUser.id);
              }
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

    // Heartbeat de Presença (a cada 5 minutos)
    const heartbeat = setInterval(async () => {
      const saved = localStorage.getItem("crm_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.id) {
          await supabase.from('usuarios')
            .update({ ultima_presenca: new Date().toISOString() })
            .eq('id', u.id);
        }
      }
    }, 1000 * 60 * 5);

    return () => clearInterval(heartbeat);
  }, []);

  // Lógica de Filtragem de Módulos (RBAC)
  const filteredModules = useMemo(() => {
    if (!user) return [];
    
    const safeRole = user?.role ? String(user.role).toUpperCase() : "";
    const nivel = user?.nivel || 0;
    
    // Unificação da lógica de permissão
    const isStrictRole = ["COMPRADOR", "COMPRAS", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA", "DIRETOR_UNIDADE", "DIRETORIA"].includes(safeRole);
    const isManager = !isStrictRole && (nivel >= 3 || ["ADMIN", "GERENTE", "GERENCIA"].includes(safeRole));
    
    return isManager
      ? ALL_MODULES
      : ALL_MODULES.filter(m => m.roles.includes(safeRole));
  }, [user]);

  // Sincroniza o módulo ativo caso venha um parâmetro via URL ou baseando-se nas permissões
  useEffect(() => {
    const safeRole = user?.role ? String(user.role).toUpperCase() : "";
    
    // 1. Prioridade: Parâmetro da URL (Validado contra permissões)
    if (modParam && filteredModules.some(m => m.id === modParam)) {
      setActiveModule(modParam);
    } 
    // 2. Se o parâmetro for COMMAND mas não tem acesso (ou se não houver parâmetro)
    else if (filteredModules.length > 0) {
      if (!activeModule) {
        // Prioridade para Comprador ir direto para Compras
        const hasCompras = filteredModules.find(m => m.id === "COMPRAS");
        if (hasCompras && (safeRole === "COMPRADOR" || safeRole === "COMPRAS")) {
          setActiveModule("COMPRAS");
        } else {
          setActiveModule(filteredModules[0].id);
        }
      } else if (filteredModules.length > 0 && !filteredModules.some(m => m.id === activeModule)) {
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
  const isManager = (user?.nivel || 0) >= 3 || ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA"].includes(safeRole);

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
            <p className="text-[10px] font-black text-[var(--brand)] uppercase tracking-widest">Portal Administrativo Alicerce V753.8</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Módulos agora são acessados exclusivamente via Sidebar para evitar redundância */}
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
            { activeModule === "COMPRAS" && <ComprasModule user={user} initialTab={tabParam as any} />}
            { activeModule === "ALMOXARIFADO" && <AlmoxarifadoModule reducao={reducaoGeral} setReducao={setReducaoGeral} /> }
            { activeModule === "OPERACIONAL" && <OperacionalModule user={user} /> }
            { activeModule === "OCORRENCIAS" && <OcorrenciasModule user={user} /> }
            { activeModule === "SETTINGS" && <ConfiguracoesModule user={user} /> }
            { activeModule === "MANUAL" && <ManualModule /> }
            { activeModule === "DIRETOR" && <DiretorModule user={user} /> }
            { activeModule === "CHAT" && <ChatModule user={user} />}
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

      {/* FERRAMENTA DE SIMULAÇÃO (GOD MODE) */}
      <DevImpersonator 
        originalUser={originalDevUser || user} 
        onImpersonate={(u) => setUser(u)}
        onStop={() => {
          setOriginalDevUser(null);
          const saved = localStorage.getItem("crm_user");
          if (saved) setUser(JSON.parse(saved));
        }}
      />

    </div>
  );
}
