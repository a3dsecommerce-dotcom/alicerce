/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // 1. Validar a autenticação (Sessão do Usuário do Supabase)
    let isAuthorized = false;
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
      if (!authError && user) {
        isAuthorized = true;
      }
    } catch (authErr) {
      console.error("Erro ao autenticar usuário da sessão:", authErr);
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. Obter payload
    const { volanteNome, unidadeNome, substituindoNome, horario, insalubridade, grupoJid: customGrupoJid } = await req.json().catch(() => ({}));

    if (!volanteNome || !unidadeNome) {
      return NextResponse.json({ error: "Faltam parâmetros obrigatórios (volanteNome, unidadeNome)" }, { status: 400 });
    }

    // 3. Determinar o Grupo JID do WhatsApp
    let grupoJid = customGrupoJid;
    if (!grupoJid) {
      const { data: config } = await supabase
        .from('configuracoes_sistema')
        .select('valor')
        .eq('chave', 'WHATSAPP_GRUPO_VOLANTES_JID')
        .single();
      if (config && config.valor) {
        grupoJid = config.valor;
      }
    }

    if (!grupoJid) {
      return NextResponse.json({ error: "JID do grupo de volantes não configurado no sistema." }, { status: 400 });
    }

    // 4. Carregar chaves do Evolution das variáveis de ambiente
    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const evolutionInstance = process.env.EVOLUTION_INSTANCE || "";

    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      return NextResponse.json({ error: "Evolution API não configurada no servidor." }, { status: 500 });
    }

    // 5. Formatar mensagem da Ordem de Serviço
    const insalubridadeTexto = insalubridade ? `${insalubridade}%` : "Não Informada/Isento";
    const substituindoTexto = substituindoNome && substituindoNome.trim() !== "" ? substituindoNome.toUpperCase() : "NÃO INFORMADO (COBERTURA GERAL)";

    const messageText = `*📢 ORDEM DE SERVIÇO - VOLANTE*\n\n👤 *Volante:* ${volanteNome.toUpperCase()}\n📍 *Unidade de Atendimento:* ${unidadeNome.toUpperCase()}\n👥 *Substituindo:* ${substituindoTexto}\n🕒 *Horário:* ${horario || "07:00 às 17:00"}\n⚠️ *Insalubridade:* ${insalubridadeTexto}\n\n_Mensagem enviada automaticamente pelo Alicerce ERP._`;

    // 6. Disparar para a Evolution API
    console.log(`📡 Enviando Ordem de Serviço para o grupo/número ${grupoJid}...`);
    const response = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": evolutionApiKey
      },
      body: JSON.stringify({
        number: grupoJid,
        text: messageText,
        delay: 1200
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`⚠️ Erro ao enviar OS via Evolution API: Status ${response.status}`, errText);
      return NextResponse.json({ error: "Erro ao disparar mensagem na Evolution API: " + errText }, { status: 502 });
    }

    console.log(`✅ Ordem de Serviço enviada com sucesso para ${grupoJid}`);
    return NextResponse.json({ success: true, message: "Ordem de serviço enviada com sucesso!" });

  } catch (err: any) {
    console.error("❌ Erro na API /api/volantes/os:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
