"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldAlert, Package, Settings,
  AlertTriangle, MapPin, CalendarDays, ShieldCheck
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Início",      icon: LayoutDashboard, href: "/dashboard",              exact: true, roles: ["ALL"] },
  { label: "Ocorrências", icon: AlertTriangle,   href: "/dashboard/ocorrencias",               roles: ["ALL"] },
  { label: "Rota",        icon: MapPin,           href: "/dashboard/rota",                      roles: ["ALL"] },
  { label: "Reuniões",    icon: CalendarDays,     href: "/dashboard/reunioes",                  roles: ["ADMIN", "GERENTE", "DIRETORIA"] },
  { label: "RH",          icon: Users,            href: "/dashboard/rh",                        roles: ["ADMIN", "GERENTE", "DIRETORIA", "RH_DP"] },
  { label: "Suprimentos", icon: Package,          href: "/dashboard/almoxarifado",              roles: ["ADMIN", "GERENTE", "DIRETORIA", "ALMOXARIFADO", "ALMOXARIFE", "COMPRAS", "COMPRADOR"] },
  { label: "Segurança",   icon: ShieldCheck,      href: "/dashboard/seguranca",                 roles: ["ADMIN", "GERENTE", "DIRETORIA", "TECNICO_SEGURANCA"] },
  { label: "Gestão",      icon: ShieldAlert,      href: "/dashboard?module=COMMAND",            roles: ["ADMIN", "GERENTE", "DIRETORIA"] },
  { label: "Config",      icon: Settings,         href: "/dashboard/config",                    roles: ["ADMIN", "GERENTE", "DIRETORIA"] },
];

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (err) {}
  }, []);

  const safeRole = user?.role ? String(user.role).toUpperCase() : "";
  const isManager = (user?.nivel || 0) >= 3 || ["ADMIN", "DIRETORIA", "GERENTE", "GERENCIA"].includes(safeRole);

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (item.roles.includes("ALL")) return true;
    if (isManager) return true;
    return item.roles.includes(safeRole);
  });

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="flex overflow-x-auto py-1 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        <div className="flex gap-0.5 mx-auto">
          {filteredItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname !== "/dashboard" && pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                  isActive
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "text-[var(--text-muted)] active:bg-[var(--bg-card)]"
                }`}
                style={{ minWidth: "60px", height: "52px", padding: "0 8px" }}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span style={{ fontSize: "9px", fontWeight: 500, lineHeight: 1, whiteSpace: "nowrap" }}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
