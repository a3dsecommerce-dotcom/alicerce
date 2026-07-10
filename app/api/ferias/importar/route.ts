import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL da planilha não informada.' }, { status: 400 });
    }

    let csvUrl = url.trim();
    
    // Normalize Google Sheets URL to export as CSV
    if (csvUrl.includes('/edit')) {
      csvUrl = csvUrl.replace(/\/edit.*/, '/export?format=csv');
    } else if (csvUrl.includes('/pubhtml')) {
      csvUrl = csvUrl.replace('/pubhtml', '/pub?output=csv');
    }

    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Não foi possível acessar a planilha. Verifique se o compartilhamento com link público está ativo no Google Drive.' 
      }, { status: response.status });
    }

    const csvText = await response.text();

    return NextResponse.json({ csv: csvText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno ao importar planilha.' }, { status: 500 });
  }
}
