"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useOperacionalData(user?: any) {
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUnidades: 0,
    ticketsAtivos: 0,
    ticketsAtrasados: 0,
    efetivoTotal: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const isEncarregado = user?.role === 'ENCARREGADO';
      
      // 1. Unidades
      let unitData: any[] = [];
      if (isEncarregado) {
        const { data: mapping } = await supabase.from('gestao_rotas').select('unidade_nome').eq('encarregado_id', user.id);
        const names = mapping?.map(m => m.unidade_nome) || [];
        const { data: units } = await supabase.from('unidades').select('*').in('nome', names).order('nome');
        unitData = units || [];
      } else {
        const { data: units } = await supabase.from('unidades').select('*').order('nome');
        unitData = units || [];
      }
      setUnidades(unitData);

      // 2. Colaboradores (Equipe)
      if (unitData.length > 0) {
        const unitNames = unitData.map(u => u.nome);
        const { data: colabs } = await supabase.from('usuarios').select('*').in('unidade_alocacao', unitNames);
        setColaboradores(colabs || []);
      }

      // 3. Tickets do Setor Operacional
      let ticketQuery = supabase.from('tickets_sla').select('*').neq('status', 'RESOLVIDO');
      
      if (isEncarregado) {
        const unitNames = unitData.map(u => u.nome);
        ticketQuery = ticketQuery.in('unidade', unitNames);
      } else {
        ticketQuery = ticketQuery.in('setor_destino', ['Gerência Operacional', 'Encarregado', 'Gerência Regional']);
      }

      const { data: ticketData } = await ticketQuery;
      setTickets(ticketData || []);

      // 4. Estatísticas
      const atrasados = (ticketData || []).filter(t => {
        const abertura = new Date(t.data_abertura);
        const agora = new Date();
        const diffHrs = (agora.getTime() - abertura.getTime()) / (1000 * 60 * 60);
        return diffHrs > (t.prazo_estipulado_dias || 1) * 24;
      }).length;

      setStats({
        totalUnidades: unitData?.length || 0,
        ticketsAtivos: ticketData?.length || 0,
        ticketsAtrasados: atrasados,
        efetivoTotal: isEncarregado ? (colaboradores.length || 0) : 0 // Will be updated by state next cycle or calculated here
      });

    } catch (err) {
      console.error("Erro no fetch operacional:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { loading, unidades, colaboradores, tickets, stats, refresh: fetchData };
}
