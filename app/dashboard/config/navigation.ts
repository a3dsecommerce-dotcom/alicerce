import { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, Building2, Package, ShieldAlert, ShieldCheck, FileText, ShoppingCart, ShoppingBag, Truck, Zap, AlertTriangle, Clock, Settings, MapPin, MessageSquare } from 'lucide-react';

export type NavItem = {
  href?: string;
  icon?: LucideIcon;
  label: string;
  roles: string[];
  subItems?: NavItem[];
};

export const ALL_NAV: NavItem[] = [
  {
    label: 'Conversas / Chat',
    icon: MessageSquare,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'ENCARREGADO', 'RH_DP'],
    href: '/dashboard?module=CHAT'
  },
  {
    label: 'Painel de Controle',
    icon: LayoutDashboard,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'ENCARREGADO'],
    href: '/dashboard?module=COMMAND'
  },
  {
    label: 'Catálogo de Compras',
    icon: ShoppingBag,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'COMPRADOR', 'COMPRAS'],
    href: '/dashboard?module=COMPRAS&tab=CATALOGO'
  },
  {
    label: 'Acompanhamento de Pedidos',
    icon: Truck,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'COMPRADOR', 'COMPRAS'],
    href: '/dashboard?module=COMPRAS&tab=TRACKING'
  },
  {
    label: 'Almoxarifado',
    icon: Package,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'ALMOXARIFE', 'ALMOXARIFADO'],
    href: '/dashboard?module=ALMOXARIFADO'
  },
  {
    label: 'Recursos Humanos',
    icon: Users,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'RH_DP'],
    href: '/dashboard?module=RH'
  },
  {
    label: 'Escala de Volantes',
    icon: Truck,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA'],
    href: '/dashboard?module=COMMAND&tab=VOLANTES'
  },
  {
    label: 'Gestão de Rotas',
    icon: MapPin,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA'],
    href: '/dashboard?module=COMMAND&tab=ROTAS'
  },
  {
    label: 'Central de Ocorrências',
    icon: AlertTriangle,
    roles: ['DEV', 'ADMIN', 'GERENTE', 'GERENCIA', 'RH_DP', 'ALMOXARIFE', 'ALMOXARIFADO', 'ENCARREGADO'],
    href: '/dashboard?module=OCORRENCIAS'
  },
  {
    label: 'Gestão de Ponto',
    icon: Clock,
    roles: ['DEV', 'SUPERVISOR', 'ENCARREGADO', 'GERENTE', 'GERENCIA', 'ADMIN'],
    href: '/dashboard/rh/ponto'
  },
  {
    label: 'Manual de Boas Práticas',
    icon: FileText,
    roles: ['DEV', 'ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA', 'RH_DP', 'COMPRADOR', 'COMPRAS', 'ALMOXARIFE', 'ALMOXARIFADO', 'SUPERVISOR', 'ENCARREGADO', 'COLABORADOR', 'DIRETOR_UNIDADE'],
    href: '/dashboard?module=MANUAL'
  },
  {
    label: 'Portal do Diretor',
    icon: Building2,
    roles: ['DEV', 'ADMIN', 'DIRETOR_UNIDADE', 'DIRETORIA', 'GERENTE', 'GERENCIA'],
    href: '/dashboard?module=DIRETOR'
  },
  {
    label: 'Segurança (SST)',
    icon: ShieldCheck,
    roles: ['DEV', 'ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA', 'TECNICO_SEGURANCA'],
    href: '/dashboard?module=SST'
  },
  {
    label: 'Configurações',
    icon: Settings,
    roles: ['DEV', 'ADMIN', 'DIRETORIA', 'GERENTE', 'GERENCIA', 'RH_DP', 'COMPRADOR', 'COMPRAS', 'ALMOXARIFE', 'ALMOXARIFADO', 'TECNICO_SEGURANCA', 'SUPERVISOR', 'ENCARREGADO', 'COLABORADOR', 'DIRETOR_UNIDADE'],
    href: '/dashboard?module=SETTINGS'
  }
];
