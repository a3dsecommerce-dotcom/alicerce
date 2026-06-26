import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { webhookUrl, ...data } = payload;
    
    if (!webhookUrl) {
      return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
    }

    // 1. Obter credenciais da Evolution API das variáveis de ambiente (process.env)
    const evolutionUrl = process.env.EVOLUTION_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const rawInstance = process.env.EVOLUTION_INSTANCE || "";
    const evolutionInstance = rawInstance === "b3fc1313-37c6-465f-8641-9ca0c5e1dd51" ? "ALICERCE" : rawInstance;

    const enrichedData = {
      ...data,
      evolutionUrl,
      evolutionApiKey,
      evolutionInstance
    };

    console.log(`📡 Backend Proxying Webhook to n8n: ${webhookUrl}`);
    console.log(`💬 Enriquecido com Evolution URL: ${evolutionUrl ? "Configurado" : "Ausente"}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedData)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`n8n returned status ${response.status}: ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error proxying webhook to n8n:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
