/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // 1. Validar a autenticação (Sessão do Usuário do Supabase ou Cookie customizado auth_token)
    let isAuthorized = false;
    let userId = "";

    try {
      // Tentar por Supabase Auth
      const supabaseServer = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
      if (!authError && user) {
        userId = user.id;
        isAuthorized = true;
      }
    } catch (authErr) {
      console.error("Erro ao autenticar usuário via Supabase Auth:", authErr);
    }

    // Fallback para Cookie customizado auth_token
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const mockToken = cookieStore.get('auth_token')?.value;
        if (mockToken && mockToken.startsWith('al_sovereign_')) {
          userId = mockToken.replace('al_sovereign_', '');
          isAuthorized = true;
        }
      } catch (cookieErr) {
        console.error("Erro ao obter cookie auth_token:", cookieErr);
      }
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
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;

    if (!evolutionUrl || !evolutionApiKey || !evolutionInstance) {
      return NextResponse.json({ error: "Evolution API não configurada no servidor." }, { status: 500 });
    }

    // 5. Formatar mensagem da Ordem de Serviço
    const insalubridadeTexto = insalubridade ? `${insalubridade}%` : "Não Informada/Isento";
    const isVagaAberta = !substituindoNome || 
      substituindoNome.trim() === "" || 
      substituindoNome.toUpperCase() === "NÃO INFORMADO" || 
      substituindoNome.toUpperCase() === "NÃO INFORMADA" || 
      substituindoNome.toUpperCase().includes("VAGA ABERTA");

    const substituindoTexto = isVagaAberta ? "VAGA ABERTA (COBERTURA GERAL)" : substituindoNome.toUpperCase();

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
