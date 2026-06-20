import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';

// Helper para atraso (delay)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função auxiliar para processar a fila em background
async function processarFilaCobrancas(
  ocorrencias: any[],
  webhookUrl: string,
  evolutionConfig: { evolutionUrl: string; evolutionApiKey: string; evolutionInstance: string }
) {
  console.log(`🚀 Iniciando processamento em background de ${ocorrencias.length} cobranças.`);

  for (let i = 0; i < ocorrencias.length; i++) {
    const ocorrencia = ocorrencias[i];
    const dataAgora = new Date().toISOString();

    // Se data_ultima_cobranca for nulo, a fase é 1. Caso contrário, incrementa a fase atual até o máximo de 3.
    const faseAtual = ocorrencia.data_ultima_cobranca === null 
      ? 1 
      : Math.min(Number(ocorrencia.fase_cobranca || 1) + 1, 3);

    console.log(`💬 [Fila ${i + 1}/${ocorrencias.length}] Enviando cobrança Fase ${faseAtual} para ${ocorrencia.nome} (${ocorrencia.telefone})`);

    try {
      // 1. Atualizar registro no banco antes de disparar para garantir o estado
      const { error: updateError } = await supabase
        .from('ajustes_ponto')
        .update({
          fase_cobranca: faseAtual,
          data_ultima_cobranca: dataAgora,
          updated_at: dataAgora
        })
        .eq('id', ocorrencia.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar ocorrência ${ocorrencia.id} no Supabase:`, updateError.message);
        continue; // Passa para o próximo caso ocorra erro no BD
      }

      // 2. Disparar o webhook para o n8n
      const payload = {
        id: ocorrencia.id,
        nome: ocorrencia.nome,
        telefone: ocorrencia.telefone,
        data_referencia: ocorrencia.data_referencia,
        motivo: ocorrencia.motivo || "Ajuste Geral de Ponto",
        fase_cobranca: faseAtual,
        timestamp: dataAgora,
        ...evolutionConfig
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`⚠️ Webhook n8n respondeu com erro para ${ocorrencia.nome}:`, response.status, errorText);
      } else {
        console.log(`✅ Webhook enviado com sucesso para ${ocorrencia.nome}`);
      }

    } catch (err: any) {
      console.error(`❌ Exceção ao processar cobrança de ${ocorrencia.nome}:`, err.message);
    }

    // Se não for o último elemento, aguarda um delay aleatório de 30 a 50 segundos
    if (i < ocorrencias.length - 1) {
      const delayMs = 30000 + Math.floor(Math.random() * 20000); // 30 a 50 segundos
      console.log(`⏱️ Aguardando ${Math.round(delayMs / 1000)} segundos antes da próxima cobrança...`);
      await delay(delayMs);
    }
  }

  console.log(`🏁 Processamento da fila de cobranças concluído com sucesso.`);
}

export async function POST(req: Request) {
  try {
    // 1. Validar a autenticação (Chave de API do n8n OU Sessão do Usuário do Supabase)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.N8N_RESPONSE_API_KEY || 'sua-chave-secreta-compartilhada';

    let isAuthorized = false;

    if (apiKey && apiKey === expectedApiKey) {
      isAuthorized = true;
    } else {
      try {
        const supabaseServer = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
        if (!authError && user) {
          isAuthorized = true;
        }
      } catch (authErr) {
        console.error("Erro ao autenticar usuário da sessão:", authErr);
      }
    }

    if (!isAuthorized) {
      console.warn("⚠️ Chamada não autorizada na rota /api/ponto/disparar");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const { manual } = payload;

    // 2. Buscar configurações do sistema (Webhook e Evolution)
    const { data: configs, error: configError } = await supabase
      .from('configuracoes_sistema')
      .select('*');

    if (configError) {
      throw new Error(`Erro ao buscar configurações: ${configError.message}`);
    }

    const webhookConfig = configs?.find((c: any) => c.chave === "N8N_PONTO_WEBHOOK_URL");
    const webhookUrl = webhookConfig?.valor || "https://n8n-n8n.rvwwep.easypanel.host/webhook/cobranca-ponto";

    // Pegar chaves da Evolution das variáveis de ambiente
    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const evolutionInstance = process.env.EVOLUTION_INSTANCE || "";

    const evolutionConfig = { evolutionUrl, evolutionApiKey, evolutionInstance };

    // 3. Se for automático (chamada de Cron), verificar o horário
    if (!manual) {
      // Buscar horários configurados
      const { data: horariosData, error: horariosError } = await supabase
        .from('config_ponto')
        .select('valor')
        .eq('chave', 'horarios_cobranca')
        .single();

      let horarios = ["08:00", "14:00", "18:00"]; // padrão fallback
      if (!horariosError && horariosData && Array.isArray(horariosData.valor)) {
        horarios = horariosData.valor;
      }

      // Obter horário atual de Brasília
      const horaMinutoBrasilia = new Date().toLocaleTimeString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      console.log(`⏰ Verificação automática de horário: hora atual Brasília: ${horaMinutoBrasilia}, horários agendados:`, horarios);

      if (!horarios.includes(horaMinutoBrasilia)) {
        return NextResponse.json({ 
          success: true, 
          message: "Não é horário de disparo automático", 
          time: horaMinutoBrasilia,
          scheduled: horarios
        });
      }
    }

    // 4. Buscar ocorrências ativas (autorizado = true AND resolvido = false)
    const { data: ocorrencias, error: dbError } = await supabase
      .from('ajustes_ponto')
      .select('*')
      .eq('autorizado', true)
      .eq('resolvido', false);

    if (dbError) {
      throw new Error(`Erro ao buscar ocorrências no banco: ${dbError.message}`);
    }

    if (!ocorrencias || ocorrencias.length === 0) {
      console.log("ℹ️ Nenhuma ocorrência ativa na lista de cobrança.");
      return NextResponse.json({ success: true, message: "Nenhuma ocorrência na fila de cobrança" });
    }

    // 5. Filtrar ocorrências aplicando a trava de segurança de 5 minutos contra duplicidade
    const agoraMs = new Date().getTime();
    const tempoMinimoEntreCobrancasMs = 5 * 60 * 1000; // 5 minutos

    const ocorrenciasFiltradas = ocorrencias.filter(o => {
      // Se nunca foi cobrado, pode disparar
      if (!o.data_ultima_cobranca) return true;

      // Se foi cobrado, deve ter passado pelo menos 5 minutos
      const ultimaCobrancaMs = new Date(o.data_ultima_cobranca).getTime();
      return (agoraMs - ultimaCobrancaMs) >= tempoMinimoEntreCobrancasMs;
    });

    if (ocorrenciasFiltradas.length === 0) {
      console.log("ℹ️ Todas as ocorrências ativas foram cobradas recentemente (< 5min). Ignorando disparo.");
      return NextResponse.json({ success: true, message: "Todas as ocorrências cobradas recentemente" });
    }

    // 6. Iniciar o processamento da fila em background (sem await para responder rápido ao cliente/cron)
    processarFilaCobrancas(ocorrenciasFiltradas, webhookUrl, evolutionConfig).catch(err => {
      console.error("❌ Erro fatal no processamento da fila em background:", err.message);
    });

    return NextResponse.json({
      success: true,
      manual: !!manual,
      total_na_fila: ocorrencias.length,
      disparados: ocorrenciasFiltradas.length,
      message: `Processamento de ${ocorrenciasFiltradas.length} cobranças iniciado em background.`
    });

  } catch (err: any) {
    console.error("❌ Erro na API /api/ponto/disparar:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
