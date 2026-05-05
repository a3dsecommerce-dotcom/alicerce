"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, AlertTriangle, Package, DollarSign,
  BarChart3, Settings, Bell, Search, ChevronDown, LogOut,
  Building2, Cpu, Menu, X, Megaphone, ShieldAlert, ShieldCheck
} from "lucide-react";

import { ALL_NAV } from "./config/navigation";
import SidebarLink from "./components/SidebarLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BottomNav } from "@/components/BottomNav";
import { n8n } from "@/lib/n8n";
import { Toaster } from "sonner";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [denunciaOpen, setDenunciaOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    "RH Central": true,
    "Prefeitura (PMG)": true,
    "Operacional": true,
    "Segurança do Trabalho": true,
    "Gestor / Admin": false
  });
  const [user, setUser] = useState({ name: "Diretoria", role: "ADMIN" });

  useEffect(() => {
    async function syncUser() {
      try {
        const saved = localStorage.getItem("crm_user");
        if (saved) {
          const localUser = JSON.parse(saved);
          setUser(localUser);

          // Sincroniza com o banco para garantir campos novos e role calculado
          if (localUser.id || localUser.email) {
            const { data: dbUser } = await supabase
              .from('usuarios')
              .select('*')
              .or(`id.eq.${localUser.id},email.eq.${localUser.email}`)
              .single();
            
            if (dbUser) {
              const dbFuncao = dbUser.cargo;
              const rawFuncao = dbFuncao 
                ? String(dbFuncao).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                : null;
              
              // Se a função for especial (Almoxarife, Comprador, etc), ela define o role
              // Caso contrário, usa o que vier do banco ou o nível de acesso
              const cargoResolvido = rawFuncao || (dbUser.nivel_acesso >= 4 ? 'ADMIN' : dbUser.nivel_acesso >= 3 ? 'GERENTE' : dbUser.nivel_acesso >= 2 ? 'SUPERVISOR' : 'COLABORADOR');
              
              const updatedUser = { 
                ...localUser, 
                ...dbUser, 
                role: cargoResolvido,
                funcao: dbFuncao 
              };
              setUser(updatedUser);
              localStorage.setItem("crm_user", JSON.stringify(updatedUser));
            }
          }
        }
      } catch (err) {
        console.error("Erro ao sincronizar usuário no layout:", err);
      }
    }
    syncUser();
  }, []);

  // Agora mostramos todos os itens, mas controlamos quem está "aceso"
  const nav = useMemo(() => ALL_NAV, []);

  const toggleMenu = useCallback((label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const [notificacoes, setNotificacoes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifs() {
       if (!user?.id) return;
       const safeRole = String(user.role || '').toUpperCase();
       
       try {
         const { data: dbNotifs, error } = await supabase
           .from('notificacoes')
           .select('*')
           .or(`user_id.eq.${user.id},setor_destino.eq.${user.secretaria || 'Setor Geral'}`)
           .eq('lida', false)
           .order('created_at', { ascending: false })
           .limit(10);
         
         if (dbNotifs && dbNotifs.length > 0) {
            setNotificacoes(dbNotifs.map(n => ({
               id: n.id,
               text: n.mensagem,
               type: n.tipo || 'info',
               time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               title: n.titulo
            })));
         } else {
            setNotificacoes([{ text: "Nenhuma notificação nova", type: "info", time: "--" }]);
         }
       } catch (err) {
         console.error("Erro ao carregar notificações reais", err);
       }
    }
    fetchNotifs();
    
    // Refresh a cada 1 minuto para ser mais dinâmico
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden p-4 gap-4 relative z-10">
      {/* SIDEBAR - GLASS STYLE */}
      <aside 
        className={`no-print hidden lg:flex flex-col glass border border-[var(--border)] transition-all duration-500 ease-in-out z-50 shadow-xl rounded-lg ml-4 my-2 ${sidebarOpen ? "w-[300px]" : "w-[90px]"}`}
      >
        {/* Logo - Alinhado com pl-12 */}
        <div className="pl-12 pr-6 border-b border-[var(--border)] flex items-center gap-4 h-[70px]">
          <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-sm overflow-hidden p-1">
            <img src="/logo.png" alt="Alicerce Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden animate-fade-in">
              <div className="text-[1rem] font-black text-[var(--text-primary)] leading-none">Alicerce</div>
              <div className="text-[0.65rem] font-bold text-[var(--brand)] tracking-widest uppercase mt-1">CRM Operacional</div>
            </div>
          )}
        </div>

        {/* Toggle & Search */}
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-md hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav List - Filtragem por Role (RBAC) */}
        <nav className="flex-1 px-6 flex flex-col gap-2 overflow-y-auto custom-scrollbar pb-6 mt-4">
          {nav.filter(item => {
            const safeRole = user?.role ? String(user.role).toUpperCase() : '';
            const isStrictRole = ["COMPRADOR", "COMPRAS", "ALMOXARIFE", "ALMOXARIFADO", "TECNICO_SEGURANCA"].includes(safeRole);
            const isManager = !isStrictRole && ((user?.nivel || 0) >= 3 || ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA"].includes(safeRole));
            return isManager || item.roles.includes(safeRole);
          }).map(item => {
            const safeRole = user?.role ? String(user.role).toUpperCase() : '';
            const isManager = (user?.nivel || 0) >= 3 || ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA"].includes(safeRole);
            if (item.subItems) {
              const isOpen = openMenus[item.label] && sidebarOpen;
              const hasActiveSub = item.subItems.some(sub => pathname === sub.href);
              const permittedSubItems = item.subItems.filter(sub => isManager || sub.roles.includes(safeRole));

              if (permittedSubItems.length === 0) return null;
              
              return (
                <div key={item.label} className="mb-1">
                  <button 
                    onClick={() => toggleMenu(item.label)}
                    className={`sidebar-link w-full group justify-center ${hasActiveSub && !isOpen ? "active" : ""}`}
                  >
                    {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                    {sidebarOpen && (
                      <>
                        <span className="font-black text-[0.95rem] mx-4">{item.label}</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                      </>
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="mt-1 flex flex-col gap-1 animate-fade-in">
                      {permittedSubItems.map(sub => (
                        <SidebarLink
                          key={sub.href}
                          href={sub.href!}
                          label={sub.label}
                          Icon={null}
                          active={pathname === sub.href}
                          sidebarOpen={sidebarOpen}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <SidebarLink
                key={item.href}
                href={item.href!}
                label={item.label}
                Icon={item.icon}
                active={pathname === item.href}
                sidebarOpen={sidebarOpen}
              />
            );
          })}
        </nav>

        {/* User Card - Alinhado com pl-12 */}
        <div className="pl-12 pr-6 py-6 border-t border-[var(--border)] glass-bg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white font-black text-sm shadow-lg shadow-[var(--brand)]/20 flex-shrink-0">
              {(user?.name || user?.nome || "U").charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <div className="text-[0.85rem] font-black text-[var(--text-primary)] truncate">{user?.name || user?.nome || "Usuário"}</div>
                <div className="text-[0.65rem] font-bold text-[var(--text-muted)] uppercase">{user?.role || "ADMIN"}</div>
              </div>
            )}
            {sidebarOpen && (
              <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors p-1">
                <LogOut size={16} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative glass rounded-[2rem] border border-[var(--border)] shadow-xl mr-4 my-2">
        {/* TOPBAR - COM PROTEÇÃO DE BORDA DIREITA */}
        <header className="no-print h-[80px] flex items-center px-10 lg:px-14 gap-8 glass z-40 border-b border-[var(--border)]">
          {(!user?.role || !["COMPRADOR", "COMPRAS"].includes(String(user.role).toUpperCase())) && (
            <div className="hidden md:flex flex-1 max-w-[480px] relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--brand)] transition-colors" />
              <input 
                className="input-field w-full pl-11 bg-[var(--bg-base)]/50 focus:bg-[var(--bg-card)]" 
                placeholder="Pesquisar por colaborador, unidade ou chamado..." 
              />
            </div>
          )}

          <div className="flex-1" />

          {/* Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Settings Quick Access */}
            <Link 
              href="/dashboard?module=SETTINGS" 
              className="w-10 h-10 flex items-center justify-center rounded-xl glass hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] transition-all"
              title="Configurações"
            >
              <Settings size={18} />
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setNotifOpen(!notifOpen)} 
                className="w-10 h-10 flex items-center justify-center rounded-xl glass hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] relative transition-all"
              >
                <Bell size={18} />
                {notificacoes.length > 0 && notificacoes[0].time !== '--' && (
                  <span className="absolute -top-1 -right-1 bg-[var(--danger)] text-white text-[0.6rem] font-black w-5 h-5 rounded-lg flex items-center justify-center shadow-lg shadow-[var(--danger)]/30 animate-bounce">
                    {notificacoes.length}
                  </span>
                )}
              </button>
              
              {notifOpen && (
                <div className="absolute right-0 top-[calc(100%+12px)] w-[320px] glass rounded-2xl shadow-2xl z-[100] animate-fade-in overflow-hidden border border-[var(--glass-border)]">
                  <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-white/5">
                    <span className="font-black text-[0.85rem] uppercase tracking-wider">Notificações</span>
                    <span className="badge badge-red">Recentes</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notificacoes.map((n, i) => (
                      <div key={i} className="p-4 border-b border-[var(--border)] last:border-none flex gap-3 items-start hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'danger' ? 'bg-[var(--danger)]' : n.type === 'warning' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`} />
                        <div>
                          <p className="text-[0.85rem] font-medium text-[var(--text-primary)] leading-tight">{n.text}</p>
                          <span className="text-[0.7rem] font-bold text-[var(--text-muted)] uppercase mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full p-3 text-center text-[0.7rem] font-black uppercase text-[var(--brand)] hover:bg-[var(--bg-card-hover)] transition-colors">
                    Ver Tudo
                  </button>
                </div>
              )}
            </div>

            {/* Status do Sistema */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-[var(--success)]/20 text-[0.7rem] font-black text-[var(--success)] uppercase">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              Operacional
            </div>

            {/* Denúncia */}
            <button 
              onClick={() => setDenunciaOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-[0.75rem] font-black uppercase flex items-center gap-2 hover:bg-[var(--danger)] hover:text-white transition-all shadow-sm mr-4"
            >
              <Megaphone size={15} /> Denunciar
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN VIEW - EQUILÍBRIO REAL */}
        <main className="flex-1 overflow-y-auto relative p-8 lg:p-12 bg-gradient-to-br from-transparent to-[var(--brand)]/5 scroll-smooth">
          <div className="max-w-[1600px] mx-auto animate-fade-in flex flex-col gap-12">
            {children}
          </div>
        </main>
      </div>

      {/* MODAL: DENÚNCIA (PT-BR HARMONIZED) */}
      {denunciaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1000] p-4">
          <div className="card w-full max-w-[500px] p-8 shadow-2xl animate-fade-in border-t-4 border-t-[var(--danger)]">
            <div className="flex gap-4 items-center mb-8">
              <div className="w-12 h-12 bg-[var(--danger)]/10 rounded-2xl flex items-center justify-center text-[var(--danger)]">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-[var(--text-primary)]">Canal de Ética</h2>
                <p className="text-[0.8rem] font-medium text-[var(--text-muted)]">Sua denúncia é 100% anônima e criptografada.</p>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Natureza do Relato</label>
                <select className="input-field w-full appearance-none">
                  <option>Conduta Ética / Assédio</option>
                  <option>Fraude / Desvio de Patrimônio</option>
                  <option>Segurança do Trabalho (Risco)</option>
                  <option>Irregularidade Operacional</option>
                </select>
              </div>
              <div>
                <label className="text-[0.7rem] font-black text-[var(--text-muted)] uppercase mb-2 block">Detalhamento dos Fatos</label>
                <textarea 
                  className="input-field w-full min-h-[150px] resize-none" 
                  placeholder="Por favor, relate o ocorrido com o máximo de detalhes possível (nomes, locais, datas)..."
                />
              </div>
              <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-dashed border-[var(--border)] flex items-start gap-3">
                <ShieldCheck size={18} className="text-[var(--success)] shrink-0" />
                <p className="text-[0.7rem] font-medium text-[var(--text-secondary)]">Este canal é gerido por um comitê independente. O anonimato é garantido por lei e política interna.</p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button className="flex-1 btn-ghost" onClick={() => setDenunciaOpen(false)}>Cancelar</button>
              <button 
                className="flex-1 btn-brand !bg-[var(--danger)] shadow-[var(--danger)]/20" 
                onClick={() => { n8n.trigger('denuncia-anonima', { data: new Date() }); alert("Protocolo registrado com sucesso."); setDenunciaOpen(false); }}
              >
                Enviar Protocolo
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
      <Toaster position="top-right" richColors />
    </div>
  );
}

