"use client";
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Package, UserPlus, CheckCircle, Truck, FileText, MapPin } from 'lucide-react';
import GlobalActionsModals from './GlobalActionsModals';

interface QuickActionsProps {
  user: {
    role: string;
    nivel: number;
  };
}

export default function QuickActions({ user }: QuickActionsProps) {
  const [modalActive, setModalActive] = useState<string | null>(null);
  const isAdmin = user.role === 'ADMIN' || user.role === 'DIRETORIA' || user.nivel === 4;
  const isAlmoxarifado = user.role === 'ALMOXARIFE' || isAdmin;
  const isRH = user.role === 'RH_DP' || user.role === 'RH_PESSOAL' || user.role === 'RH_SECRETARIA' || isAdmin;
  const isEncarregado = user.role === 'ENCARREGADO' || isAdmin;
  const isDiretor = user.role === 'DIRETOR' || isAdmin;

  const actions = [
    {
      id: 'abrir-ocorrencia',
      label: 'Abrir Ocorrência',
      icon: AlertTriangle,
      color: 'var(--danger)',
      allowed: true, // Shared by all
      onClick: () => setModalActive('abrir-ocorrencia')
    },
    {
      id: 'checkin-unidade',
      label: 'Check-in Unidade',
      icon: MapPin,
      color: 'var(--brand)',
      allowed: isEncarregado,
      onClick: () => setModalActive('checkin-unidade')
    },
    {
      id: 'solicitar-reposicao',
      label: 'Pedir Reposição',
      icon: Truck,
      color: 'var(--info)',
      allowed: isEncarregado || isAlmoxarifado,
      onClick: () => setModalActive('solicitar-reposicao')
    },
    {
      id: 'entrega-epi',
      label: 'Entrega de EPI',
      icon: Shield,
      color: 'var(--brand)',
      allowed: user.role !== 'DIRETOR' && user.role !== 'COMPRADOR' && user.role !== 'RH_SECRETARIA', 
      onClick: () => setModalActive('entregar-epi')
    },
    {
      id: 'informar-abono',
      label: 'Gerar Abono / Feriado',
      icon: CheckCircle,
      color: 'var(--success)',
      allowed: isRH || isDiretor,
      onClick: () => setModalActive('informar-abono')
    },
    {
      id: 'estoque-epi',
      label: 'Estoque EPI',
      icon: Package,
      color: 'var(--info)',
      allowed: isAlmoxarifado,
      onClick: () => window.location.href = '/dashboard/almoxarifado'
    },
    {
      id: 'aprovacao-req',
      label: 'Aprovar Requisição',
      icon: CheckCircle,
      color: 'var(--success)',
      allowed: isAlmoxarifado,
      onClick: () => window.location.href = '/dashboard/compras'
    },
    {
      id: 'informar-entrega',
      label: 'Informar Entrega',
      icon: Truck,
      color: 'var(--brand)',
      allowed: isAlmoxarifado,
      onClick: () => window.location.href = '/dashboard/compras'
    },
    {
      id: 'admissao',
      label: 'Admissão Master',
      icon: UserPlus,
      color: 'var(--info)',
      allowed: isRH,
      onClick: () => setModalActive('admissao')
    },
    {
      id: 'relatorios',
      label: 'Relatórios',
      icon: FileText,
      color: 'var(--text-secondary)',
      allowed: true,
      onClick: () => window.location.href = '/dashboard/relatorios'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4 mb-8">
      {actions.filter(a => a.allowed).map(action => (
        <button 
          key={action.id}
          onClick={action.onClick}
          className="card p-4 flex flex-col items-center justify-center gap-3 group hover:border-[var(--brand)] transition-all text-center min-h-[120px]"
        >
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
            style={{ background: `${action.color}15`, color: action.color }}
          >
            <action.icon size={24} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{action.label}</span>
        </button>
      ))}

      {/* Modais Globais de Ação */}
      <GlobalActionsModals 
        modalActive={modalActive} 
        onClose={() => setModalActive(null)} 
        user={user} 
      />
    </div>
  );
}
