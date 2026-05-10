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
    totalVagas: 0,
    ticketsAbertos: 0,
    diretoresAtivos: 0,
    solicitacoesDiretor: 0
  });

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
      // 1. Ping de atividade (Silencioso)
      if (currentUser?.id) {
        await supabase.from('atividades').insert([{
          usuario_id: currentUser.id,
          usuario_nome: currentUser.nome || currentUser.email || 'Usuário Gerência',
          mensagem: "Sessão Ativa no Painel",
          tipo: "SISTEMA",
          created_at: new Date().toISOString()
        }]);
      }

      // 2. Fetch Logs (Atividades)
      const { data: logsData, error: logsError } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsError) {
        console.error("Erro ao buscar logs:", logsError);
        setLogs([]);
      } else {
        setLogs(logsData || []);
      }

      // 3. Usuários Online (Baseado na telemetria de presença)
      const quinzeMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: onlineUsersData } = await supabase
        .from('usuarios')
        .select('id, nome, cargo, ultima_presenca')
        .gt('ultima_presenca', quinzeMinAgo)
        .order('ultima_presenca', { ascending: false });
      
      if (onlineUsersData) {
        setUsuariosOnline(onlineUsersData.map(u => ({
          usuario_id: u.id,
          usuario_nome: u.nome,
          created_at: u.ultima_presenca // Mapeado para compatibilidade com o componente visual
        })));
      }

      // 4. Fetch Volantes
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

      // 4. Stats gerais — busca dados completos para filtrar Gestão Própria e calcular vagas
      const [colabsData, reqs, quadroRes, tickets, diretoresRes, feedbacksRes] = await Promise.all([
        supabase.from('usuarios').select('unidade_alocacao, cargo, secretaria').eq('status', 'ATIVO'),
        supabase.from('requisicoes').select('*', { count: 'exact', head: true }),
        supabase.from('vagas_quadro').select('unidade_nome, cargo, vagas_totais'),
        supabase.from('tickets_sla').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE'),
        supabase.from('unidades').select('*', { count: 'exact', head: true }).not('diretor_id', 'is', null),
        supabase.from('feedback_diretor').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE')
      ]);

      // Exclui unidades Alicerce/PMG (gestão própria) da contagem oficial
      const isGestaoPropria = (unidade: string) => {
        const u = (unidade || '').toUpperCase();
        return u.includes('ALICERCE') || u.includes('PMG');
      };
      
      const todosColabs = colabsData.data || [];
      const oficiais = todosColabs.filter(c => !isGestaoPropria(c.unidade_alocacao));
      const totalOficiais = oficiais.length;

      // Cálculo dinâmico de vagas abertas baseadas no Quadro de Lotação
      let totalVagasAbertas = 0;
      (quadroRes.data || []).forEach(q => {
        const ocupadas = todosColabs.filter(c => 
          c.unidade_alocacao === q.unidade_nome && 
          (c.cargo || "").toUpperCase() === (q.cargo || "").toUpperCase()
        ).length;
        totalVagasAbertas += Math.max(0, q.vagas_totais - ocupadas);
      });

      setStats({
        totalColaboradores: totalOficiais,
        totalRequisicoes: reqs.count || 0,
        totalVagas: totalVagasAbertas,
        ticketsAbertos: tickets.count || 0,
        diretoresAtivos: diretoresRes.count || 0,
        solicitacoesDiretor: feedbacksRes.count || 0
      });

      // 5. Distribuição de colaboradores (Reutiliza dados já carregados)
      if (todosColabs) {
        const allColabs = todosColabs;
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
    usuariosOnline,
    refresh: fetchGerencia
  };
}
