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
    const cleanSuffix = cleanIncoming.slice(-8);

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

    // 2. Verificar se o remetente está registrado no banco de dados (tabela usuarios)
    const { data: userRecords, error: userError } = await supabase
      .from('usuarios')
      .select('id, nome, role, cargo, nivel_acesso, status')
      .or(`telefone.ilike.%${cleanSuffix}%`);

    if (userError) {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    }

    const senderUser = userRecords && userRecords.length > 0 ? userRecords[0] : null;

    if (!senderUser) {
      console.log(`⚠️ Remetente ${cleanIncoming} não está registrado na tabela de usuários. Ignorando.`);
      return NextResponse.json({ success: true, message: "Ignorado: Remetente não cadastrado" });
    }

    // Identificar se o usuário é um Encarregado/Supervisor/Admin
    const isEncarregado = senderUser.role === 'GERENTE' || 
                         senderUser.role === 'ADMIN' || 
                         senderUser.role === 'SUPERVISOR' || 
                         senderUser.role === 'ENCARREGADO' || 
                         senderUser.role === 'LIDER' ||
                         (senderUser.cargo && /gerente|admin|supervisor|encarregado|lider|coordenador/i.test(senderUser.cargo));

    // 3. Fluxo de Sessão Interativa do Bot via configuracoes_sistema
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

        await enviarMensagemBot(`🔍 *Etapa 1/3 - Localizando Registro:*\nBuscando a ocorrência de ponto de *${itemEscolhido.nome}* para a data *${itemEscolhido.data}* no banco de dados...`);

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

        await enviarMensagemBot(`💾 *Etapa 2/3 - Registrando no CRM:*\nMarcando a pendência como resolvida e suspendendo a automação de cobranças diárias...`);

        // Limpar sessão
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);

        await enviarMensagemBot(`✅ *Etapa 3/3 - Processo Finalizado com Sucesso!*\nO ponto de *${itemEscolhido.nome}* referente ao dia *${itemEscolhido.data}* está marcado como *RESOLVIDO*. Obrigado pelo retorno! 👍`);
        return NextResponse.json({ success: true, message: "Ocorrência resolvida via bot" });
      } else {
        // Sessão expirada
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);
      }
    }

    // 4. Comando de inicialização para Encarregados / Devs: "-ponto" ou "/ponto"
    const isPontoCommand = rawResposta.toLowerCase() === '-ponto' || rawResposta.toLowerCase() === '/ponto';
    if (isPontoCommand) {
      const isDeveloper = senderUser.role === 'DEV' || 
                          senderUser.role === 'ADMIN' || 
                          senderUser.role === 'GERENTE' ||
                          (senderUser.cargo && /dev|desenvolvedor|admin|gerente/i.test(senderUser.cargo));

      if (isDeveloper) {
        console.log(`🤖 Gerando relatório global de ponto para o desenvolvedor/admin ${senderUser.nome}`);
        await enviarMensagemBot(`🔍 *Etapa 1/2 - Buscando Estatísticas:* Consultando as pendências gerais no banco de dados da Alicerce...`);
        
        // 1. Buscar todas as ocorrências pendentes
        const { data: allUnresolved, error: errUnresolved } = await supabase
          .from('ajustes_ponto')
          .select('*')
          .eq('resolvido', false);

        if (errUnresolved) throw errUnresolved;

        const cobradosAut = allUnresolved?.filter(x => !x.ajuste_pendente) || [];
        const pediuAjuste = allUnresolved?.filter(x => x.ajuste_pendente) || [];

        // 2. Ajustes por rota
        const { data: units } = await supabase.from('unidades').select('nome, rota');
        const unitToRouteMap: Record<string, string> = {};
        units?.forEach(u => {
          if (u.nome && u.rota) {
            unitToRouteMap[u.nome.toLowerCase().trim()] = u.rota;
          }
        });

        const colabIds = allUnresolved ? allUnresolved.map(x => x.colaborador_id).filter(Boolean) : [];
        const { data: colabsInfo } = colabIds.length > 0 
          ? await supabase.from('usuarios').select('id, unidade_alocacao').in('id', colabIds)
          : { data: [] };

        const colabToRouteMap: Record<string, string> = {};
        colabsInfo?.forEach(c => {
          if (c.unidade_alocacao) {
            const unitClean = c.unidade_alocacao.toLowerCase().trim();
            const route = unitToRouteMap[unitClean] || "Sem Rota";
            colabToRouteMap[c.id] = route;
          }
        });

        const routeCounts: Record<string, number> = {};
        allUnresolved?.forEach(o => {
          const route = (o.colaborador_id && colabToRouteMap[o.colaborador_id]) || "Sem Rota";
          routeCounts[route] = (routeCounts[route] || 0) + 1;
        });

        // 3. Colaborador que mais gerou ocorrências nos últimos 30 dias
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 30);
        const { data: recentAjustes } = await supabase
          .from('ajustes_ponto')
          .select('nome')
          .gte('created_at', dateLimit.toISOString());

        const occurrenceCounts: Record<string, number> = {};
        recentAjustes?.forEach(r => {
          if (r.nome) {
            occurrenceCounts[r.nome] = (occurrenceCounts[r.nome] || 0) + 1;
          }
        });

        let topColab = "Nenhum";
        let topCount = 0;
        Object.entries(occurrenceCounts).forEach(([name, count]) => {
          if (count > topCount) {
            topCount = count;
            topColab = name;
          }
        });

        let devText = `📊 *PAINEL GLOBAL - GESTÃO DE PONTO* 📊\n\n`;
        devText += `🤖 *Cobrados por automação:* ${cobradosAut.length} colaborador(es)\n`;
        devText += `📱 *Com ajuste pendente (MarqPonto):* ${pediuAjuste.length} colaborador(es)\n\n`;
        
        devText += `📍 *Pendências por Rota:*\n`;
        if (Object.keys(routeCounts).length > 0) {
          Object.entries(routeCounts).forEach(([route, count]) => {
            devText += `• Rota *${route}*: ${count} pendência(s)\n`;
          });
        } else {
          devText += `• Nenhuma rota com pendências.\n`;
        }

        devText += `\n🔥 *Top Colaborador (Últimos 30 dias):*\n`;
        devText += `• *${topColab}* (${topCount} ocorrência(s))\n\n`;
        devText += `💡 _Comando executado como Administrador/Desenvolvedor._`;

        await enviarMensagemBot(`✅ *Etapa 2/2 - Compilando Painel:* Gerando o relatório de pendências globais e rotas...`);
        await enviarMensagemBot(devText);
        return NextResponse.json({ success: true, message: "Relatório global de dev enviado" });
      }

      if (!isEncarregado) {
        console.log(`⚠️ Colaborador comum ${senderUser.nome} (${cleanIncoming}) tentou executar o comando -ponto.`);
        return NextResponse.json({ success: true, message: "Ignorado: Comando restrito a encarregados" });
      }

      console.log(`🤖 Iniciando interação de comando -ponto para o encarregado ${cleanIncoming}`);
      await enviarMensagemBot(`🔍 *Etapa 1/3 - Mapeando Rota:* Localizando suas unidades de atuação e equipe...`);
      
      // Buscar rota/unidades do Encarregado
      const { data: encUnits } = await supabase.from('unidades')
        .select('nome, rota')
        .or(`encarregado_id.eq.${senderUser.id},responsavel_telefone.ilike.%${cleanSuffix}%`);

      const unitNames = encUnits ? encUnits.map(u => u.nome) : [];
      const routeNames = Array.from(new Set(encUnits?.map(u => u.rota).filter(Boolean) || []));

      let routeColabs: any[] = [];
      if (unitNames.length > 0) {
        const { data: usersInRoute } = await supabase.from('usuarios')
          .select('id, nome, status, unidade_alocacao')
          .eq('status', 'ATIVO')
          .in('unidade_alocacao', unitNames);
        routeColabs = usersInRoute || [];
      }

      await enviarMensagemBot(`📊 *Etapa 2/3 - Verificando Pendências:* Cruzando dados de equipe com ocorrências de ponto em aberto...`);

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
          if (cleanEncPhone.length >= 8 && cleanEncPhone.slice(-8) === cleanSuffix) {
            pendenciasDoSupervisor.push({
              id: o.id,
              nome: o.nome,
              data: o.data_referencia,
              motivo: o.motivo || "Ajuste Geral",
              ajuste_pendente: o.ajuste_pendente
            });
          }
        }
      }

      let encText = `📋 *GESTÃO DE PONTO - SUA ROTA* 📋\n`;
      encText += `📍 *Rota(s):* ${routeNames.join(", ") || "Sem Rota"}\n`;
      encText += `👥 *Total de Colaboradores:* ${routeColabs.length}\n`;
      encText += `⚠️ *Pendências Ativas:* ${pendenciasDoSupervisor.length}\n\n`;

      if (routeColabs.length > 0) {
        encText += `👥 *Lista de Colaboradores na Rota:*\n`;
        routeColabs.forEach(c => {
          const hasPendency = pendenciasDoSupervisor.some(p => p.nome === c.nome);
          encText += `• ${c.nome} (${c.unidade_alocacao || "Sem Unidade"}) ${hasPendency ? "⚠️ *Pendente*" : "✅ OK"}\n`;
        });
        encText += `\n`;
      }

      if (pendenciasDoSupervisor.length === 0) {
        encText += `🎉 Excelente! Nenhuma pendência de ponto na sua rota no momento.`;
        await enviarMensagemBot(`✅ *Etapa 3/3 - Finalizando:* Carregando relatório de rota...`);
        await enviarMensagemBot(encText);
        return NextResponse.json({ success: true, message: "Relatório de encarregado enviado (sem pendencias)" });
      }

      encText += `👉 *Selecione o número correspondente abaixo para marcar como RESOLVIDO:*\n\n`;
      
      const sessionOptions: any[] = [];
      pendenciasDoSupervisor.forEach((p, idx) => {
        const flagAjuste = p.ajuste_pendente ? " (Ajuste no App)" : "";
        encText += `${idx + 1}️⃣ *${p.nome}*${flagAjuste}\n📅 Data: ${p.data}\n❓ Motivo: _${p.motivo}_\n\n`;
        sessionOptions.push({ id: p.id, nome: p.nome, data: p.data });
      });

      encText += `_(Ou digite *cancelar* para fechar o menu)_`;

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

      await enviarMensagemBot(`✅ *Etapa 3/3 - Finalizando:* Carregando painel e menu interativo...`);
      await enviarMensagemBot(encText);
      return NextResponse.json({ success: true, message: "Menu de seleção enviado" });
    }

    // 5. Se o remetente for Encarregado e enviou outra mensagem (fora da sessão e sem comando)
    if (isEncarregado) {
      console.log(`🤖 Encarregado ${senderUser.nome} enviou mensagem genérica. Enviando instrução de comando.`);
      await enviarMensagemBot("Olá! Sou o *Thoth*, seu assistente virtual da Alicerce. 🤖\n\nPara consultar as pendências de ponto dos colaboradores sob sua responsabilidade, envie o comando: *-ponto*");
      return NextResponse.json({ success: true, message: "Resposta de instrução enviada ao encarregado" });
    }

    // 6. Fluxo para Colaboradores Comuns (Verificar se ativo em cobrança)
    const { data: ocorrencias, error: fetchError } = await supabase
      .from('ajustes_ponto')
      .select('*')
      .eq('resolvido', false)
      .not('data_ultima_cobranca', 'is', null);

    if (fetchError) {
      throw new Error(`Erro ao buscar ocorrencias: ${fetchError.message}`);
    }

    // Encontrar ocorrência ativa vinculada ao colaborador
    const resolvedMatch = (ocorrencias || []).find(o => {
      const oPhoneClean = cleanPhone(o.telefone);
      return oPhoneClean.length >= 8 && oPhoneClean.slice(-8) === cleanSuffix;
    });

    if (!resolvedMatch) {
      console.log(`⚠️ Colaborador ${senderUser.nome} (${cleanIncoming}) não possui cobrança de ponto ativa. Ignorando.`);
      return NextResponse.json({ success: true, message: "Ignorado: Colaborador não está em cobrança ativa" });
    }

    const dataAgora = new Date().toISOString();

    console.log(`✅ Ocorrência vinculada: Resposta do Colaborador ${resolvedMatch.nome} (ID: ${resolvedMatch.id})`);
    
    // Salvar resposta do colaborador no banco
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

    // Buscar dados do encarregado para orientar o colaborador
    const encDados = await buscarEncarregadoDoColaborador(resolvedMatch.colaborador_id);
    const nomeEncarregado = encDados?.encarregadoNome || "seu Encarregado";

    // Buscar histórico das últimas 3 interações com o colaborador
    const { data: previousInteractions } = await supabase
      .from('ajustes_ponto')
      .select('data_referencia, motivo, resposta_colaborador, resolvido')
      .eq('colaborador_id', resolvedMatch.colaborador_id)
      .not('resposta_colaborador', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(3);

    let historicoTexto = "";
    if (previousInteractions && previousInteractions.length > 0) {
      historicoTexto = previousInteractions.map((p, idx) => 
        `Ocorrência ${idx + 1}: Dia ${p.data_referencia} (${p.motivo}) - Colaborador respondeu: "${p.resposta_colaborador}" (Resolvido? ${p.resolvido ? 'Sim' : 'Não'})`
      ).join("\n");
    } else {
      historicoTexto = "Sem interações anteriores registradas.";
    }

    // Retornar a ação de resposta da IA para o n8n gerar e enviar
    return NextResponse.json({ 
      success: true, 
      action: "send_ai_response",
      updatedId: resolvedMatch.id,
      colaborador_nome: resolvedMatch.nome,
      data_referencia: resolvedMatch.data_referencia,
      motivo: resolvedMatch.motivo || "Ajuste Geral",
      encarregado_nome: nomeEncarregado,
      resposta_colaborador: rawResposta,
      telefone: cleanIncoming,
      historico_interacoes: historicoTexto
    });

  } catch (err: any) {
    console.error("❌ Erro em /api/ponto/resposta:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
