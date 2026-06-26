/* eslint-disable @typescript-eslint/no-explicit-any */
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

function obterApenasDigitos(tel: string): string {
  if (!tel) return "";
  return tel.replace(/\D/g, "");
}

function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i: number, j: number;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function getSimilarity(a: string, b: string): number {
  const distance = getLevenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return (maxLen - distance) / maxLen;
}

function compararNomesExato(nomeP: string, nomeB: string): boolean {
  const np = normalizarNome(nomeP);
  const nb = normalizarNome(nomeB);
  
  if (np === nb) return true;
  
  const removerConectores = (n: string) => n.replace(/\b(de|da|do|das|dos|e)\b/g, "").replace(/\s+/g, " ").trim();
  const npSemC = removerConectores(np);
  const nbSemC = removerConectores(nb);
  
  if (npSemC === nbSemC) return true;
  
  const npSemEspacos = npSemC.replace(/\s+/g, "");
  const nbSemEspacos = nbSemC.replace(/\s+/g, "");
  if (npSemEspacos === nbSemEspacos) return true;
  
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

function compararNomesFuzzy(nomeP: string, nomeB: string): boolean {
  const np = normalizarNome(nomeP);
  const nb = normalizarNome(nomeB);
  return getSimilarity(np, nb) >= 0.8;
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

    const timestamp = Date.now();
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&t=${timestamp}`;
    console.log(`📡 Baixando planilha CSV em tempo real de: ${csvUrl}`);

    const res = await fetch(csvUrl, { cache: 'no-store' });
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

      let nomeParaBuscar = nomePlanilha;
      if (normalizarNome(nomePlanilha) === "jocelene rosa") {
        nomeParaBuscar = "Jocilene Rosa";
      }

      // 1. Tentar correspondência exata ou por substring
      let colabMatch = userList.find(u => compararNomesExato(nomeParaBuscar, u.nome));
      
      // 2. Se não encontrar, tentar correspondência fuzzy (Levenshtein)
      if (!colabMatch) {
        colabMatch = userList.find(u => compararNomesFuzzy(nomeParaBuscar, u.nome));
      }

      // Normaliza data de DD/MM/YYYY para YYYY-MM-DD
      let dataRef = dataPlanilha;
      if (dataPlanilha && dataPlanilha.includes('/')) {
        const partes = dataPlanilha.split('/');
        if (partes.length === 3) {
          const dia = partes[0].trim().padStart(2, '0');
          const mes = partes[1].trim().padStart(2, '0');
          const ano = partes[2].trim();
          dataRef = `${ano}-${mes}-${dia}`;
        }
      }

      const ajustePendentePlanilha = String(row['Ajuste Pendente'] || '').trim().toUpperCase();
      const isAjustePendente = ajustePendentePlanilha === 'SIM';

      if (colabMatch) {
        novosAjustes.push({
          colaborador_id: colabMatch.id,
          nome: String(nomePlanilha).toUpperCase().trim(),
          telefone: colabMatch.telefone || "Sem Telefone",
          data_referencia: dataRef,
          motivo: motivoPlanilha,
          resolvido: false,
          autorizado: true,
          ajuste_pendente: isAjustePendente
        });
      } else {
        novosAjustes.push({
          colaborador_id: null,
          nome: String(nomePlanilha).toUpperCase().trim(),
          telefone: "5500000000000",
          data_referencia: dataRef,
          motivo: motivoPlanilha + " (Colaborador não encontrado no banco)",
          resolvido: false,
          autorizado: true,
          ajuste_pendente: isAjustePendente
        });
      }
    }

    if (novosAjustes.length > 0) {
      // Deduplica o lote em memória para evitar redundâncias na mesma execução (alinhado com unique constraint)
      const novosAjustesUnicos: any[] = [];
      for (const novo of novosAjustes) {
        const jaExisteNoLote = novosAjustesUnicos.some((u: any) => {
          const matchData = u.data_referencia === novo.data_referencia;
          if (!matchData) return false;

          return u.colaborador_id && novo.colaborador_id
            ? u.colaborador_id === novo.colaborador_id
            : normalizarNome(u.nome) === normalizarNome(novo.nome);
        });

        if (!jaExisteNoLote) {
          novosAjustesUnicos.push(novo);
        }
      }

      console.log(`Verificando e sincronizando ${novosAjustesUnicos.length} registros únicos no Supabase...`);
      const { data: existentes, error: errExistentes } = await supabase
        .from('ajustes_ponto')
        .select('id, colaborador_id, nome, data_referencia, telefone');
      
      if (errExistentes) throw errExistentes;
      const existentesList = existentes || [];

      for (const novo of novosAjustesUnicos) {
        // Encontra se já existe ocorrência no mesmo dia para o colaborador (por ID ou por Nome normalizado)
        const matchExistente = existentesList.find((ext: any) => {
          const matchData = ext.data_referencia === novo.data_referencia;
          if (!matchData) return false;

          if (ext.colaborador_id && novo.colaborador_id) {
            return ext.colaborador_id === novo.colaborador_id;
          }

          const extNomeNorm = normalizarNome(ext.nome);
          const novoNomeNorm = normalizarNome(novo.nome);
          return extNomeNorm === novoNomeNorm;
        });

        if (matchExistente) {
          const { error: errUpd } = await supabase
            .from('ajustes_ponto')
            .update({
              colaborador_id: novo.colaborador_id,
              nome: novo.nome,
              telefone: novo.telefone,
              motivo: novo.motivo,
              ajuste_pendente: novo.ajuste_pendente,
              autorizado: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', matchExistente.id);
          
          if (errUpd) throw errUpd;
        } else {
          const { data: insertedData, error: errIns } = await supabase
            .from('ajustes_ponto')
            .insert([novo])
            .select();
          
          if (errIns) throw errIns;
          
          if (insertedData && insertedData[0]) {
            existentesList.push(insertedData[0]);
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: novosAjustes.length });
  } catch (err: any) {
    console.error("❌ Erro ao sincronizar planilha:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
