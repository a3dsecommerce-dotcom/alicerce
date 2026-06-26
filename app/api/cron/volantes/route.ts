/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addDays, format } from 'date-fns';

/**
 * CRON ENDPOINT - /api/cron/volantes
 * 
 * Este endpoint é chamado periodicamente pelo cron do n8n.
 * Ele verifica se o horário atual de Brasília coincide com o horário configurado
 * para envio da escala dos volantes. Em caso positivo, busca a escala de amanhã
 * e envia para o webhook correspondente no n8n.
 */

export async function GET(req: Request) {
  try {
    // 1. Autenticação via API key (para n8n/cron externo)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.N8N_RESPONSE_API_KEY || 'sua-chave-secreta-compartilhada';
    const cronSecret = req.headers.get('x-cron-secret');
    const url = new URL(req.url);
    const keyParam = url.searchParams.get('key');

    const isAuthorized = 
      (apiKey && apiKey === expectedApiKey) ||
      (cronSecret && cronSecret === expectedApiKey) ||
      (keyParam && keyParam === expectedApiKey);

    if (!isAuthorized) {
      console.warn("⚠️ [CRON VOLANTES] Chamada não autorizada em /api/cron/volantes");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obter horário atual de Brasília (HH:MM)
    const horaMinutoBrasilia = new Date().toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    // 3. Buscar horários configurados no banco de dados
    const { data: configData } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'HORARIO_DISPARO_ESCALA')
      .maybeSingle();

    let horarios = ["20:00"]; // Padrão
    if (configData?.valor) {
      horarios = configData.valor.split(',').map((t: string) => t.trim());
    }

    console.log(`⏰ [CRON VOLANTES] Hora Brasília: ${horaMinutoBrasilia} | Horários agendados: ${horarios.join(', ')}`);

    // 4. Verificar se o horário atual coincide com os agendados
    if (!horarios.includes(horaMinutoBrasilia)) {
      return NextResponse.json({
        success: true,
        action: "SKIP",
        time: horaMinutoBrasilia,
        scheduled: horarios,
        message: `Não é horário de disparo da escala. Atual: ${horaMinutoBrasilia}`
      });
    }

    console.log(`🔔 [CRON VOLANTES] HORÁRIO ALCANÇADO! ${horaMinutoBrasilia} — Iniciando disparo da escala de amanhã.`);

    // 5. Calcular a data de amanhã
    const dateSp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const tomorrowDate = addDays(dateSp, 1);
    const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

    // 6. Buscar todas as escalas do dia seguinte
    const { data: escalas, error: dbError } = await supabase
      .from('escala_volantes')
      .select('*')
      .eq('data', tomorrowStr);

    if (dbError) {
      throw new Error(`Erro ao buscar escalas no banco de dados: ${dbError.message}`);
    }

    if (!escalas || escalas.length === 0) {
      console.log(`ℹ️ [CRON VOLANTES] Nenhuma escala cadastrada para amanhã (${format(tomorrowDate, 'dd/MM/yyyy')}).`);
      return NextResponse.json({
        success: true,
        action: "NO_SCALES",
        message: `Nenhuma escala encontrada para amanhã (${format(tomorrowDate, 'dd/MM/yyyy')}).`
      });
    }

    // 7. Buscar URL do webhook do n8n e JID do grupo
    const { data: configs } = await supabase
      .from('configuracoes_sistema')
      .select('*')
      .in('chave', ['N8N_ESCALA_AMANHA_WEBHOOK_URL', 'WHATSAPP_GRUPO_VOLANTES_JID']);

    const webhookConfig = configs?.find((c: any) => c.chave === "N8N_ESCALA_AMANHA_WEBHOOK_URL");
    const jidConfig = configs?.find((c: any) => c.chave === "WHATSAPP_GRUPO_VOLANTES_JID");

    const webhookUrl = webhookConfig?.valor || "https://n8n-n8n.rvwwep.easypanel.host/webhook/escala-amanha";
    const grupoJid = jidConfig?.valor || "";

    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;

    // 8. Montar o payload consolidado
    const payload = {
      data: tomorrowStr,
      data_formatada: format(tomorrowDate, 'dd/MM/yyyy'),
      total_volantes: escalas.length,
      autorizado_por: "Disparo Automático (Cron)",
      grupo_jid: grupoJid,
      evolutionUrl,
      evolutionApiKey,
      evolutionInstance,
      escalas: escalas.map((e: any) => ({
        id: e.id,
        colaborador_nome: e.colaborador_nome.toUpperCase(),
        observacoes: e.observacoes,
        roteiro: (e.detalhes_visitas || []).map((d: any) => {
          let substituindo = "";
          const motivoUpper = (d.motivo || "").toUpperCase();
          if (motivoUpper.includes("SUBST:")) {
            substituindo = d.motivo.substring(motivoUpper.indexOf("SUBST:") + 6).trim();
          } else {
            substituindo = d.motivo || "";
          }

          let insalubridade = 0;
          if (motivoUpper.includes("20%")) insalubridade = 20;
          else if (motivoUpper.includes("40%")) insalubridade = 40;

          return {
            unidade: d.unidade.toUpperCase(),
            entrada: d.entrada,
            saida: d.saida || "17:00",
            motivo: d.motivo,
            substituindo: substituindo,
            insalubridade: insalubridade || null
          };
        })
      }))
    };

    // 9. Enviar POST ao webhook do n8n
    console.log(`📡 [CRON VOLANTES] Enviando post para n8n webhook em ${webhookUrl}...`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro na resposta do webhook do n8n (${response.status}): ${errText}`);
    }

    console.log(`✅ [CRON VOLANTES] Escala de amanhã enviada com sucesso para o n8n.`);
    return NextResponse.json({
      success: true,
      action: "DISPATCHED",
      time: horaMinutoBrasilia,
      total_volantes: escalas.length,
      message: `Escala de amanhã (${payload.data_formatada}) enviada com sucesso!`
    });

  } catch (err: any) {
    console.error("❌ [CRON VOLANTES] Erro:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
