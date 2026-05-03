"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useOperacionalData() {
  const [loading, setLoading] = useState(true);
  const [unidades, setUnidades] = useState<any[]>([]);
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
      // 1. Unidades
      const { data: unitData } = await supabase.from('unidades').select('*').order('nome');
      setUnidades(unitData || []);

      // 2. Tickets do Setor Operacional
      const { data: ticketData } = await supabase
        .from('tickets_sla')
        .select('*')
        .in('setor_destino', ['Gerência Operacional', 'Encarregado', 'Gerência Regional'])
        .neq('status', 'RESOLVIDO');
      setTickets(ticketData || []);

      // 3. Estatísticas
      const { count: colabCount } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'ATIVO');
      
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
        efetivoTotal: colabCount || 0
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

  return { loading, unidades, tickets, stats, refresh: fetchData };
}
