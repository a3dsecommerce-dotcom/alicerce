"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useGerenciaData() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalColaboradores: 0,
    totalRequisicoes: 0,
    totalVagas: 0,
    ticketsAbertos: 0
  });

  const fetchGerencia = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Logs (Atividades)
      const { data: logsData } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (logsData) setLogs(logsData);

      // 2. Fetch Stats
      const [colabs, reqs, vagas, tickets] = await Promise.all([
        supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('status', 'ATIVO'),
        supabase.from('requisicoes').select('*', { count: 'exact', head: true }),
        supabase.from('vagas').select('*', { count: 'exact', head: true }).eq('status_vaga', 'ABERTA'),
        supabase.from('tickets_sla').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE')
      ]);

      setStats({
        totalColaboradores: colabs.count || 0,
        totalRequisicoes: reqs.count || 0,
        totalVagas: vagas.count || 0,
        ticketsAbertos: tickets.count || 0
      });

    } catch (err) {
      console.error("Erro no carregamento da Gerência:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGerencia();
  }, [fetchGerencia]);

  return {
    loading,
    logs,
    stats,
    refresh: fetchGerencia
  };
}
