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

    console.log(`💬 Recebida resposta de WhatsApp de: ${telefone} - Conteúdo: "${resposta}"`);

    // 2. Buscar todas as ocorrências não resolvidas
    const { data: ocorrencias, error: fetchError } = await supabase
      .from('ajustes_ponto')
      .select('*')
      .eq('resolvido', false);

    if (fetchError) {
      throw new Error(`Erro ao buscar ocorrencias: ${fetchError.message}`);
    }

    if (!ocorrencias || ocorrencias.length === 0) {
      console.log(`ℹ️ Nenhuma ocorrência em aberto encontrada para associar à resposta.`);
      return NextResponse.json({ success: true, message: "Nenhuma ocorrência em aberto" });
    }

    // 3. Fazer cruzamento aproximado de número de telefone (sufixo dos últimos 8 dígitos)
    const cleanIncoming = cleanPhone(telefone);
    
    if (cleanIncoming.length < 8) {
      return NextResponse.json({ error: "Invalid telephone number format" }, { status: 400 });
    }

    let resolvedMatch: any = null;
    let matchType: 'colaborador' | 'encarregado' | null = null;

    // Buscar correspondência de telefone entre colaboradores ou supervisores
    for (const ocorrencia of ocorrencias) {
      // 3.1. Verificar se quem respondeu é o Colaborador
      const cleanColabPhone = cleanPhone(ocorrencia.telefone);
      if (cleanColabPhone.length >= 8 && cleanColabPhone.slice(-8) === cleanIncoming.slice(-8)) {
        if (ocorrencia.data_ultima_cobranca !== null) {
          resolvedMatch = ocorrencia;
          matchType = 'colaborador';
          break; // Colaboradores cobrados ativos têm prioridade de resposta
        }
      }

      // 3.2. Verificar se quem respondeu é o Encarregado
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
      console.log(`ℹ️ Nenhuma ocorrência em cobrança ativa correspondente ao telefone ${telefone} (colaborador ou encarregado).`);
      return NextResponse.json({ success: true, message: "Correspondente ativo não encontrado ou não está em cobrança ativa" });
    }

    const dataAgora = new Date().toISOString();

    // 4. Atualizar a ocorrência com a resposta correspondente
    if (matchType === 'colaborador') {
      console.log(`✅ Ocorrência vinculada: Resposta do Colaborador ${resolvedMatch.nome} (ID: ${resolvedMatch.id})`);
      
      const { error: updateError } = await supabase
        .from('ajustes_ponto')
        .update({
          resposta_colaborador: resposta,
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
          resposta_encarregado: resposta,
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
