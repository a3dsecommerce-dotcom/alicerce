/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';

// Helper para atraso (delay)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para limpar e normalizar telefone para padrão brasileiro (DDI 55)
function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 11 && digits.length >= 10) {
    return '55' + digits;
  }
  return digits;
}

// Função para buscar o encarregado/supervisor responsável pelo colaborador
async function buscarEncarregadoDoColaborador(colaboradorId: string) {
  try {
    // 1. Obter a unidade de alocação do colaborador
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('unidade_alocacao')
      .eq('id', colaboradorId)
      .single();

    if (userError || !user?.unidade_alocacao) {
      console.log(`⚠️ Colaborador ${colaboradorId} sem unidade de alocação mapeada.`);
      return null;
    }

    const unidadeNome = user.unidade_alocacao;

    // 2. Buscar a unidade correspondente
    const { data: unit, error: unitError } = await supabase
      .from('unidades')
      .select('rota, encarregado_id')
      .eq('nome', unidadeNome)
      .single();

    if (unitError || !unit) {
      console.log(`⚠️ Unidade "${unidadeNome}" não encontrada na tabela unidades.`);
      return null;
    }

    let encarregadoId = unit.encarregado_id;
    const rota = unit.rota || "Sem Rota";

    // 3. Se a unidade não tiver encarregado_id, buscar na config_rotas
    if (!encarregadoId && unit.rota) {
      const { data: routeData } = await supabase
        .from('config_rotas')
        .select('encarregado_id')
        .ilike('rota_nome', unit.rota)
        .single();
      if (routeData && routeData.encarregado_id) {
        encarregadoId = routeData.encarregado_id;
      }
    }

    if (!encarregadoId) {
      console.log(`⚠️ Nenhum encarregado cadastrado para a unidade "${unidadeNome}" ou rota "${rota}".`);
      return {
        unidade: unidadeNome,
        rota: rota,
        encarregadoNome: null,
        encarregadoTelefone: null
      };
    }

    // 4. Buscar nome e telefone do encarregado na tabela usuarios
    const { data: encarregado, error: encError } = await supabase
      .from('usuarios')
      .select('nome, telefone')
      .eq('id', encarregadoId)
      .single();

    if (encError || !encarregado) {
      console.log(`⚠️ Encarregado com ID ${encarregadoId} não encontrado na tabela usuarios.`);
      return {
        unidade: unidadeNome,
        rota: rota,
        encarregadoNome: null,
        encarregadoTelefone: null
      };
    }

    return {
      unidade: unidadeNome,
      rota: rota,
      encarregadoNome: encarregado.nome,
      encarregadoTelefone: encarregado.telefone
    };

  } catch (err: any) {
    console.error("❌ Erro ao buscar encarregado do colaborador:", err.message);
    return null;
  }
}

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

      // Buscar dados do encarregado para injetar no payload
      let encarregadoNome = "Encarregado";
      let encarregadoTelefone = "";
      if (ocorrencia.colaborador_id) {
        const encDados = await buscarEncarregadoDoColaborador(ocorrencia.colaborador_id);
        if (encDados) {
          encarregadoNome = encDados.encarregadoNome || "Encarregado";
          encarregadoTelefone = encDados.encarregadoTelefone || "";
        }
      }

      // 2. Disparar o webhook para o n8n para cobrar o colaborador
      const payload = {
        id: ocorrencia.id,
        nome: ocorrencia.nome,
        telefone: ocorrencia.telefone,
        data_referencia: ocorrencia.data_referencia,
        motivo: ocorrencia.motivo || "Ajuste Geral de Ponto",
        fase_cobranca: faseAtual,
        encarregado_nome: encarregadoNome,
        encarregado_telefone: encarregadoTelefone,
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
        const errorText = await response.text();
        console.error(`⚠️ Webhook n8n respondeu com erro para ${ocorrencia.nome}:`, response.status, errorText);
      } else {
        console.log(`✅ Webhook enviado com sucesso para ${ocorrencia.nome}`);
      }

      // 3. Se for Fase 3 (escalonamento), buscar encarregado e notificá-lo
      if (faseAtual === 3 && ocorrencia.colaborador_id) {
        console.log(`🚨 Escalando caso de ${ocorrencia.nome} (Fase 3) para o encarregado...`);
        const encDados = await buscarEncarregadoDoColaborador(ocorrencia.colaborador_id);
        
        if (encDados && encDados.encarregadoTelefone) {
          const telefoneEncLimpo = cleanPhone(encDados.encarregadoTelefone);
          
          if (telefoneEncLimpo) {
            const mensagemEnc = `Olá, *${encDados.encarregadoNome}*! Identificamos que o colaborador *${ocorrencia.nome}* (alocado na rota *${encDados.rota}*, unidade *${encDados.unidade}*) possui uma pendência de ajuste de ponto no dia *${ocorrencia.data_referencia}* (${ocorrencia.motivo || 'Batida pendente'}).\n\nEssa pendência já foi cobrada 3 vezes de forma automática e não foi resolvida pelo colaborador. Por favor, faça a cobrança pessoalmente para regularização.\n\n_Esta é uma mensagem automática de suporte à gestão de ponto._`;

            try {
              console.log(`📡 Enviando notificação de escalonamento para o encarregado ${encDados.encarregadoNome} (${telefoneEncLimpo})...`);
              
              const responseEnc = await fetch(`${evolutionConfig.evolutionUrl}/message/sendText/${evolutionConfig.evolutionInstance}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "apikey": evolutionConfig.evolutionApiKey
                },
                body: JSON.stringify({
                  number: telefoneEncLimpo,
                  text: mensagemEnc,
                  delay: 1200
                })
              });

              if (!responseEnc.ok) {
                const errText = await responseEnc.text();
                console.error(`⚠️ Erro ao enviar mensagem para o encarregado na Evolution: Status ${responseEnc.status}`, errText);
              } else {
                console.log(`✅ Notificação enviada com sucesso para o encarregado ${encDados.encarregadoNome}`);
              }
            } catch (fetchEncErr: any) {
              console.error(`❌ Exceção ao enviar notificação para o encarregado:`, fetchEncErr.message);
            }
          }
        } else {
          console.log(`⚠️ Não foi possível determinar o encarregado ou obter telefone válido para escalonamento do colaborador ${ocorrencia.nome}.`);
        }
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
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;
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

    // Obter horário atual de Brasília
    const horaMinutoBrasilia = new Date().toLocaleTimeString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    // 4.1. Enviar notificações consolidadas aos Encarregados se for manual OU se for exatamente 09:00 ou 14:00
    const isEncarregadoHour = manual || horaMinutoBrasilia === "09:00" || horaMinutoBrasilia === "14:00";
    if (isEncarregadoHour) {
      console.log(`📢 [Supervisor Alert] Agrupando pendências de ajuste no app para os Encarregados...`);
      const ocorrenciasComAjustePendente = ocorrencias.filter((o: any) => o.ajuste_pendente === true);
      
      if (ocorrenciasComAjustePendente.length > 0) {
        // Agrupar por encarregado
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

        // Enviar a mensagem para cada encarregado
        for (const telKey of Object.keys(supervisorMap)) {
          const supervisor = supervisorMap[telKey];
          let msgEnc = `Olá, *${supervisor.encNome}*! Os seguintes colaboradores sob sua responsabilidade já solicitaram o ajuste no aplicativo *MarqPonto* e estão aguardando sua aprovação:\n\n`;
          
          supervisor.items.forEach((item, index) => {
            msgEnc += `${index + 1}. *${item.nome}* - Data: *${item.data_referencia}* (Motivo: _${item.motivo || "Batida pendente"}_)\n`;
          });
          
          msgEnc += `\nPor favor, acesse o MarqPonto e aprove as solicitações para regularizar o ponto.\n\n_Esta é uma mensagem automática de suporte à gestão de ponto._`;

          try {
            console.log(`📡 [Supervisor Alert] Enviando lista para ${supervisor.encNome} (${supervisor.tel})...`);
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
            console.error(`❌ Erro ao enviar mensagem agrupada para ${supervisor.encNome}:`, errEnc.message);
          }
        }
      }
    }

    // 5. Filtrar ocorrências direcionadas aos colaboradores (ajuste_pendente = false) aplicando a trava de segurança de 5 minutos contra duplicidade
    const agoraMs = new Date().getTime();
    const tempoMinimoEntreCobrancasMs = 5 * 60 * 1000; // 5 minutos

    const ocorrenciasFiltradas = ocorrencias.filter((o: any) => {
      // Ignorar se o ajuste já foi solicitado (pois a cobrança desse é enviada de forma agrupada aos supervisores)
      if (o.ajuste_pendente === true) return false;

      // Se nunca foi cobrado, pode disparar
      if (!o.data_ultima_cobranca) return true;

      // Se foi cobrado, deve ter passado pelo menos 5 minutos
      const ultimaCobrancaMs = new Date(o.data_ultima_cobranca).getTime();
      return (agoraMs - ultimaCobrancaMs) >= tempoMinimoEntreCobrancasMs;
    });

    if (ocorrenciasFiltradas.length === 0) {
      console.log("ℹ️ Nenhuma ocorrência de colaborador qualificada para envio direto.");
      return NextResponse.json({ 
        success: true, 
        manual: !!manual,
        total_na_fila: ocorrencias.length,
        disparados: 0,
        message: "Nenhum colaborador elegível para cobrança individual no momento (ou foram cobrados há < 5min)." 
      });
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
      message: `Processamento de ${ocorrenciasFiltradas.length} cobranças individuais iniciado em background.`
    });

  } catch (err: any) {
    console.error("❌ Erro na API /api/ponto/disparar:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
