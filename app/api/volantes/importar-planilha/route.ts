/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';

function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let entry = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry);
      entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry);
      result.push(row);
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }
  if (entry || row.length > 0) {
    row.push(entry);
    result.push(row);
  }
  return result;
}

function cleanName(name: string): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/PROFª/g, "PROFESSORA")
    .replace(/PROF\./g, "PROFESSOR")
    .replace(/EMEF\./g, "EMEF")
    .replace(/CEMEI\./g, "CEMEI")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSheetDate(str: string, defaultYear = 2026): string {
  if (!str) return new Date().toISOString().split('T')[0];
  const parts = str.trim().split(/[\/-]/);
  if (parts.length === 3) {
    const day = parts[0].trim().padStart(2, '0');
    const month = parts[1].trim().padStart(2, '0');
    const yearStr = parts[2].trim();
    let year = parseInt(yearStr);
    if (isNaN(year) || year < 2000 || year > 2100) {
      const lastTwo = parseInt(yearStr.substring(yearStr.length - 2));
      if (!isNaN(lastTwo) && lastTwo >= 24 && lastTwo <= 30) {
        year = 2000 + lastTwo;
      } else {
        year = defaultYear;
      }
    }
    return `${year}-${month}-${day}`;
  }
  return str;
}

export async function POST() {
  try {
    // 1. Validar a autenticação (Sessão do Usuário do Supabase)
    let isAuthorized = false;
    try {
      const supabaseServer = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
      if (!authError && user) {
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
      return NextResponse.json({ error: "Apenas gerentes e administradores podem importar dados da planilha." }, { status: 403 });
    }

    // 2. Obter URL da planilha configurada ou usar o padrão
    const { data: config } = await supabase
      .from('configuracoes_sistema')
      .select('valor')
      .eq('chave', 'GOOGLE_SHEET_VOLANTES_URL')
      .single();

    let rawSheetUrl = config?.valor || "https://docs.google.com/spreadsheets/d/1ECLotf1TaeGfUIn-NpSPCzGS46szqM3XFwHk_zIxFrg/edit?usp=sharing";
    
    // Converter URL de visualização para exportação CSV se necessário
    let csvUrl = rawSheetUrl;
    if (rawSheetUrl.includes("/edit")) {
      const base = rawSheetUrl.split("/edit")[0];
      csvUrl = `${base}/export?format=csv`;
    }

    console.log("Fetching spreadsheet from:", csvUrl);
    const sheetRes = await fetch(csvUrl);
    if (!sheetRes.ok) {
      return NextResponse.json({ error: `Falha ao baixar planilha da URL: ${csvUrl}. Status: ${sheetRes.status}` }, { status: 502 });
    }

    const csvText = await sheetRes.text();
    const rows = parseCSV(csvText);
    if (rows.length <= 1) {
      return NextResponse.json({ error: "A planilha está vazia ou não pôde ser lida." }, { status: 400 });
    }

    const headers = rows[0];
    const timestampIdx = headers.indexOf('Carimbo de data/hora');
    const statusIdx = headers.indexOf('STATUS');
    const volanteIdx = headers.indexOf('VOLANTE');
    const escolaIdx = headers.indexOf('NOME A ESCOLA:');
    const funcaoIdx = headers.indexOf('FUNÇÃO DO VOLANTE:');
    const diaIdx = headers.indexOf('DIA QUE PRECISA DO FUNCIONÁRIO:');
    const horarioIdx = headers.indexOf('HORÁRIO DO VOLANTE: Entrada/Intervalo/Saída');
    const motivoIdx = headers.indexOf('MOTIVO:');
    const obsIdx = headers.indexOf('Observação:');
    const faltosoIdx = headers.indexOf('Nome do funcionário que faltou:');

    if (escolaIdx === -1 || diaIdx === -1) {
      return NextResponse.json({ error: "Colunas essenciais ('NOME A ESCOLA:' ou 'DIA QUE PRECISA DO FUNCIONÁRIO:') não foram encontradas na planilha." }, { status: 400 });
    }

    // 3. Buscar unidades para indexar e realizar cruzamento de nomes
    const { data: dbUnits } = await supabase.from('unidades').select('nome');
    const dbUnitsMap = new Map<string, string>();
    if (dbUnits) {
      for (const u of dbUnits) {
        dbUnitsMap.set(cleanName(u.nome), u.nome);
      }
    }

    // 4. Buscar registros existentes para de-duplicação
    const { data: existingReqs } = await supabase
      .from('requisicoes_volantes')
      .select('unidade_destino, data_inicio, colaborador_substituido_nome, funcao_substituicao');
    
    const existingFingerprints = new Set<string>();
    if (existingReqs) {
      for (const r of existingReqs) {
        const fingerprint = `${cleanName(r.unidade_destino)}|${r.data_inicio}|${cleanName(r.colaborador_substituido_nome)}|${cleanName(r.funcao_substituicao)}`;
        existingFingerprints.add(fingerprint);
      }
    }

    // 5. Processar e mapear dados da planilha
    const newRecords: any[] = [];
    let skippedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue;

      const rawEscola = row[escolaIdx] ? row[escolaIdx].trim() : "";
      if (!rawEscola) continue;

      const rawDia = row[diaIdx] ? row[diaIdx].trim() : "";
      if (!rawDia) continue;

      const parsedDia = parseSheetDate(rawDia);
      const rawFaltoso = row[faltosoIdx] ? row[faltosoIdx].trim() : "";
      const rawFuncao = row[funcaoIdx] ? row[funcaoIdx].trim() : "ASG";

      // Gerar fingerprint da planilha para evitar duplicados
      const cleanEscolaVal = cleanName(rawEscola);
      const cleanFaltosoVal = cleanName(rawFaltoso || "NÃO INFORMADO");
      const cleanFuncaoVal = cleanName(rawFuncao);
      
      const sheetFingerprint = `${cleanEscolaVal}|${parsedDia}|${cleanFaltosoVal}|${cleanFuncaoVal}`;
      if (existingFingerprints.has(sheetFingerprint)) {
        skippedCount++;
        continue;
      }

      // Tentar associar nome correto da unidade
      const matchedEscola = dbUnitsMap.get(cleanEscolaVal) || rawEscola.toUpperCase().trim();

      // Mapeamento de Status
      const rawStatus = row[statusIdx] ? row[statusIdx].trim().toUpperCase() : "";
      const rawVolante = row[volanteIdx] ? row[volanteIdx].trim().toUpperCase() : "";
      
      let mappedStatus = "PENDENTE";
      if (rawStatus === "ATENDIDO" || (rawVolante && rawVolante !== "SEM VOLANTE" && rawVolante !== "SEM  VOLANTE")) {
        mappedStatus = "ATENDIDA";
      } else if (rawStatus === "NÃO ATENDIDO" || rawStatus === "SEM NECESSIDADE") {
        mappedStatus = "NAO_ATENDIDA";
      } else if (rawStatus === "ATENDIDO PARCIAL") {
        mappedStatus = "PENDENTE";
      }

      // Horários e Observações no motivo detalhado
      const rawMotivo = row[motivoIdx] ? row[motivoIdx].trim() : "";
      const rawHorario = row[horarioIdx] ? row[horarioIdx].trim() : "";
      const rawObs = row[obsIdx] ? row[obsIdx].trim() : "";

      let motivoConsolidado = rawMotivo;
      if (rawHorario) motivoConsolidado += ` | Horário: ${rawHorario}`;
      if (rawObs) motivoConsolidado += ` | Obs: ${rawObs}`;

      const isAtestado = rawMotivo.toLowerCase().includes("atestado") || rawObs.toLowerCase().includes("atestado");
      
      let asgPorcentagem = null;
      if (cleanFuncaoVal.includes("ASG") || cleanFuncaoVal.includes("SERVICOS GERAIS")) {
        asgPorcentagem = 20;
        if (rawMotivo.includes("40%") || rawObs.includes("40%")) asgPorcentagem = 40;
      }

      // Carimbo de data/hora
      const rawTimestamp = row[timestampIdx] ? row[timestampIdx].trim() : "";
      let parsedTimestamp = new Date().toISOString();
      if (rawTimestamp) {
        const parts = rawTimestamp.split(' ');
        if (parts.length > 0) {
          const datePart = parseSheetDate(parts[0]);
          parsedTimestamp = datePart + (parts[1] ? `T${parts[1]}.000Z` : 'T00:00:00.000Z');
        }
      }

      newRecords.push({
        unidade_destino: matchedEscola,
        data_inicio: parsedDia,
        data_fim: parsedDia,
        quantidade_necessaria: 1,
        motivo: motivoConsolidado || "Solicitação Importada",
        status: mappedStatus,
        colaboradores_alocados: [],
        prioridade: "NORMAL",
        created_at: parsedTimestamp,
        quem_requisitou: "PLANILHA",
        colaborador_substituido_nome: rawFaltoso || "NÃO INFORMADO",
        is_atestado: isAtestado,
        asg_porcentagem: asgPorcentagem,
        funcao_substituicao: rawFuncao.toUpperCase()
      });
    }

    console.log(`🚀 Preparando para inserir ${newRecords.length} novas requisições. Ignoradas: ${skippedCount}`);

    // 6. Inserir em lotes no Supabase para evitar limites de timeout/tamanho
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('requisicoes_volantes')
        .insert(batch);
      
      if (insertError) {
        console.error(`Erro ao inserir lote ${i / batchSize}:`, insertError);
        return NextResponse.json({ error: `Erro parcial de inserção: ${insertError.message}. Inserido até o momento: ${insertedCount}` }, { status: 500 });
      }
      insertedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      total_rows: rows.length - 1,
      imported: insertedCount,
      skipped: skippedCount
    });

  } catch (err: any) {
    console.error("Erro na API /api/volantes/importar-planilha:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
