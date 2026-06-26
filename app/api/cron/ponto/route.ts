/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * CRON ENDPOINT - /api/cron/ponto
 * 
 * Este endpoint deve ser chamado a cada minuto (ou a cada 5 minutos) por um scheduler externo:
 *   - n8n Schedule Trigger → HTTP Request (GET)
 *   - EasyPanel Cron Job
 *   - crontab do servidor
 * 
 * Ele verifica se o horário atual de Brasília coincide com um dos horários
 * configurados em `config_ponto.horarios_cobranca` e, se sim, chama internamente
 * a lógica de disparo de cobranças.
 * 
 * Autenticação: x-api-key header OU acesso direto (para cron interno).
 */

// Limpar telefone para padrão brasileiro (DDI 55)
function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 11 && digits.length >= 10) {
    return '55' + digits;
  }
  return digits;
}

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Buscar encarregado do colaborador
async function buscarEncarregadoDoColaborador(colaboradorId: string) {
  try {
    const { data: user } = await supabase.from('usuarios').select('unidade_alocacao').eq('id', colaboradorId).single();
    if (!user?.unidade_alocacao) return null;

    const { data: unit } = await supabase.from('unidades').select('rota, encarregado_id').eq('nome', user.unidade_alocacao).single();
    if (!unit) return null;

    let encarregadoId = unit.encarregado_id;
    if (!encarregadoId && unit.rota) {
      const { data: routeData } = await supabase.from('config_rotas').select('encarregado_id').ilike('rota_nome', unit.rota).single();
      if (routeData?.encarregado_id) encarregadoId = routeData.encarregado_id;
    }

    if (!encarregadoId) {
      return { unidade: user.unidade_alocacao, rota: unit.rota || "Sem Rota", encarregadoNome: null, encarregadoTelefone: null };
    }

    const { data: enc } = await supabase.from('usuarios').select('nome, telefone').eq('id', encarregadoId).single();
    return {
      unidade: user.unidade_alocacao,
      rota: unit.rota || "Sem Rota",
      encarregadoNome: enc?.nome || null,
      encarregadoTelefone: enc?.telefone || null
    };
  } catch {
    return null;
  }
}

// Processar fila de cobranças
async function processarFilaCobrancas(
  ocorrencias: any[],
  webhookUrl: string,
  evolutionConfig: { evolutionUrl: string; evolutionApiKey: string; evolutionInstance: string }
) {
  console.log(`🚀 [CRON] Iniciando processamento de ${ocorrencias.length} cobranças.`);

  for (let i = 0; i < ocorrencias.length; i++) {
    const ocorrencia = ocorrencias[i];
    const dataAgora = new Date().toISOString();
    const faseAtual = ocorrencia.data_ultima_cobranca === null ? 1 : Math.min(Number(ocorrencia.fase_cobranca || 1) + 1, 3);

    console.log(`💬 [CRON ${i + 1}/${ocorrencias.length}] Fase ${faseAtual} para ${ocorrencia.nome}`);

    try {
      // Atualizar registro
      await supabase.from('ajustes_ponto').update({
        fase_cobranca: faseAtual,
        data_ultima_cobranca: dataAgora,
        updated_at: dataAgora
      }).eq('id', ocorrencia.id);

      // Disparar webhook para n8n
      const payload = {
        id: ocorrencia.id,
        nome: ocorrencia.nome,
        telefone: ocorrencia.telefone,
        data_referencia: ocorrencia.data_referencia,
        motivo: ocorrencia.motivo || "Ajuste Geral de Ponto",
        fase_cobranca: faseAtual,
        timestamp: dataAgora,
        evolutionUrl: evolutionConfig.evolutionUrl,
        evolutionApiKey: evolutionConfig.evolutionApiKey,
        evolutionInstance: evolutionConfig.evolutionInstance
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`⚠️ [CRON] Webhook respondeu erro para ${ocorrencia.nome}: ${response.status}`);
      } else {
        console.log(`✅ [CRON] Webhook enviado para ${ocorrencia.nome}`);
      }

      // Fase 3: escalonar para encarregado
      if (faseAtual === 3 && ocorrencia.colaborador_id) {
        const encDados = await buscarEncarregadoDoColaborador(ocorrencia.colaborador_id);
        if (encDados?.encarregadoTelefone) {
          const telEnc = cleanPhone(encDados.encarregadoTelefone);
          if (telEnc) {
            const msg = `Olá, *${encDados.encarregadoNome}*! O colaborador *${ocorrencia.nome}* (rota *${encDados.rota}*, unidade *${encDados.unidade}*) possui pendência de ajuste de ponto no dia *${ocorrencia.data_referencia}*.\n\nEssa pendência já foi cobrada 3 vezes automaticamente. Por favor, faça a cobrança pessoalmente.\n\n_Mensagem automática de gestão de ponto._`;
            
            await fetch(`${evolutionConfig.evolutionUrl}/message/sendText/${evolutionConfig.evolutionInstance}`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "apikey": evolutionConfig.evolutionApiKey },
              body: JSON.stringify({ number: telEnc, text: msg, delay: 1200 })
            }).catch(() => {});
          }
        }
      }

    } catch (err: any) {
      console.error(`❌ [CRON] Erro ao processar ${ocorrencia.nome}:`, err.message);
    }

    if (i < ocorrencias.length - 1) {
      const delayMs = 30000 + Math.floor(Math.random() * 20000);
      await delay(delayMs);
    }
  }

  console.log(`🏁 [CRON] Processamento concluído.`);
}

