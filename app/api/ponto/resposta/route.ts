/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Função auxiliar para limpar telefone e deixar apenas dígitos
function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 11 && digits.length >= 10) {
    return '55' + digits;
  }
  return digits;
}

// Função auxiliar para resolver o encarregado do colaborador
async function buscarEncarregadoDoColaborador(colaboradorId: string) {
  try {
    // 1. Obter a unidade de alocacao
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('unidade_alocacao')
      .eq('id', colaboradorId)
      .single();

    if (userError || !user?.unidade_alocacao) {
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
      return {
        unidade: unidadeNome,
        rota: rota,
        encarregadoNome: null,
        encarregadoTelefone: null
      };
    }

    // 4. Buscar nome e telefone do encarregado
    const { data: encarregado, error: encError } = await supabase
      .from('usuarios')
      .select('nome, telefone')
      .eq('id', encarregadoId)
      .single();

    if (encError || !encarregado) {
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
    console.error("❌ Erro em buscarEncarregadoDoColaborador em route resposta:", err.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // 1. Validar a Chave de API de resposta do n8n para segurança
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = process.env.N8N_RESPONSE_API_KEY || 'sua-chave-secreta-compartilhada';

    if (!apiKey || apiKey !== expectedApiKey) {
      console.warn("⚠️ Chamada não autorizada na rota /api/ponto/resposta");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json();
    const { telefone, resposta } = payload;

    if (!telefone || !resposta) {
      return NextResponse.json({ error: "telefone and resposta are required" }, { status: 400 });
    }

    const rawResposta = String(resposta).trim();
    console.log(`💬 Recebida resposta de WhatsApp de: ${telefone} - Conteúdo: "${rawResposta}"`);

    const cleanIncoming = cleanPhone(telefone);
    if (cleanIncoming.length < 8) {
      return NextResponse.json({ error: "Invalid telephone number format" }, { status: 400 });
    }

    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;

    // Helper para enviar mensagens via Evolution API
    const enviarMensagemBot = async (texto: string) => {
      try {
        await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": evolutionApiKey
          },
          body: JSON.stringify({
            number: cleanIncoming,
            text: texto,
            delay: 800
          })
        });
      } catch (errBot) {
        console.error("❌ Erro ao disparar resposta do Bot no WhatsApp:", errBot);
      }
    };

    // 2. Fluxo de Sessão Interativa do Bot via configuracoes_sistema
    const sessionKey = `PONTO_INTERACT_SESSION_${cleanIncoming}`;
    const { data: dbSession } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', sessionKey)
      .single();

    if (dbSession && dbSession.valor) {
      let sessionData: any = {};
      try {
        sessionData = typeof dbSession.valor === 'string' ? JSON.parse(dbSession.valor) : dbSession.valor;
      } catch {
        sessionData = {};
      }

      // Validar expiração (10 minutos)
      const isExpired = sessionData.created_at 
        ? (Date.now() - new Date(sessionData.created_at).getTime()) > 10 * 60 * 1000 
        : true;

      if (!isExpired && sessionData.step === "AWAITING_SELECTION") {
        if (rawResposta.toLowerCase() === 'cancelar') {
          // Encerrar sessão
          await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);
          await enviarMensagemBot("❌ Operação cancelada. Se precisar, digite *-ponto* novamente para iniciar.");
          return NextResponse.json({ success: true, message: "Sessão cancelada pelo usuário" });
        }

        const opcaoEscolhida = parseInt(rawResposta);
        const optionsList = sessionData.options || [];

        if (isNaN(opcaoEscolhida) || opcaoEscolhida < 1 || opcaoEscolhida > optionsList.length) {
          await enviarMensagemBot(`⚠️ Opção inválida. Por favor, digite o número correspondente ao colaborador (de 1 a ${optionsList.length}) ou digite *cancelar* para fechar o menu.`);
          return NextResponse.json({ success: true, message: "Opção do menu inválida" });
        }

        const itemEscolhido = optionsList[opcaoEscolhida - 1];
        const dataAgora = new Date().toISOString();

        // Resolver o ponto no banco
        const { error: errUpd } = await supabase
          .from('ajustes_ponto')
          .update({
            resolvido: true,
            resposta_encarregado: `Resolvido via comando de WhatsApp por Encarregado`,
            data_resposta_encarregado: dataAgora,
            updated_at: dataAgora
          })
          .eq('id', itemEscolhido.id);

        if (errUpd) throw errUpd;

        // Limpar sessão
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);

        await enviarMensagemBot(`✅ Sucesso! O ponto de *${itemEscolhido.nome}* referente ao dia *${itemEscolhido.data}* foi marcado como *RESOLVIDO* no sistema. As cobranças automáticas para ele foram encerradas.`);
        return NextResponse.json({ success: true, message: "Ocorrência resolvida via bot" });
      } else {
        // Sessão expirada
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);
      }
    }

    // 3. Comando de inicialização: "-ponto"
    if (rawResposta.toLowerCase() === '-ponto') {
      console.log(`🤖 Iniciando interação de comando -ponto para o remetente ${cleanIncoming}`);
      
      // Buscar todas as ocorrências pendentes
      const { data: ocorrenciasAbertas, error: errOco } = await supabase
        .from('ajustes_ponto')
        .select('*')
        .eq('resolvido', false);

      if (errOco) throw errOco;

      const pendenciasDoSupervisor: any[] = [];

      // Filtrar as ocorrências do supervisor remetente
      for (const o of (ocorrenciasAbertas || [])) {
        if (!o.colaborador_id) continue;
        const encDados = await buscarEncarregadoDoColaborador(o.colaborador_id);
        if (encDados && encDados.encarregadoTelefone) {
          const cleanEncPhone = cleanPhone(encDados.encarregadoTelefone);
          if (cleanEncPhone.length >= 8 && cleanEncPhone.slice(-8) === cleanIncoming.slice(-8)) {
            pendenciasDoSupervisor.push({
              id: o.id,
              nome: o.nome,
              data: o.data_referencia,
              motivo: o.motivo || "Ajuste Geral"
            });
          }
        }
      }

      if (pendenciasDoSupervisor.length === 0) {
        await enviarMensagemBot("Olá! Não identifiquei nenhuma pendência de ponto pendente sob sua responsabilidade no momento. Bom trabalho! 👍");
        return NextResponse.json({ success: true, message: "Nenhuma pendência encontrada para o supervisor" });
      }

      // Montar menu numerado
      let menuText = `Olá! Identifiquei os seguintes colaboradores sob sua responsabilidade com pendências de ponto:\n\n`;
      
      const sessionOptions: any[] = [];
      pendenciasDoSupervisor.forEach((p, idx) => {
        menuText += `${idx + 1}️⃣ *${p.nome}*\n📅 Data: ${p.data}\n❓ Motivo: _${p.motivo}_\n\n`;
        sessionOptions.push({ id: p.id, nome: p.nome, data: p.data });
      });

      menuText += `👉 Digite o número correspondente para marcar como *RESOLVIDO* e suspender as cobranças.\n\n_(Ou digite *cancelar* para fechar o menu)_`;

      // Salvar sessão no banco
      const novaSessao = {
        step: "AWAITING_SELECTION",
        options: sessionOptions,
        created_at: new Date().toISOString()
      };

      await supabase
        .from('configuracoes_sistema')
        .upsert({
          chave: sessionKey,
          valor: JSON.stringify(novaSessao),
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });

      await enviarMensagemBot(menuText);
      return NextResponse.json({ success: true, message: "Menu de seleção enviado" });
    }

    // 4. Fallback padrão: Resposta de Cobrança Direta (Código legado mantido e executado caso não seja comando)
    const { data: ocorrencias, error: fetchError } = await supabase
      .from('ajustes_ponto')
      .select('*')
      .eq('resolvido', false);

    if (fetchError) {
      throw new Error(`Erro ao buscar ocorrencias: ${fetchError.message}`);
    }

    if (!ocorrencias || ocorrencias.length === 0) {
      return NextResponse.json({ success: true, message: "Nenhuma ocorrência em aberto" });
    }

    let resolvedMatch: any = null;
    let matchType: 'colaborador' | 'encarregado' | null = null;

    for (const ocorrencia of ocorrencias) {
      const cleanColabPhone = cleanPhone(ocorrencia.telefone);
      if (cleanColabPhone.length >= 8 && cleanColabPhone.slice(-8) === cleanIncoming.slice(-8)) {
        if (ocorrencia.data_ultima_cobranca !== null) {
          resolvedMatch = ocorrencia;
          matchType = 'colaborador';
          break;
        }
      }

      if (ocorrencia.colaborador_id) {
        const encDados = await buscarEncarregadoDoColaborador(ocorrencia.colaborador_id);
        if (encDados && encDados.encarregadoTelefone) {
          const cleanEncPhone = cleanPhone(encDados.encarregadoTelefone);
          if (cleanEncPhone.length >= 8 && cleanEncPhone.slice(-8) === cleanIncoming.slice(-8)) {
            if (ocorrencia.data_ultima_cobranca !== null) {
              resolvedMatch = ocorrencia;
              matchType = 'encarregado';
            }
          }
        }
      }
    }

    if (!resolvedMatch || !matchType) {
      return NextResponse.json({ success: true, message: "Correspondente ativo não encontrado ou não está em cobrança ativa" });
    }

    const dataAgora = new Date().toISOString();

    if (matchType === 'colaborador') {
      console.log(`✅ Ocorrência vinculada: Resposta do Colaborador ${resolvedMatch.nome} (ID: ${resolvedMatch.id})`);
      
      const { error: updateError } = await supabase
        .from('ajustes_ponto')
        .update({
          resposta_colaborador: rawResposta,
          data_resposta: dataAgora,
          updated_at: dataAgora
        })
        .eq('id', resolvedMatch.id);

      if (updateError) {
        throw new Error(`Erro ao salvar resposta do colaborador: ${updateError.message}`);
      }
    } else if (matchType === 'encarregado') {
      console.log(`✅ Ocorrência vinculada: Confirmação do Encarregado para ${resolvedMatch.nome} (ID: ${resolvedMatch.id})`);
      
      const { error: updateError } = await supabase
        .from('ajustes_ponto')
        .update({
          resposta_encarregado: rawResposta,
          data_resposta_encarregado: dataAgora,
          updated_at: dataAgora
        })
        .eq('id', resolvedMatch.id);

      if (updateError) {
        throw new Error(`Erro ao salvar resposta do encarregado: ${updateError.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedId: resolvedMatch.id, 
      matchType 
    });

  } catch (err: any) {
    console.error("❌ Erro em /api/ponto/resposta:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
