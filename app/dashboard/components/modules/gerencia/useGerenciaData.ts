"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useGerenciaData() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [volantes, setVolantes] = useState<any[]>([]);
  const [requisicoesVolantes, setRequisicoesVolantes] = useState<any[]>([]);
  const [asgPorSecretaria, setAsgPorSecretaria] = useState<{ secretaria: string; total: number }[]>([]);
  const [cargos, setCargos] = useState<{ cargo: string; total: number }[]>([]);
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

      // 2. Fetch Volantes
      const { data: volData } = await supabase
        .from('escala_volantes')
        .select('*')
        .order('data', { ascending: false });
      if (volData) setVolantes(volData);

      // 3. Fetch Requisições de Volantes
      const { data: reqVolData } = await supabase
        .from('requisicoes_volantes')
        .select('*')
        .order('created_at', { ascending: false });
      if (reqVolData) setRequisicoesVolantes(reqVolData);

      // 4. Stats gerais — busca dados completos para filtrar Gestão Própria
      const [colabsData, reqs, vagas, tickets] = await Promise.all([
        supabase.from('usuarios').select('unidade_alocacao').eq('status', 'ATIVO'),
        supabase.from('requisicoes').select('*', { count: 'exact', head: true }),
        supabase.from('vagas').select('*', { count: 'exact', head: true }).eq('status_vaga', 'ABERTA'),
        supabase.from('tickets_sla').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE')
      ]);

      // Exclui unidades Alicerce/PMG (gestão própria) da contagem oficial
      const isGestaoPropria = (unidade: string) => {
        const u = (unidade || '').toUpperCase();
        return u.includes('ALICERCE') || u.includes('PMG');
      };
      const totalOficiais = (colabsData.data || []).filter(c => !isGestaoPropria(c.unidade_alocacao)).length;

      setStats({
        totalColaboradores: totalOficiais,
        totalRequisicoes: reqs.count || 0,
        totalVagas: vagas.count || 0,
        ticketsAbertos: tickets.count || 0
      });

      // 5. Colaboradores ativos para distribuição
      const { data: allColabs } = await supabase
        .from('usuarios')
        .select('cargo, secretaria, status')
        .eq('status', 'ATIVO');

      if (allColabs) {
        // Filtra Gestão Própria (Alicerce/PMG) — fora do contrato oficial
        const oficiais = allColabs.filter(c => !isGestaoPropria(c.unidade_alocacao || ''));

        // ASG por Secretaria — apenas efetivo oficial
        const asgList = oficiais.filter(c => {
          const c_ = (c.cargo || '').toUpperCase();
          return c_.includes('ASG') || c_.includes('AGENTE DE SERVI') || (c_.includes('SERV') && c_.includes('GERAIS'));
        });
        const asgMap: Record<string, number> = {};
        asgList.forEach(c => {
          const sec = c.secretaria || 'Não informada';
          asgMap[sec] = (asgMap[sec] || 0) + 1;
        });
        setAsgPorSecretaria(
          Object.entries(asgMap)
            .map(([secretaria, total]) => ({ secretaria, total }))
            .sort((a, b) => b.total - a.total)
        );

        // Distribuição por Cargo — apenas efetivo oficial
        const cargoMap: Record<string, number> = {};
        oficiais.forEach(c => {
          const cargo = (c.cargo || 'Não definido').toUpperCase().trim();
          cargoMap[cargo] = (cargoMap[cargo] || 0) + 1;
        });
        setCargos(
          Object.entries(cargoMap)
            .map(([cargo, total]) => ({ cargo, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 20)
        );
      }

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
    volantes,
    requisicoesVolantes,
    stats,
    asgPorSecretaria,
    cargos,
    refresh: fetchGerencia
  };
}
