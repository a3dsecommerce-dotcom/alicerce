"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Package, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Gestão", icon: ShieldAlert, href: "/dashboard/admin/gestao" },
    { label: "RH", icon: Users, href: "/dashboard/rh" },
    { label: "Suprimentos", icon: Package, href: "/dashboard/almoxarifado" },
    { label: "Configs", icon: Settings, href: "/dashboard/config" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] px-4 pb-[env(safe-area-inset-bottom)] pt-2 z-[100] backdrop-blur-lg bg-opacity-80">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${isActive ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}
            >
              <item.icon size={20} className={isActive ? "animate-pulse-brand" : ""} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
