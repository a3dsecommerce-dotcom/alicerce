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

    const isDeveloper = senderUser.role === 'DEV' || 
                        senderUser.role === 'ADMIN' || 
                        senderUser.role === 'GERENTE' ||
                        (senderUser.cargo && /dev|desenvolvedor|admin|gerente/i.test(senderUser.cargo));

    const isDiretor = senderUser.role === 'DIRETOR' || 
                      (senderUser.cargo && /diretor/i.test(senderUser.cargo));

    // 3. Fluxo de Sessão Interativa do Bot via configuracoes_sistema
    const sessionKey = `PONTO_INTERACT_SESSION_${cleanIncoming}`;
    const sessionKeyVolante = `VOLANTE_INTERACT_SESSION_${cleanIncoming}`;

    const [dbSessionRes, dbSessionVolanteRes] = await Promise.all([
      supabase.from('configuracoes_sistema').select('valor').eq('chave', sessionKey).maybeSingle(),
      supabase.from('configuracoes_sistema').select('valor').eq('chave', sessionKeyVolante).maybeSingle()
    ]);

    const dbSession = dbSessionRes?.data;
    const dbSessionVolante = dbSessionVolanteRes?.data;

    const isPontoCommand = rawResposta.toLowerCase() === '-ponto' || rawResposta.toLowerCase() === '/ponto';
    const isVolanteCommand = rawResposta.toLowerCase() === '-volante' || rawResposta.toLowerCase() === '/volante';

    // Se for um comando novo, limpa qualquer sessão anterior para não interceptar
    if (isPontoCommand || isVolanteCommand) {
      await Promise.all([
        supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey),
        supabase.from('configuracoes_sistema').delete().eq('chave', sessionKeyVolante)
      ]);
    }

    // --- TRATAMENTO DE SESSÃO VOLANTE ---
    if (dbSessionVolante && dbSessionVolante.valor && !isPontoCommand && !isVolanteCommand) {
      let sessionData: any = {};
      try {
        sessionData = typeof dbSessionVolante.valor === 'string' ? JSON.parse(dbSessionVolante.valor) : dbSessionVolante.valor;
      } catch {
        sessionData = {};
      }

      const isExpired = sessionData.created_at 
        ? (Date.now() - new Date(sessionData.created_at).getTime()) > 15 * 60 * 1000 
        : true;

      if (!isExpired) {
        if (rawResposta.toLowerCase() === 'cancelar') {
          await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKeyVolante);
          await enviarMensagemBot("❌ Solicitação de volante cancelada.");
          return NextResponse.json({ success: true, message: "Sessão Volante cancelada pelo usuário" });
        }

        // --- SELECT_UNIT ---
        if (sessionData.step === "SELECT_UNIT") {
          const opt = parseInt(rawResposta);
          const list = sessionData.units || [];
          if (isNaN(opt) || opt < 1 || opt > list.length) {
            await enviarMensagemBot(`⚠️ Opção inválida. Digite o número correspondente (1 a ${list.length}) ou cancela.`);
            return NextResponse.json({ success: true });
          }
          const chosenUnit = list[opt - 1];

          const { data: colabs } = await supabase
            .from('usuarios')
            .select('id, nome, cargo, percentual_insalubridade')
            .eq('status', 'ATIVO')
            .ilike('unidade_alocacao', `%${chosenUnit.nome.replace(/ESCOLA|MUNICIPAL|POSTO|CENTRO|EME|EMEF/gi, "").trim()}%`);

          if (!colabs || colabs.length === 0) {
            await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKeyVolante);
            await enviarMensagemBot(`⚠️ Não encontrei colaboradores ativos em *${chosenUnit.nome}* para substituir.`);
            return NextResponse.json({ success: true });
          }

          let msg = `👥 *Selecionar Colaborador (Unidade: ${chosenUnit.nome}):*\nDigite o número correspondente ao colaborador a ser substituído:\n\n`;
          colabs.forEach((c, idx) => {
            msg += `${idx + 1}️⃣ *${c.nome}* (${c.cargo || 'Sem Cargo'})\n`;
          });
          msg += `\n_(Ou digite cancelar)_`;

          sessionData.step = "SELECT_COLABORADOR";
          sessionData.selected_unit = chosenUnit;
          sessionData.colaboradores = colabs;
          sessionData.created_at = new Date().toISOString();

          await supabase.from('configuracoes_sistema').upsert({
            chave: sessionKeyVolante,
            valor: JSON.stringify(sessionData),
            updated_at: new Date().toISOString()
          }, { onConflict: 'chave' });

          await enviarMensagemBot(msg);
          return NextResponse.json({ success: true });
        }

        // --- SELECT_COLABORADOR ---
        if (sessionData.step === "SELECT_COLABORADOR") {
          const opt = parseInt(rawResposta);
          const list = sessionData.colaboradores || [];
          if (isNaN(opt) || opt < 1 || opt > list.length) {
            await enviarMensagemBot(`⚠️ Opção inválida. Digite o número correspondente (1 a ${list.length}) ou cancela.`);
            return NextResponse.json({ success: true });
          }
          const chosenColab = list[opt - 1];

          let msg = `❓ *Etapa 3/6 - Selecionar Motivo:*\nQual o motivo da substituição? Digite o número:\n\n`;
          msg += `1️⃣ Falta Não Justificada\n`;
          msg += `2️⃣ Atestado Médico\n`;
          msg += `3️⃣ Férias\n`;
          msg += `4️⃣ Outros\n\n`;
          msg += `_(Ou digite cancelar)_`;

          sessionData.step = "SELECT_MOTIVO";
          sessionData.selected_colab = chosenColab;
          sessionData.created_at = new Date().toISOString();

          await supabase.from('configuracoes_sistema').upsert({
            chave: sessionKeyVolante,
            valor: JSON.stringify(sessionData),
            updated_at: new Date().toISOString()
          }, { onConflict: 'chave' });

          await enviarMensagemBot(msg);
          return NextResponse.json({ success: true });
        }

        // --- SELECT_MOTIVO ---
        if (sessionData.step === "SELECT_MOTIVO") {
          const opt = parseInt(rawResposta);
          if (isNaN(opt) || opt < 1 || opt > 4) {
            await enviarMensagemBot(`⚠️ Opção inválida. Digite o número correspondente (1 a 4) ou cancela.`);
            return NextResponse.json({ success: true });
          }
          const motives = ["FALTA", "ATESTADO", "FERIAS", "OUTROS"];
          const chosenMotivo = motives[opt - 1];

          let msg = `📅 *Etapa 4/6 - Data da Substituição:*\nPara qual data você precisa do volante? Digite a data (ex: *Hoje*, *Amanhã*, ou no formato *DD/MM/AAAA*):\n\n_(Ou digite cancelar)_`;

          sessionData.step = "INPUT_DATE";
          sessionData.motivo = chosenMotivo;
          sessionData.created_at = new Date().toISOString();

          await supabase.from('configuracoes_sistema').upsert({
            chave: sessionKeyVolante,
            valor: JSON.stringify(sessionData),
            updated_at: new Date().toISOString()
          }, { onConflict: 'chave' });

          await enviarMensagemBot(msg);
          return NextResponse.json({ success: true });
        }

        // --- INPUT_DATE ---
        if (sessionData.step === "INPUT_DATE") {
          let parsedDate = rawResposta;
          if (rawResposta.toLowerCase() === 'hoje') {
            parsedDate = new Date().toISOString().split('T')[0];
          } else if (rawResposta.toLowerCase() === 'amanhã' || rawResposta.toLowerCase() === 'amanha') {
            const tom = new Date();
            tom.setDate(tom.getDate() + 1);
            parsedDate = tom.toISOString().split('T')[0];
          }

          let msg = `⏰ *Etapa 5/6 - Horário/Turno:*\nQual o horário/turno de trabalho do volante? (ex: *Diurno*, *Noturno*, ou *07:00 - 17:00*):\n\n_(Ou digite cancelar)_`;

          sessionData.step = "INPUT_TIME";
          sessionData.date = parsedDate;
          sessionData.created_at = new Date().toISOString();

          await supabase.from('configuracoes_sistema').upsert({
            chave: sessionKeyVolante,
            valor: JSON.stringify(sessionData),
            updated_at: new Date().toISOString()
          }, { onConflict: 'chave' });

          await enviarMensagemBot(msg);
          return NextResponse.json({ success: true });
        }

        // --- INPUT_TIME ---
        if (sessionData.step === "INPUT_TIME") {
          const time = rawResposta;

          let msg = `📝 *Etapa 6/6 - Resumo do Pedido de Volante:*\n\n`;
          msg += `• 🏢 *Unidade:* ${sessionData.selected_unit.nome}\n`;
          msg += `• 👤 *Substituir:* ${sessionData.selected_colab.nome} (${sessionData.selected_colab.cargo || 'ASG'})\n`;
          msg += `• ❓ *Motivo:* ${sessionData.motivo}\n`;
          msg += `• 📅 *Data:* ${sessionData.date}\n`;
          msg += `• ⏰ *Horário/Turno:* ${time}\n\n`;
          msg += `👉 Digite *CONFIRMAR* para oficializar o pedido de volante e enviar a Falta do colaborador para o RH, ou *CANCELAR*.`;

          sessionData.step = "CONFIRM";
          sessionData.time = time;
          sessionData.created_at = new Date().toISOString();

          await supabase.from('configuracoes_sistema').upsert({
            chave: sessionKeyVolante,
            valor: JSON.stringify(sessionData),
            updated_at: new Date().toISOString()
          }, { onConflict: 'chave' });

          await enviarMensagemBot(msg);
          return NextResponse.json({ success: true });
        }

        // --- CONFIRM ---
        if (sessionData.step === "CONFIRM") {
          if (rawResposta.toLowerCase() !== 'confirmar') {
            await enviarMensagemBot(`⚠️ Digite *CONFIRMAR* para finalizar ou *cancelar* para desistir.`);
            return NextResponse.json({ success: true });
          }

          // 1. Inserir em requisicoes_volantes
          const asgPct = sessionData.selected_colab.percentual_insalubridade 
            ? parseInt(sessionData.selected_colab.percentual_insalubridade.replace(/\D/g, '')) 
            : null;
          const asg_porcentagem = (asgPct !== null && !isNaN(asgPct)) ? asgPct : null;

          const { error: errVol } = await supabase.from('requisicoes_volantes').insert({
            solicitante_id: senderUser.id,
            unidade_destino: sessionData.selected_unit.nome,
            data_inicio: sessionData.date,
            data_fim: sessionData.date,
            quantidade_necessaria: 1,
            motivo: sessionData.motivo,
            status: 'PENDENTE',
            prioridade: 'NORMAL',
            quem_requisitou: senderUser.role === 'DIRETOR' ? 'DIRETOR' : 'ENCARREGADO',
            colaborador_substituido_nome: sessionData.selected_colab.nome,
            is_atestado: sessionData.motivo === 'ATESTADO',
            asg_porcentagem,
            funcao_substituicao: sessionData.selected_colab.cargo || 'ASG'
          });

          if (errVol) throw errVol;

          // 2. Inserir falta em informativos_operacionais
          await supabase.from('informativos_operacionais').insert([{
            tipo: 'FALTA',
            unidade: sessionData.selected_unit.nome,
            data: sessionData.date,
            periodo: sessionData.time.toUpperCase().includes("NOTURNO") ? 'NOTURNO' : 'DIURNO',
            horario: sessionData.time,
            colaborador_ausente_id: sessionData.selected_colab.id,
            colaborador_ausente_nome: sessionData.selected_colab.nome,
            tem_atestado: sessionData.motivo === 'ATESTADO',
            dias_atestado: sessionData.motivo === 'ATESTADO' ? 1 : 0,
            justificada: sessionData.motivo === 'ATESTADO' || sessionData.motivo === 'FERIAS',
            observacoes: `LANÇAMENTO AUTOMÁTICO BOT: Solicitado Volante em substituição a ${sessionData.selected_colab.nome} (Motivo: ${sessionData.motivo}).`,
            criado_por_id: senderUser.id,
            criado_por_nome: senderUser.nome
          }]);

          // 3. Inserir falta em tickets_sla para a aba do RH do CRM
          await supabase.from('tickets_sla').insert({
            assunto: `FALTA REGISTRADA VIA BOT: ${sessionData.selected_colab.nome}`,
            descricao: `Falta registrada automaticamente via solicitação de Volante no WhatsApp.\nUnidade: ${sessionData.selected_unit.nome}\nMotivo: ${sessionData.motivo}\nData: ${sessionData.date}\nHorário: ${sessionData.time}`,
            prioridade: 'ALTA',
            status: 'PENDENTE',
            setor_destino: 'RH Recursos Humanos',
            responsavel_citado: sessionData.selected_colab.nome,
            criado_por: `Assistente Thoth (${senderUser.nome})`,
            secretaria: sessionData.selected_unit.secretaria || "SEMED"
          });

          // Limpar sessão
          await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKeyVolante);

          await enviarMensagemBot(`✅ *Processo Concluído com Sucesso!* 🚀\n\nSeu pedido de volante foi registrado e a falta de *${sessionData.selected_colab.nome}* foi enviada para a aba de faltas do RH.`);
          return NextResponse.json({ success: true, message: "Pedido de volante enviado" });
        }
      } else {
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKeyVolante);
      }
    }

    // --- TRATAMENTO DE SESSÃO PONTO ---
    if (dbSession && dbSession.valor && !isPontoCommand && !isVolanteCommand) {
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

        await enviarMensagemBot(`✅ *Ponto Resolvido!* 🚀\n\nO ponto de *${itemEscolhido.nome}* referente ao dia *${itemEscolhido.data}* foi marcado como *RESOLVIDO* no sistema. As cobranças automáticas foram desativadas.`);
        return NextResponse.json({ success: true, message: "Ocorrência resolvida via bot" });
      } else {
        // Sessão expirada
        await supabase.from('configuracoes_sistema').delete().eq('chave', sessionKey);
      }
    }

    // 4. Comando de inicialização para Encarregados / Devs: "-ponto" ou "/ponto"
    if (isPontoCommand) {
      if (isDeveloper) {
        console.log(`🤖 Gerando relatório global de ponto para o desenvolvedor/admin ${senderUser.nome}`);
        
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

        await enviarMensagemBot(devText);
        return NextResponse.json({ success: true, message: "Relatório global de dev enviado" });
      }

      if (!isEncarregado) {
        console.log(`⚠️ Colaborador comum ${senderUser.nome} (${cleanIncoming}) tentou executar o comando -ponto.`);
        return NextResponse.json({ success: true, message: "Ignorado: Comando restrito a encarregados" });
      }

      console.log(`🤖 Iniciando interação de comando -ponto para o encarregado ${cleanIncoming}`);
      
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

      await enviarMensagemBot(encText);
      return NextResponse.json({ success: true, message: "Menu de seleção enviado" });
    }

    // 4.1 Comando /volante ou -volante
    if (isVolanteCommand) {
      const isAuthorized = senderUser.role === 'DEV' || 
                           senderUser.role === 'ADMIN' || 
                           senderUser.role === 'GERENTE' ||
                           senderUser.role === 'SUPERVISOR' ||
                           senderUser.role === 'ENCARREGADO' || 
                           senderUser.role === 'DIRETOR' ||
                           senderUser.role === 'LIDER' ||
                           (senderUser.cargo && /dev|admin|gerente|supervisor|encarregado|diretor|lider/i.test(senderUser.cargo));

      if (!isAuthorized) {
        await enviarMensagemBot("⚠️ Desculpe, o comando /volante é restrito a Diretores e Encarregados.");
        return NextResponse.json({ success: true, message: "Comando /volante negado" });
      }

      await enviarMensagemBot(`🔍 *Iniciando solicitação de Volante...*`);

      // Buscar unidades vinculadas
      const { data: userUnits } = await supabase.from('unidades')
        .select('id, nome, secretaria')
        .or(`encarregado_id.eq.${senderUser.id},diretor.ilike.%${senderUser.nome}%,responsavel_telefone.ilike.%${cleanSuffix}%`);

      if (!userUnits || userUnits.length === 0) {
        await enviarMensagemBot("⚠️ Não encontrei nenhuma unidade vinculada ao seu cadastro no momento.");
        return NextResponse.json({ success: true });
      }

      if (userUnits.length === 1) {
        const chosenUnit = userUnits[0];
        // Pular etapa de seleção da unidade e buscar colaboradores
        const { data: colabs } = await supabase
          .from('usuarios')
          .select('id, nome, cargo, percentual_insalubridade')
          .eq('status', 'ATIVO')
          .ilike('unidade_alocacao', `%${chosenUnit.nome.replace(/ESCOLA|MUNICIPAL|POSTO|CENTRO|EME|EMEF/gi, "").trim()}%`);

        if (!colabs || colabs.length === 0) {
          await enviarMensagemBot(`⚠️ Não encontrei colaboradores ativos nesta unidade para substituir.`);
          return NextResponse.json({ success: true });
        }

        let msg = `👥 *Etapa 1/5 - Selecionar Colaborador (Unidade: ${chosenUnit.nome}):*\nDigite o número correspondente ao colaborador a ser substituído:\n\n`;
        colabs.forEach((c, idx) => {
          msg += `${idx + 1}️⃣ *${c.nome}* (${c.cargo || 'Sem Cargo'})\n`;
        });
        msg += `\n_(Ou digite cancelar)_`;

        const novaSessao = {
          step: "SELECT_COLABORADOR",
          selected_unit: chosenUnit,
          colaboradores: colabs,
          created_at: new Date().toISOString()
        };

        await supabase.from('configuracoes_sistema').upsert({
          chave: sessionKeyVolante,
          valor: JSON.stringify(novaSessao),
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });

        await enviarMensagemBot(msg);
        return NextResponse.json({ success: true });
      } else {
        // Enviar menu de unidades
        let msg = `🏢 *Etapa 1/6 - Selecionar Unidade:*\nIdentifiquei as seguintes unidades sob sua gestão. Digite o número correspondente:\n\n`;
        userUnits.forEach((u, idx) => {
          msg += `${idx + 1}️⃣ *${u.nome}*\n`;
        });
        msg += `\n_(Ou digite cancelar)_`;

        const novaSessao = {
          step: "SELECT_UNIT",
          units: userUnits,
          created_at: new Date().toISOString()
        };

        await supabase.from('configuracoes_sistema').upsert({
          chave: sessionKeyVolante,
          valor: JSON.stringify(novaSessao),
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });

        await enviarMensagemBot(msg);
        return NextResponse.json({ success: true });
      }
    }

    // 5. Se o remetente for Encarregado ou Diretor e enviou outra mensagem (fora da sessão e sem comando)
    if (isEncarregado || isDiretor) {
      console.log(`🤖 Gestor ${senderUser.nome} enviou mensagem genérica. Enviando instrução de comando.`);
      if (isDeveloper) {
        await enviarMensagemBot("Olá! Sou o *Thoth*, seu assistente virtual da Alicerce. 🤖\n\nComo Administrador/Dev, você pode usar os comandos:\n• */ponto* - Relatório global e por rotas\n• */volante* - Processo de solicitação de volante");
      } else if (isDiretor) {
        await enviarMensagemBot("Olá! Sou o *Thoth*, seu assistente virtual da Alicerce. 🤖\n\nPara solicitar um volante para sua unidade de ensino, envie o comando: */volante*");
      } else {
        await enviarMensagemBot("Olá! Sou o *Thoth*, seu assistente virtual da Alicerce. 🤖\n\nPara consultar as pendências de ponto da sua rota, envie o comando: */ponto* (ou *-ponto*)\n\nPara solicitar um volante de cobertura para uma unidade, envie o comando: */volante*");
      }
      return NextResponse.json({ success: true, message: "Resposta de instrução enviada ao gestor" });
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
      console.log(`⚠️ Colaborador ${senderUser.nome} (${cleanIncoming}) não possui cobrança de ponto ativa. Encaminhando para Clara.`);
      
      // Encaminha a mensagem para o webhook da Clara no n8n
      fetch("https://n8n-n8n.rvwwep.easypanel.host/webhook/atendimento-clara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "messages.upsert",
          instance: "ALICERCE",
          data: {
            key: {
              remoteJid: `${cleanIncoming}@s.whatsapp.net`,
              fromMe: false,
              id: "FORWARDED_" + Date.now()
            },
            message: {
              conversation: rawResposta
            },
            messageType: "conversation"
          }
        })
      }).catch(err => console.error("Erro ao encaminhar para Clara:", err));

      return NextResponse.json({ success: true, message: "Encaminhado para Clara" });
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
