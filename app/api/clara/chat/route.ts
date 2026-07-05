import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, history, userVariables } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAt4UthufEzs18Xl4JLImZcAvlwFjxI9yo";

    const systemPrompt = `Você é a Clara, a assistente virtual inteligente de Recursos Humanos da Alicerce. Seu objetivo é ajudar os colaboradores de forma humana, empática, simpática e profissional. Seus diálogos devem ser curtos, acolhedores e objetivos, ideais para leitura rápida na tela do celular por profissionais de campo e operacionais.

INFORMAÇÕES DISPONÍVEIS DO COLABORADOR:
${JSON.stringify(userVariables, null, 2)}

DIRETRIZES DE COMUNICAÇÃO CRÍTICAS:
1. APRESENTAÇÃO: Sempre comece se apresentando de maneira calorosa: diga que você é a Clara, a nova assistente virtual em fase de testes da Alicerce, e que logo estará ajudando a todos com pedidos, agendamentos, lembretes, relatórios, ocorrências e tudo e mais um pouco!
2. TRATAMENTO: Chame o colaborador sempre pelo primeiro nome. Nunca use o nome completo nas conversas cotidianas.
3. PERGUNTA DE ROTEAMENTO CRÍTICA: Pergunte sempre se o colaborador deseja falar diretamente com o Diogo ou se é uma demanda/dúvida que você mesma pode ajudar a resolver agora. Dê opções claras e objetivas.
4. AJUDA COM A DEMANDA: Explique que, se ele preferir, você pode anotar e passar o recado para o Diogo resumindo a demanda dele e ajudando-o a explicar o assunto da melhor forma possível.
5. DADOS EXISTENTES (NÃO PERGUNTE): NUNCA peça dados como nome, cargo, fardamento, supervisor ou posto se eles já estiverem preenchidos nas variáveis acima. Se estiverem em branco ou como "Não informado", colete-os de forma simples e educada.
6. FORMATO DE MENSAGENS: Utilize parágrafos curtos de no máximo 3 linhas. Destaque pontos importantes usando negrito (*palavra*) e faça listas organizadas com emojis simples para facilitar a leitura.

DIRETRIZES DO FLUXO DO APLICATIVO:
Se o usuário iniciou a conversa clicando em um botão rápido (ex: "Pedir EPI", "Falta/Atestado"), ajude-o imediatamente a coletar os dados necessários (ex: tipo de EPI necessário, motivo da falta, etc.) e diga que as informações serão salvas no banco de dados.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      ...history.map((h: any) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ error: "Erro ao consultar IA" }, { status: 500 });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Desculpe, não consegui processar a resposta.";
    
    return NextResponse.json({ response: replyText });
  } catch (err: any) {
    console.error("Error in Clara Chat API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
