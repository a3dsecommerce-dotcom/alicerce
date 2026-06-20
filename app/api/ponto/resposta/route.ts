import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Função auxiliar para limpar telefone e deixar apenas dígitos
function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
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
    
    // Se o número recebido for inválido ou curto demais, abortar
    if (cleanIncoming.length < 8) {
      return NextResponse.json({ error: "Invalid telephone number format" }, { status: 400 });
    }

    const match = ocorrencias.find(o => {
      const cleanDb = cleanPhone(o.telefone);
      if (cleanDb.length < 8) return false;
      
      // Compara os últimos 8 dígitos (evita problemas de DDI +55 ou DDD ausente)
      return cleanDb.slice(-8) === cleanIncoming.slice(-8);
    });

    if (!match) {
      console.log(`ℹ️ Nenhuma ocorrência em aberto correspondente ao telefone ${telefone}`);
      return NextResponse.json({ success: true, message: "Colaborador correspondente não encontrado" });
    }

    // 4. Atualizar a ocorrência com a resposta do colaborador
    console.log(`✅ Ocorrência vinculada: ${match.nome} (ID: ${match.id})`);
    
    const { error: updateError } = await supabase
      .from('ajustes_ponto')
      .update({
        resposta_colaborador: resposta,
        data_resposta: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', match.id);

    if (updateError) {
      throw new Error(`Erro ao salvar resposta no banco: ${updateError.message}`);
    }

    return NextResponse.json({ success: true, updatedId: match.id });
  } catch (err: any) {
    console.error("❌ Erro em /api/ponto/resposta:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
