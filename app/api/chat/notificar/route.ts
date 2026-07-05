import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { senderName, receiverPhone, text } = await req.json();

    const evolutionUrl = process.env.EVOLUTION_URL || "https://n8n-evolution-api.rvwwep.easypanel.host";
    const apiKey = process.env.EVOLUTION_API_KEY || "4C907275BB7E-4A43-8806-B6A599FE6E50";
    const instance = process.env.EVOLUTION_INSTANCE || "ALICERCE";

    if (!receiverPhone) {
      return NextResponse.json({ error: "Telefone do destinatário ausente" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = receiverPhone.replace(/[^0-9]/g, "");

    const url = `${evolutionUrl}/message/sendText/${instance}`;
    const payload = {
      number: cleanPhone,
      text: `💬 *Alicerce Ops - Chat Interno*\n\nVocê recebeu uma mensagem de *${senderName}*:\n\n_"${text}"_\n\n👉 Para responder, acesse: https://portal.alicerce.cloud`
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await res.text();
      console.error("Evolution API error during chat notification:", errorText);
      return NextResponse.json({ error: "Erro ao enviar notificação WhatsApp" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Error in chat notification endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
