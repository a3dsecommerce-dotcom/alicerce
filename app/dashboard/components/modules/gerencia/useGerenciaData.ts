"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export function useGerenciaData(currentUser?: any) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [volantes, setVolantes] = useState<any[]>([]);
  const [requisicoesVolantes, setRequisicoesVolantes] = useState<any[]>([]);
  const [asgPorSecretaria, setAsgPorSecretaria] = useState<{ secretaria: string; total: number }[]>([]);
  const [cargos, setCargos] = useState<{ cargo: string; total: number }[]>([]);
  const [usuariosOnline, setUsuariosOnline] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalColaboradores: 0,
    totalRequisicoes: 0,
    totalVagas: 0,
    ticketsAbertos: 0,
    diretoresAtivos: 0,
    solicitacoesDiretor: 0
  });

  // Filtros Globais
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>("");
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");

  const pingAtividade = useCallback(async () => {
    if (!currentUser) return;
    
    // Registra uma atividade silenciosa de "Acesso ao Painel" para marcar como online
    await supabase.from('atividades').insert([{
      usuario_id: currentUser.id,
      usuario_nome: currentUser.nome || currentUser.email,
      mensagem: "Acessou o Painel de Controle Central",
      tipo: "SISTEMA",
      created_at: new Date().toISOString()
    }]);
  }, [currentUser]);

  const fetchGerencia = useCallback(async () => {
    setLoading(true);
    try {
      // 2. Fetch Logs (Atividades) - Aplica filtro se existir
      let logsQuery = supabase.from('atividades').select('*');
      if (selectedUnidade) {
        logsQuery = logsQuery.ilike('mensagem', `%${selectedUnidade}%`);
      }
      const { data: logsData } = await logsQuery.order('created_at', { ascending: false }).limit(50);
      setLogs(logsData || []);

      // 3. Usuários Online
      const quinzeMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      let onlineQuery = supabase.from('usuarios').select('id, nome, cargo, ultima_presenca').gt('ultima_presenca', quinzeMinAgo);
      if (selectedSecretaria) onlineQuery = onlineQuery.eq('secretaria', selectedSecretaria);
      if (selectedUnidade) onlineQuery = onlineQuery.eq('unidade_alocacao', selectedUnidade);
      
      const { data: onlineUsersData } = await onlineQuery.order('ultima_presenca', { ascending: false });
      if (onlineUsersData) {
        setUsuariosOnline(onlineUsersData.map(u => ({
          usuario_id: u.id,
          usuario_nome: u.nome,
          created_at: u.ultima_presenca
        })));
      }

      // 4. Stats e Distribuição
      let colabsQuery = supabase.from('usuarios').select('unidade_alocacao, cargo, secretaria, insalubridade').eq('status', 'ATIVO');
      if (selectedSecretaria) colabsQuery = colabsQuery.eq('secretaria', selectedSecretaria);
      if (selectedUnidade) colabsQuery = colabsQuery.eq('unidade_alocacao', selectedUnidade);

      const [colabsRes, reqs, quadroRes, tickets, diretoresRes, feedbacksRes] = await Promise.all([
        colabsQuery,
        supabase.from('requisicoes').select('*', { count: 'exact', head: true }),
        supabase.from('vagas_quadro').select('unidade_nome, cargo, vagas_totais'),
        supabase.from('tickets_sla').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE'),
        supabase.from('unidades').select('*', { count: 'exact', head: true }).not('diretor_id', 'is', null),
        supabase.from('feedback_diretor').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE')
      ]);

      const todosColabs = colabsRes.data || [];
      
      // Exclui unidades Alicerce/PMG (gestão própria) da contagem oficial se não houver filtro específico
      const isGestaoPropria = (unidade: string) => {
        const u = (unidade || '').toUpperCase();
        return u.includes('ALICERCE') || u.includes('PMG');
      };
      
      const oficiais = selectedUnidade ? todosColabs : todosColabs.filter(c => !isGestaoPropria(c.unidade_alocacao));
      
      // Cálculo dinâmico de vagas abertas
      let totalVagasAbertas = 0;
      (quadroRes.data || []).forEach(q => {
        if (selectedUnidade && q.unidade_nome !== selectedUnidade) return;
        const ocupadas = todosColabs.filter(c => 
          c.unidade_alocacao === q.unidade_nome && 
          (c.cargo || "").toUpperCase() === (q.cargo || "").toUpperCase()
        ).length;
        totalVagasAbertas += Math.max(0, q.vagas_totais - ocupadas);
      });

      setStats({
        totalColaboradores: oficiais.length,
        totalRequisicoes: reqs.count || 0,
        totalVagas: totalVagasAbertas,
        ticketsAbertos: tickets.count || 0,
        diretoresAtivos: diretoresRes.count || 0,
        solicitacoesDiretor: feedbacksRes.count || 0
      });

      // Distribuição de ASG por Secretaria
      const asgList = oficiais.filter(c => {
        const c_ = (c.cargo || '').toUpperCase();
        return c_.includes('ASG') || c_.includes('AGENTE DE SERVI') || (c_.includes('SERV') && c_.includes('GERAIS'));
      });
      const asgMap: Record<string, number> = {};
      asgList.forEach(c => {
        const sec = c.secretaria || 'Não informada';
        asgMap[sec] = (asgMap[sec] || 0) + 1;
      });
      setAsgPorSecretaria(Object.entries(asgMap).map(([secretaria, total]) => ({ secretaria, total })).sort((a,b) => b.total - a.total));

      // Distribuição por Cargo
      const cargoMap: Record<string, number> = {};
      oficiais.forEach(c => {
        const cargo = (c.cargo || 'Não definido').toUpperCase().trim();
        cargoMap[cargo] = (cargoMap[cargo] || 0) + 1;
      });
      setCargos(Object.entries(cargoMap).map(([cargo, total]) => ({ cargo, total })).sort((a,b) => b.total - a.total).slice(0, 20));

    } catch (err) {
      console.error("Erro no carregamento da Gerência:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSecretaria, selectedUnidade]);

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
    usuariosOnline,
    selectedSecretaria,
    setSelectedSecretaria,
    selectedUnidade,
    setSelectedUnidade,
    refresh: fetchGerencia
  };
}
