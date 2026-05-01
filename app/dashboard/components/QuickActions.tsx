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
      id: 'checkin-unidade',
      label: 'Check-in Unidade',
      icon: MapPin,
      color: 'var(--brand)',
      allowed: isEncarregado,
      onClick: () => setModalActive('checkin-unidade')
    },
    {
      id: 'informar-abono',
      label: 'Gerar Abono / Feriado',
      icon: CheckCircle,
      color: 'var(--success)',
      allowed: isEncarregado || isDiretor,
      onClick: () => setModalActive('informar-abono')
    },
    {
      id: 'admissao',
      label: 'Admissão Master',
      icon: UserPlus,
      color: 'var(--info)',
      allowed: isRH,
      onClick: () => setModalActive('admissao')
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
