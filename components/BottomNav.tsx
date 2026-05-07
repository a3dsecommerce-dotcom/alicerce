"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ShieldAlert, Package, Settings,
  AlertTriangle, MapPin, CalendarDays, ShieldCheck
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Início",      icon: LayoutDashboard, href: "/dashboard",             exact: true },
  { label: "Ocorrências", icon: AlertTriangle,   href: "/dashboard/ocorrencias"              },
  { label: "Rota",        icon: MapPin,           href: "/dashboard/rota"                     },
  { label: "Reuniões",    icon: CalendarDays,     href: "/dashboard/reunioes"                 },
  { label: "RH",          icon: Users,            href: "/dashboard/rh"                       },
  { label: "Suprimentos", icon: Package,          href: "/dashboard/almoxarifado"             },
  { label: "Segurança",   icon: ShieldCheck,      href: "/dashboard/seguranca"                },
  { label: "Gestão",      icon: ShieldAlert,      href: "/dashboard/admin/gestao"             },
  { label: "Config",      icon: Settings,         href: "/dashboard/config"                   },
];

export function BottomNav() {
  const pathname = usePathname();

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
          {NAV_ITEMS.map((item) => {
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
