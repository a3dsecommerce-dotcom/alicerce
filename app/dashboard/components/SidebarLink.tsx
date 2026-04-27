import Link from "next/link";
import { memo } from "react";

type SidebarLinkProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }> | null;
  active: boolean;
  sidebarOpen: boolean;
  disabled?: boolean;
};

function SidebarLink({ href, label, Icon, active, sidebarOpen, disabled }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`sidebar-link flex items-center justify-center gap-4 h-12 px-6 rounded-lg text-[0.95rem] font-black no-underline transition-all ${
        disabled 
          ? "opacity-20 grayscale cursor-default pointer-events-none" 
          : active 
            ? "bg-[var(--brand)]/10 text-[var(--brand)] active shadow-sm" 
            : "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
      }`}
    >
      {Icon && <Icon size={20} className="shrink-0" />}
      {sidebarOpen && <span className="whitespace-nowrap truncate">{label}</span>}
    </Link>
  );
}

export default memo(SidebarLink);
