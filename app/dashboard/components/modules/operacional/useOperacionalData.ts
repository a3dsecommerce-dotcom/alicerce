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
        // Busca direta na tabela de unidades pelo ID do encarregado vinculado
        const { data: units, error } = await supabase.from('unidades').select('*').eq('encarregado_id', user.id).order('nome');
        if (error && process.env.NODE_ENV === 'development') console.error("Erro ao buscar unidades:", error);
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
      if (process.env.NODE_ENV === 'development') console.error("Erro no fetch operacional:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { loading, unidades, colaboradores, tickets, stats, refresh: fetchData };
}
