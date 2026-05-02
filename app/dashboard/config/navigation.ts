import { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Building2, Package, ShieldAlert, ShieldCheck, FileText, ShoppingCart, Truck, Zap, AlertTriangle, Clock } from 'lucide-react';

export type NavItem = {
  href?: string;
  icon?: LucideIcon;
  label: string;
  roles: string[];
  subItems?: NavItem[];
};

export const ALL_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    href: '/dashboard?module=COMMAND&tab=OVERVIEW'
  },
  {
    label: 'Gestão de Ponto',
    icon: Clock,
    roles: ['SUPERVISOR', 'GERENTE', 'ENCARREGADO', 'ADMIN', 'DIRETORIA'],
    href: '/dashboard/ponto'
  },
  {
    label: 'Central de Ocorrências',
    icon: AlertTriangle,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP', 'ALMOXARIFE', 'DIRETOR', 'RH_SECRETARIA'],
    href: '/dashboard/ocorrencias'
  },
  {
    label: 'Canal de Ética',
    icon: ShieldAlert,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    href: '/dashboard?module=COMMAND&tab=ETHICS'
  },
  {
    label: 'Gestão de Campo',
    icon: Truck,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    href: '/dashboard?module=COMMAND&tab=OPERACIONAL'
  },
  {
    label: 'Recursos Humanos',
    icon: Users,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP', 'RH_PESSOAL'],
    href: '/dashboard?module=COMMAND&tab=RH_FULL'
  },
  {
    label: 'Configurações',
    icon: Settings,
    roles: ['ADMIN', 'DIRETORIA'],
    href: '/dashboard?module=SETTINGS'
  }
];
