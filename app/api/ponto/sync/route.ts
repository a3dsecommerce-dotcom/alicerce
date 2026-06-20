import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function parseCSV(csvText: string) {
  const lines = csvText.split(/\r?\n/);
  if (lines.length === 0) return [];
  
  // Extrai cabeçalhos e remove aspas
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // Divide por vírgulas considerando possíveis aspas simples/duplas
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === 0 || !values[0]) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }
  return rows;
}

function normalizarNome(nome: string): string {
  if (!nome) return "";
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/['`\-]/g, " ")        // substitui apóstrofos e hífens por espaço
    .replace(/\s+/g, " ")           // remove múltiplos espaços
    .trim();
}

function compararNomes(nomeP: string, nomeB: string): boolean {
  const np = normalizarNome(nomeP);
  const nb = normalizarNome(nomeB);
  
  if (np === nb) return true;
  
  const removerConectores = (n: string) => n.replace(/\b(de|da|do|das|dos|e)\b/g, "").replace(/\s+/g, " ").trim();
  const npSemC = removerConectores(np);
  const nbSemC = removerConectores(nb);
  
  if (npSemC === nbSemC) return true;
  
  if (npSemC.length > 5 && nbSemC.length > 5) {
    if (npSemC.includes(nbSemC) || nbSemC.includes(npSemC)) return true;
  }

  const npSemEspacos = npSemC.replace(/\s+/g, "");
  const nbSemEspacos = nbSemC.replace(/\s+/g, "");
  if (npSemEspacos.length > 5 && nbSemEspacos.length > 5) {
    if (npSemEspacos.includes(nbSemEspacos) || nbSemEspacos.includes(npSemEspacos)) return true;
  }
  
  const partesP = npSemC.split(" ");
  const partesB = nbSemC.split(" ");
  if (partesP.length >= 2 && partesB.length >= 2) {
    const primeiroP = partesP[0];
    const ultimoP = partesP[partesP.length - 1];
    const primeiroB = partesB[0];
    const ultimoB = partesB[partesB.length - 1];
    
    if (primeiroP === primeiroB && ultimoP === ultimoB) return true;
  }

  return false;
}

export async function GET() {
  try {
    console.log("🚀 Iniciando sincronização do Google Sheets com Supabase...");

    // 1. Buscar ID da Planilha nas configurações
    let sheetId = "1xovtMOpwLF1HPgts-Yn5oHZsk0YIxU42JqGb8VWy8Qo";
    const { data: dbConfig } = await supabase
      .from("configuracoes_sistema")
      .select("valor")
      .eq("chave", "GOOGLE_SHEETS_SPREADSHEET_ID")
      .single();
    
    if (dbConfig && dbConfig.valor) {
      sheetId = dbConfig.valor;
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    console.log(`📡 Baixando planilha CSV de: ${csvUrl}`);

    const res = await fetch(csvUrl);
    if (!res.ok) {
      throw new Error(`Falha ao baixar planilha do Google: ${res.statusText}`);
    }

    const csvText = await res.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json({ success: true, message: "Planilha vazia ou sem dados." });
    }

    // 2. Buscar usuários do banco para fazer a vinculação de telefones
    const { data: usuarios, error: errUser } = await supabase
      .from('usuarios')
      .select('id, nome, telefone');
    
    if (errUser) throw errUser;
    const userList = usuarios || [];

    const novosAjustes: any[] = [];

    for (const row of rows) {
      // Mapeia colunas da planilha: Funcionario / Colaborador / Nome
      const nomePlanilha = row['Funcionario'] || row['Colaborador'] || row['Nome'] || Object.values(row)[1];
      const dataPlanilha = row['Data'] || row['data_ocorrencia'] || Object.values(row)[0];
      const motivoPlanilha = row['Registros'] ? `Possui ${row['Registros']} batidas (Necessita ajuste)` : row['Ajuste Pendente'] || "Ajuste de Ponto Requerido";

      if (!nomePlanilha) continue;

      // Encontrar correspondência aproximada do nome
      const colabMatch = userList.find(u => compararNomes(nomePlanilha, u.nome));

      // Normaliza data de DD/MM/YYYY para YYYY-MM-DD
      let dataRef = dataPlanilha;
      if (dataPlanilha && dataPlanilha.includes('/')) {
        const partes = dataPlanilha.split('/');
        if (partes.length === 3) {
          dataRef = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
      }

      if (colabMatch) {
        novosAjustes.push({
          colaborador_id: colabMatch.id,
          nome: colabMatch.nome,
          telefone: colabMatch.telefone || "Sem Telefone",
          data_referencia: dataRef,
          motivo: motivoPlanilha,
          resolvido: false,
          autorizado: false
        });
      } else {
        novosAjustes.push({
          nome: nomePlanilha,
          telefone: "5500000000000",
          data_referencia: dataRef,
          motivo: motivoPlanilha + " (Colaborador não encontrado no banco)",
          resolvido: false,
          autorizado: false
        });
      }
    }

    if (novosAjustes.length > 0) {
      console.log(`Upserting ${novosAjustes.length} registros no Supabase...`);
      const { error: errInsert } = await supabase
        .from('ajustes_ponto')
        .upsert(novosAjustes, { onConflict: 'nome,data_referencia' });
      
      if (errInsert) throw errInsert;
    }

    return NextResponse.json({ success: true, count: novosAjustes.length });
  } catch (err: any) {
    console.error("❌ Erro ao sincronizar planilha:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