export async function GET(req: Request) {
  try {
    // Autenticação via API key (para n8n/cron externo)
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.N8N_RESPONSE_API_KEY || 'sua-chave-secreta-compartilhada';
    const cronSecret = req.headers.get('x-cron-secret');

    // Aceitar: API key válida, cron secret, ou sem auth (para cron interno do servidor)
    const url = new URL(req.url);
    const keyParam = url.searchParams.get('key');
    
    const isAuthorized = 
      (apiKey && apiKey === expectedApiKey) ||
      (cronSecret && cronSecret === expectedApiKey) ||
      (keyParam && keyParam === expectedApiKey);

    if (!isAuthorized) {
      console.warn("⚠️ [CRON] Chamada não autorizada em /api/cron/ponto");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Obter horário atual de Brasília
    const horaMinutoBrasilia = new Date().toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    // 2. Buscar horários configurados
    const { data: horariosData } = await supabase
      .from('config_ponto')
      .select('valor')
      .eq('chave', 'horarios_cobranca')
      .single();

    let horarios = ["08:00", "14:00", "18:00"];
    if (horariosData && Array.isArray(horariosData.valor)) {
      horarios = horariosData.valor;
    }

    console.log(`⏰ [CRON] Hora Brasília: ${horaMinutoBrasilia} | Horários: ${horarios.join(', ')}`);

    // 3. Verificar se o horário atual está nos horários configurados
    if (!horarios.includes(horaMinutoBrasilia)) {
      return NextResponse.json({
        success: true,
        action: "SKIP",
        time: horaMinutoBrasilia,
        scheduled: horarios,
        message: `Não é horário de disparo. Atual: ${horaMinutoBrasilia}`
      });
    }

    console.log(`🔔 [CRON] HORÁRIO ATINGIDO! ${horaMinutoBrasilia} — Iniciando disparos...`);

    // 4. Buscar configurações do sistema
    const { data: configs } = await supabase.from('configuracoes_sistema').select('*');
    const webhookConfig = configs?.find((c: any) => c.chave === "N8N_PONTO_WEBHOOK_URL");
    const webhookUrl = webhookConfig?.valor || "https://n8n-n8n.rvwwep.easypanel.host/webhook/cobranca-ponto";

    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;
    const evolutionConfig = { evolutionUrl, evolutionApiKey, evolutionInstance };

    // 5. Buscar ocorrências ativas
    const { data: ocorrencias, error: dbError } = await supabase
      .from('ajustes_ponto')
      .select('*')
      .eq('autorizado', true)
      .eq('resolvido', false);

    if (dbError) throw new Error(`Erro ao buscar ocorrências: ${dbError.message}`);

    if (!ocorrencias || ocorrencias.length === 0) {
      return NextResponse.json({ success: true, action: "NO_ITEMS", message: "Nenhuma ocorrência ativa" });
    }

    // 5.1. Enviar notificações consolidadas aos Encarregados se for exatamente 09:00 ou 14:00
    const isEncarregadoHour = horaMinutoBrasilia === "09:00" || horaMinutoBrasilia === "14:00";
    if (isEncarregadoHour) {
      console.log(`📢 [CRON Supervisor Alert] Agrupando pendências de ajuste no app para os Encarregados...`);
      const ocorrenciasComAjustePendente = ocorrencias.filter((o: any) => o.ajuste_pendente === true);
      
      if (ocorrenciasComAjustePendente.length > 0) {
        const supervisorMap: { [key: string]: { encNome: string; tel: string; rota: string; unidade: string; items: any[] } } = {};
        
        for (const o of ocorrenciasComAjustePendente) {
          if (!o.colaborador_id) continue;
          const encDados = await buscarEncarregadoDoColaborador(o.colaborador_id);
          if (encDados && encDados.encarregadoTelefone) {
            const telLimpo = cleanPhone(encDados.encarregadoTelefone);
            if (!telLimpo) continue;
            
            if (!supervisorMap[telLimpo]) {
              supervisorMap[telLimpo] = {
                encNome: encDados.encarregadoNome || "Supervisor",
                tel: telLimpo,
                rota: encDados.rota || "Sem Rota",
                unidade: encDados.unidade || "Sem Unidade",
                items: []
              };
            }
            supervisorMap[telLimpo].items.push(o);
          }
        }

        for (const telKey of Object.keys(supervisorMap)) {
          const supervisor = supervisorMap[telKey];
          let msgEnc = `Olá, *${supervisor.encNome}*! Os seguintes colaboradores sob sua responsabilidade já solicitaram o ajuste no aplicativo *MarqPonto* e estão aguardando sua aprovação:\n\n`;
          
          supervisor.items.forEach((item, index) => {
            msgEnc += `${index + 1}. *${item.nome}* - Data: *${item.data_referencia}* (Motivo: _${item.motivo || "Batida pendente"}_)\n`;
          });
          
          msgEnc += `\nPor favor, acesse o MarqPonto e aprove as solicitações para regularizar o ponto.\n\n_Esta é uma mensagem automática de suporte à gestão de ponto._`;

          try {
            console.log(`📡 [CRON Supervisor Alert] Enviando lista para ${supervisor.encNome}...`);
            await fetch(`${evolutionConfig.evolutionUrl}/message/sendText/${evolutionConfig.evolutionInstance}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": evolutionConfig.evolutionApiKey
              },
              body: JSON.stringify({
                number: supervisor.tel,
                text: msgEnc,
                delay: 1200
              })
            });
          } catch (errEnc: any) {
            console.error(`❌ [CRON] Erro ao enviar mensagem agrupada para ${supervisor.encNome}:`, errEnc.message);
          }
        }
      }
    }

    // 6. Filtrar por tempo mínimo entre cobranças (5 min) e apenas para quem não tem ajuste pendente no app
    const agoraMs = Date.now();
    const tempoMinimo = 5 * 60 * 1000;

    const filtradas = ocorrencias.filter((o: any) => {
      if (o.ajuste_pendente === true) return false;
      if (!o.data_ultima_cobranca) return true;
      return (agoraMs - new Date(o.data_ultima_cobranca).getTime()) >= tempoMinimo;
    });

    if (filtradas.length === 0) {
      return NextResponse.json({ success: true, action: "SKIP", message: "Nenhum colaborador elegível para cobrança individual no momento" });
    }

    // 7. Processar em background
    processarFilaCobrancas(filtradas, webhookUrl, evolutionConfig).catch(err => {
      console.error("❌ [CRON] Erro fatal:", err.message);
    });

    return NextResponse.json({
      success: true,
      action: "DISPATCHED",
      time: horaMinutoBrasilia,
      total: ocorrencias.length,
      dispatched: filtradas.length,
      message: `${filtradas.length} cobranças individuais iniciadas em background.`
    });

  } catch (err: any) {
    console.error("❌ [CRON] Erro:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
