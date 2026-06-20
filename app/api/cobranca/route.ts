import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { webhookUrl, ...data } = payload;
    
    if (!webhookUrl) {
      return NextResponse.json({ error: "webhookUrl is required" }, { status: 400 });
    }

    console.log(`📡 Backend Proxying Webhook to n8n: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
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
