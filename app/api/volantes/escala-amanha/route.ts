/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { addDays, format } from 'date-fns';

export async function POST(req: Request) {
  try {
    // 1. Validar a autenticação (Sessão do Usuário do Supabase)
    let isAuthorized = false;
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
      if (!authError && user) {
        // Apenas gerência ou master (Nível 3+) pode autorizar o disparo
        const nivel = Number(user.nivel || user.user_metadata?.nivel || 1);
        const role = String(user.role || user.user_metadata?.role || "").toUpperCase();
        const cargo = String(user.cargo || user.user_metadata?.cargo || "").toUpperCase();
        
        if (nivel >= 3 || role.includes('GERENTE') || role.includes('ADMIN') || cargo.includes('GERENTE') || cargo.includes('ADMIN') || role.includes('MASTER')) {
          isAuthorized = true;
        }
      }
    } catch (authErr) {
      console.error("Erro ao autenticar usuário da sessão:", authErr);
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Apenas gerentes e administradores podem autorizar o disparo da escala." }, { status: 403 });
    }

    // 2. Obter data do dia seguinte (Amanhã)
    // Usamos o fuso horário de Brasília/SP para o cálculo
    const dateSp = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const tomorrowDate = addDays(dateSp, 1);
    const tomorrowStr = format(tomorrowDate, 'yyyy-MM-dd');

    console.log(`📅 Buscando escala para o dia seguinte: ${tomorrowStr}`);

    // 3. Buscar todas as escalas cadastradas para amanhã
    const { data: escalas, error: dbError } = await supabase
      .from('escala_volantes')
      .select('*')
      .eq('data', tomorrowStr);

    if (dbError) {
      return NextResponse.json({ error: "Erro ao buscar escalas no banco de dados: " + dbError.message }, { status: 500 });
    }

    if (!escalas || escalas.length === 0) {
      return NextResponse.json({ error: `Nenhuma escala encontrada para amanhã (${format(tomorrowDate, 'dd/MM/yyyy')}). Certifique-se de cadastrar as escalas antes de disparar.` }, { status: 400 });
    }

    // 4. Obter a URL do Webhook do n8n nas configurações do sistema
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'N8N_ESCALA_AMANHA_WEBHOOK_URL')
      .single();

    const webhookUrl = config?.valor || "https://n8n-n8n.rvwwep.easypanel.host/webhook/escala-amanha";

    // 5. Preparar payload consolidado para o n8n
    const payload = {
      data: tomorrowStr,
      data_formatada: format(tomorrowDate, 'dd/MM/yyyy'),
      total_volantes: escalas.length,
      autorizado_por: "Central de Operações / RH",
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

    // 6. Enviar para o n8n
    console.log(`📡 Disparando escala do dia seguinte para o n8n no webhook ${webhookUrl}...`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`⚠️ Erro ao disparar escala do dia seguinte no n8n: Status ${response.status}`, errText);
      return NextResponse.json({ error: "Erro na resposta do webhook do n8n: " + errText }, { status: 502 });
    }

    console.log(`✅ Escala do dia seguinte disparada com sucesso via n8n.`);
    return NextResponse.json({ 
      success: true, 
      message: `Escala de amanhã (${payload.data_formatada}) com ${payload.total_volantes} volantes enviada com sucesso!`,
      webhook: webhookUrl
    });

  } catch (err: any) {
    console.error("❌ Erro na API /api/volantes/escala-amanha:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
