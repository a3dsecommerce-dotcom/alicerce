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
    label: 'Painel de Controle',
    icon: ShieldAlert,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE'],
    subItems: [
      { href: '/dashboard?module=COMMAND&tab=OVERVIEW', label: 'Centro de Comando', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=RH_FULL', label: 'Recursos Humanos', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=OPERACIONAL', label: 'Gestão de Campo', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=INTEL_BI', label: 'Inteligência de Dados', icon: Zap, roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=COMMS', label: 'Comunicados Master', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=ETHICS', label: 'Canal de Ética', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=FINANCE', label: 'Financeiro Master', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
      { href: '/dashboard?module=COMMAND&tab=DOCS', label: 'Relatórios & Documentos', roles: ['ADMIN', 'DIRETORIA', 'GERENTE'] },
    ],
  },
  {
    label: 'Prefeitura',
    icon: Building2,
    roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP', 'DIRETOR', 'RH_SECRETARIA'],
    subItems: [
      { href: '/dashboard/rh/prefeitura', label: 'Indicadores RH PMG', roles: ['ADMIN', 'DIRETORIA', 'RH_DP', 'RH_SECRETARIA'] },
      { href: '/dashboard/unidade', label: 'Portal do Diretor', roles: ['ADMIN', 'DIRETOR', 'RH_SECRETARIA'] },
    ],
  },
  {
    label: 'Compras',
    icon: ShoppingCart,
    roles: ['ADMIN', 'COMPRADOR', 'DIRETORIA'],
    href: '/dashboard?module=COMPRAS'
  },
  {
    label: 'RH Pessoal',
    icon: Users,
    roles: ['RH_DP', 'RH_PESSOAL', 'ADMIN'],
    subItems: [
      { href: '/dashboard/rh/pessoal', label: 'Dep. Pessoal (DP)', roles: ['RH_DP', 'ADMIN'] },
    ],
  },
  {
    label: 'Gestão de Ponto',
    icon: Clock,
    roles: ['SUPERVISOR', 'GERENTE', 'ENCARREGADO', 'ADMIN', 'RH_DP'],
    href: '/dashboard/rh/ponto'
  },
  {
    label: 'Almoxarifado',
    icon: Package,
    roles: ['ALMOXARIFE'],
    href: '/dashboard?module=ALMOXARIFADO'
  },
  {
    label: 'Segurança do Trabalho',
    icon: ShieldCheck,
    roles: ['TECNICO_SEGURANCA'],
    subItems: [
      { href: '/dashboard/seguranca/epis', label: 'Gestão de EPIs', roles: ['TECNICO_SEGURANCA'] },
    ],
  },
  { href: '/dashboard/ocorrencias', icon: AlertTriangle, label: 'Central de Ocorrências', roles: ['ADMIN', 'DIRETORIA', 'GERENTE', 'RH_DP', 'ALMOXARIFE', 'DIRETOR', 'RH_SECRETARIA'] },
];
