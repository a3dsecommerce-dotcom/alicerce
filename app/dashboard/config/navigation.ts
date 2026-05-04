import { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Building2, Package, ShieldAlert, ShieldCheck, FileText, ShoppingCart, Truck, Zap, AlertTriangle, Clock, Settings, MapPin } from 'lucide-react';

export type NavItem = {
  href?: string;
  icon?: LucideIcon;
  label: string;
  roles: string[];
  subItems?: NavItem[];
};

export const ALL_NAV: NavItem[] = [
  {
    label: 'Visão Geral',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA', 'ENCARREGADO', 'COMPRADOR', 'COMPRAS', 'ALMOXARIFE', 'ALMOXARIFADO'],
    href: '/dashboard?module=COMMAND&tab=VISAO'
  },
  {
    label: 'Operacional',
    icon: Truck,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA'],
    href: '/dashboard?module=OPERACIONAL'
  },
  {
    label: 'Gestão de Compras',
    icon: ShoppingCart,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA', 'COMPRADOR', 'COMPRAS'],
    href: '/dashboard?module=COMPRAS'
  },
  {
    label: 'Almoxarifado',
    icon: Package,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'ALMOXARIFE', 'ALMOXARIFADO'],
    href: '/dashboard?module=ALMOXARIFADO'
  },
  {
    label: 'Recursos Humanos',
    icon: Users,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP'],
    href: '/dashboard?module=RH'
  },
  {
    label: 'Auditoria & Seg.',
    icon: ShieldAlert,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    href: '/dashboard?module=COMMAND&tab=AUDITORIA'
  },
  {
    label: 'Gestão de Rotas',
    icon: MapPin,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    href: '/dashboard?module=COMMAND&tab=ROTAS'
  },
  {
    label: 'Central de Ocorrências',
    icon: AlertTriangle,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP', 'ALMOXARIFE', 'ALMOXARIFADO', 'DIRETOR', 'ENCARREGADO'],
    href: '/dashboard?module=OCORRENCIAS'
  },
  {
    label: 'Gestão de Ponto',
    icon: Clock,
    roles: ['SUPERVISOR', 'GERENTE', 'ADMIN', 'DIRETORIA'],
    href: '/dashboard/ponto'
  }
];
