import Link from "next/link";
import { memo } from "react";

type SidebarLinkProps = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }> | null;
  active: boolean;
  sidebarOpen: boolean;
  disabled?: boolean;
  badge?: number;
};

function SidebarLink({ href, label, Icon, active, sidebarOpen, disabled, badge }: SidebarLinkProps) {
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
      {/* Icon with optional urgency badge — Fix #7 */}
      <div className="relative shrink-0">
        {Icon && <Icon size={20} />}
        {(badge ?? 0) > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center px-1 shadow-sm">
            {badge! > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {sidebarOpen && <span className="whitespace-nowrap truncate">{label}</span>}
    </Link>
  );
}

export default memo(SidebarLink);
