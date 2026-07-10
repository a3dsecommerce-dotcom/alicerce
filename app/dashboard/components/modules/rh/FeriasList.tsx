"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Search, Upload, RefreshCw, Check, AlertCircle, Trash2, ShieldAlert, Users, Clock, MapPin, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FeriasListProps {
  colaboradores: any[]; // Active employees passed from useRHData
}

interface SheetImportedRow {
  nomePlanilha: string;
  colaboradorCorrespondente: any | null;
  dataInicio: string;
  dataFim: string;
  status: "Pendente" | "Confirmado" | "Erro";
  mensagem?: string;
}

export default function FeriasList({ colaboradores }: FeriasListProps) {
  const [activeSubTab, setActiveSubTab] = useState<"efetivo" | "importar" | "agendadas">("efetivo");
  
  // Google Sheets link states
  const [sheetUrl, setSheetUrl] = useState("");
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [importedRows, setImportedRows] = useState<SheetImportedRow[]>([]);
  const [globalDataInicio, setGlobalDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [globalDataFim, setGlobalDataFim] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  // Efetivo report states
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSecretaria, setFilterSecretaria] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("");
  
  // Database ferias state
  const [feriasDb, setFeriasDb] = useState<any[]>([]);
  const [loadingFerias, setLoadingFerias] = useState(false);

  // Load all vacations from database
  const loadFerias = async () => {
    setLoadingFerias(true);
    try {
      const { data, error } = await supabase
        .from('ferias_colaboradores')
        .select('*')
        .order('data_inicio', { ascending: true });
      if (!error && data) {
        setFeriasDb(data);
      }
    } catch (err) {
      console.error("Erro ao carregar férias:", err);
    } finally {
      setLoadingFerias(false);
    }
  };

  useEffect(() => {
    loadFerias();
  }, []);

  // Helper to normalize names for fuzzy matching
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  // Advanced fuzzy matching of a spreadsheet name against database collaborators
  const findMatch = (name: string) => {
    const normSearch = normalizeName(name);
    if (!normSearch) return null;

    // 1. Exact or normalized match
    let match = colaboradores.find(c => normalizeName(c.nome) === normSearch);
    if (match) return match;

    // 2. Starts with / contains match
    match = colaboradores.find(c => {
      const normColabName = normalizeName(c.nome);
      return normColabName.includes(normSearch) || normSearch.includes(normColabName);
    });
    if (match) return match;

    // 3. First name + last name match
    const searchParts = normSearch.split(" ");
    if (searchParts.length >= 2) {
      match = colaboradores.find(c => {
        const normColabName = normalizeName(c.nome);
        return normColabName.includes(searchParts[0]) && normColabName.includes(searchParts[searchParts.length - 1]);
      });
    }

    return match || null;
  };

  // Fetch and parse Google Sheets CSV
  const handleImportSheet = async () => {
    if (!sheetUrl.trim()) {
      toast.warning("Por favor, informe o link de compartilhamento da planilha.");
      return;
    }

    setLoadingSheet(true);
    try {
      const response = await fetch('/api/ferias/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetUrl })
      });

      const resData = await response.json();
      
      if (!response.ok) {
        throw new Error(resData.error || "Não foi possível acessar a planilha. Verifique se o compartilhamento com link público está ativo.");
      }

      const csvText = resData.csv;
      const lines = csvText.split(/\r?\n/);
      
      const rows: SheetImportedRow[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Simple comma/semicolon parser
        const columns = line.split(/[;,]/).map(c => c.replace(/^"|"$/g, '').trim());
        const rawName = columns[0];
        
        if (!rawName || rawName.toLowerCase() === "nome" || rawName.toLowerCase() === "colaborador" || rawName.toLowerCase() === "nome do colaborador") {
          continue; // Skip header
        }

        const match = findMatch(rawName);
        rows.push({
          nomePlanilha: rawName,
          colaboradorCorrespondente: match,
          dataInicio: globalDataInicio,
          dataFim: globalDataFim,
          status: match ? "Pendente" : "Erro",
          mensagem: match ? undefined : "Colaborador não cadastrado ou não ativo"
        });
      }

      if (rows.length === 0) {
        toast.info("Nenhum nome válido encontrado na primeira coluna da planilha.");
      } else {
        setImportedRows(rows);
        toast.success(`Importados ${rows.length} registros para validação.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao ler a planilha.");
    } finally {
      setLoadingSheet(false);
    }
  };

  // Sync global dates to all rows
  useEffect(() => {
    setImportedRows(prev => prev.map(r => ({
      ...r,
      dataInicio: r.dataInicio === prev[0]?.dataInicio ? globalDataInicio : r.dataInicio,
      dataFim: r.dataFim === prev[0]?.dataFim ? globalDataFim : r.dataFim
    })));
  }, [globalDataInicio, globalDataFim]);

  // Save selected holidays to Supabase
  const handleSaveFerias = async () => {
    const validRows = importedRows.filter(r => r.colaboradorCorrespondente && r.status === "Pendente");
    if (validRows.length === 0) {
      toast.warning("Nenhum registro válido pendente para salvar.");
      return;
    }

    const payload = validRows.map(r => ({
      colaborador_id: r.colaboradorCorrespondente.id,
      colaborador_nome: r.colaboradorCorrespondente.nome,
      data_inicio: r.dataInicio,
      data_fim: r.dataFim
    }));

    try {
      const { error } = await supabase.from('ferias_colaboradores').insert(payload);
      if (error) throw error;
      
      toast.success(`${payload.length} períodos de férias registrados com sucesso!`);
      setImportedRows([]);
      loadFerias();
      setActiveSubTab("agendadas");
    } catch (err: any) {
      toast.error("Erro ao registrar férias no banco: " + err.message);
    }
  };

  // Delete vacation record
  const handleDeleteFerias = async (id: string) => {
    if (!confirm("Confirmar a exclusão deste período de férias?")) return;
    try {
      const { error } = await supabase.from('ferias_colaboradores').delete().eq('id', id);
      if (error) throw error;
      toast.success("Férias removidas com sucesso.");
      loadFerias();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  // Calculate lists for Efetivo Disponível
  const getEfetivoReport = () => {
    const refDateTime = new Date(refDate + 'T00:00:00').getTime();

    // Find who is on vacation on the reference date
    const feriasAtivas = feriasDb.filter(f => {
      const inicioTime = new Date(f.data_inicio + 'T00:00:00').getTime();
      const fimTime = new Date(f.data_fim + 'T23:59:59').getTime();
      return refDateTime >= inicioTime && refDateTime <= fimTime;
    });

    const emFeriasIds = new Set(feriasAtivas.map(f => f.colaborador_id));

    // Filter active employees based on vacation and filters
    const todosAtivos = colaboradores.filter(c => c.status_ciclo === "ATIVO" || c.status === "ATIVO");

    const disponiveis = todosAtivos.filter(c => !emFeriasIds.has(c.id));
    const deFerias = todosAtivos.filter(c => emFeriasIds.has(c.id));

    // Apply department and unit filters
    const filterAndGroup = (list: any[]) => {
      return list.filter(c => {
        const matchSec = !filterSecretaria || (c.secretaria && c.secretaria.toUpperCase().includes(filterSecretaria.toUpperCase()));
        const matchUnit = !filterUnidade || (c.unidade_alocacao && c.unidade_alocacao.toUpperCase().includes(filterUnidade.toUpperCase()));
        return matchSec && matchUnit;
      });
    };

    return {
      disponiveis: filterAndGroup(disponiveis),
      deFerias: filterAndGroup(deFerias),
      totalGeral: todosAtivos.length
    };
  };

  const { disponiveis, deFerias, totalGeral } = getEfetivoReport();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Sub tabs navigation */}
      <div className="flex border-b border-white/5 pb-2 gap-4">
        <button
          onClick={() => setActiveSubTab("efetivo")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all relative ${activeSubTab === "efetivo" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <span className="flex items-center gap-2"><Users size={14} /> Efetivo Disponível</span>
          {activeSubTab === "efetivo" && <div className="absolute bottom-[-9px] left-0 w-full h-[2px] bg-orange-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab("importar")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all relative ${activeSubTab === "importar" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <span className="flex items-center gap-2"><Upload size={14} /> Sincronizar Google Sheets</span>
          {activeSubTab === "importar" && <div className="absolute bottom-[-9px] left-0 w-full h-[2px] bg-orange-500" />}
        </button>
        <button
          onClick={() => setActiveSubTab("agendadas")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all relative ${activeSubTab === "agendadas" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"}`}
        >
          <span className="flex items-center gap-2"><Calendar size={14} /> Férias Agendadas ({feriasDb.length})</span>
          {activeSubTab === "agendadas" && <div className="absolute bottom-[-9px] left-0 w-full h-[2px] bg-orange-500" />}
        </button>
      </div>

      {/* ================== SUB TAB: EFETIVO DISPONÍVEL ================== */}
      {activeSubTab === "efetivo" && (
        <div className="flex flex-col gap-6">
          {/* Filters section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-white/5">
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5 block">Data de Referência</label>
              <input 
                type="date"
                className="input-field w-full !h-11 font-black"
                value={refDate}
                onChange={e => setRefDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5 block">Filtrar por Secretaria</label>
              <input 
                type="text"
                placeholder="SEMED, SEMSA, etc..."
                className="input-field w-full !h-11 uppercase"
                value={filterSecretaria}
                onChange={e => setFilterSecretaria(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5 block">Filtrar por Unidade</label>
              <input 
                type="text"
                placeholder="Nome do posto de trabalho..."
                className="input-field w-full !h-11"
                value={filterUnidade}
                onChange={e => setFilterUnidade(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 bg-zinc-950/40 p-4 rounded-xl border border-white/5 justify-between">
              <div>
                <p className="text-[9px] font-black uppercase text-zinc-500">Indicadores Operacionais</p>
                <div className="flex gap-4 mt-1 text-[11px] font-black uppercase text-white">
                  <span>Ativos: <strong className="text-green-500">{disponiveis.length}</strong></span>
                  <span>Férias: <strong className="text-orange-500">{deFerias.length}</strong></span>
                </div>
              </div>
              <Clock size={20} className="text-zinc-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Workforce working today */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-green-500">Colaboradores em Atividade ({disponiveis.length})</h4>
              </div>

              <div className="bg-zinc-950/20 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-900/50 border-b border-white/5 text-[9px] font-black uppercase text-zinc-400">
                    <tr>
                      <th className="p-4 pl-6">Nome</th>
                      <th className="p-4">Cargo</th>
                      <th className="p-4">Secretaria / Unidade</th>
                      <th className="p-4">Turno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {disponiveis.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-all">
                        <td className="p-4 pl-6 font-bold text-white uppercase">{c.nome}</td>
                        <td className="p-4 uppercase">{c.cargo}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-[10px] text-zinc-400 uppercase">{c.secretaria || "N/A"}</span>
                            <span className="text-[11px] text-zinc-300 flex items-center gap-1"><MapPin size={10} className="text-zinc-500" /> {c.unidade_alocacao || "Não alocado"}</span>
                          </div>
                        </td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/10">{c.turno || "DIURNO"}</span></td>
                      </tr>
                    ))}
                    {disponiveis.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-zinc-500 font-bold uppercase">Nenhum colaborador ativo localizado com esses filtros.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workforce in Vacation */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-500">Afastados de Férias ({deFerias.length})</h4>
              
              <div className="bg-zinc-950/20 rounded-2xl border border-white/5 overflow-hidden p-4 flex flex-col gap-3">
                {deFerias.map((c, idx) => (
                  <div key={idx} className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex justify-between items-start gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-white uppercase leading-snug">{c.nome}</h5>
                      <p className="text-[10px] text-zinc-400 mt-1 uppercase font-semibold">{c.cargo} • {c.unidade_alocacao}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-orange-600/10 border border-orange-600/20 text-[9px] font-black uppercase text-orange-500">Em Férias</span>
                  </div>
                ))}
                {deFerias.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-6 font-bold uppercase">Ninguém de férias nesta data.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================== SUB TAB: IMPORTAR PLANILHA ================== */}
      {activeSubTab === "importar" && (
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900/40 border border-white/5 flex flex-col gap-4">
            <h4 className="text-sm font-black uppercase text-white">Importar Planejamento de Férias</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              Cole o link de compartilhamento da sua planilha Google. Certifique-se de que a planilha está configurada como <strong className="text-white">"Qualquer pessoa com o link pode ler"</strong>. O sistema irá ler a primeira coluna da planilha buscando os nomes dos colaboradores.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <input 
                type="text"
                placeholder="Ex: https://docs.google.com/spreadsheets/d/1A2B3C.../edit?usp=sharing"
                className="input-field flex-1 !h-12"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
              />
              <button
                onClick={handleImportSheet}
                disabled={loadingSheet}
                className="px-6 h-12 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-500 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/10"
              >
                {loadingSheet ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                Carregar Planilha
              </button>
            </div>
          </div>

          {importedRows.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 p-5 rounded-2xl bg-zinc-950/60 border border-white/5 justify-between items-center">
                <div className="flex gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Início das Férias (Geral)</label>
                    <input 
                      type="date"
                      className="input-field !h-10 text-xs font-black"
                      value={globalDataInicio}
                      onChange={e => setGlobalDataInicio(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-zinc-500 uppercase mb-1 block">Fim das Férias (Geral)</label>
                    <input 
                      type="date"
                      className="input-field !h-10 text-xs font-black"
                      value={globalDataFim}
                      onChange={e => setGlobalDataFim(e.target.value)}
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleSaveFerias}
                  className="px-8 py-3.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-500 transition-all flex items-center gap-2"
                >
                  <Check size={14} /> Confirmar e Salvar Lote ({importedRows.filter(r => r.status === "Pendente").length})
                </button>
              </div>

              <div className="bg-zinc-950/20 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-900/50 border-b border-white/5 text-[9px] font-black uppercase text-zinc-400">
                    <tr>
                      <th className="p-4 pl-6">Nome Planilha</th>
                      <th className="p-4">Colaborador Localizado no CRM</th>
                      <th className="p-4">Período de Férias</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                    {importedRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-white/5 transition-all ${row.status === 'Erro' ? 'bg-red-500/5' : ''}`}>
                        <td className="p-4 pl-6 uppercase text-zinc-400 font-bold">{row.nomePlanilha}</td>
                        <td className="p-4 font-bold text-white">
                          {row.colaboradorCorrespondente ? (
                            <div className="flex flex-col">
                              <span className="uppercase">{row.colaboradorCorrespondente.nome}</span>
                              <span className="text-[10px] text-zinc-500 font-normal uppercase mt-0.5">{row.colaboradorCorrespondente.cargo} • {row.colaboradorCorrespondente.unidade}</span>
                            </div>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1.5"><AlertCircle size={14} /> Não localizado</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="date"
                              className="input-field !h-9 text-xs font-black px-2 !w-32"
                              value={row.dataInicio}
                              onChange={e => {
                                const val = e.target.value;
                                setImportedRows(prev => prev.map((r, i) => i === idx ? { ...r, dataInicio: val } : r));
                              }}
                            />
                            <span>à</span>
                            <input 
                              type="date"
                              className="input-field !h-9 text-xs font-black px-2 !w-32"
                              value={row.dataFim}
                              onChange={e => {
                                const val = e.target.value;
                                setImportedRows(prev => prev.map((r, i) => i === idx ? { ...r, dataFim: val } : r));
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-4">
                          {row.status === "Erro" ? (
                            <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-[9px] uppercase tracking-wide">
                              Rejeitado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[9px] uppercase tracking-wide">
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================== SUB TAB: FÉRIAS AGENDADAS ================== */}
      {activeSubTab === "agendadas" && (
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Escala de Planejamento de Férias</h4>
          
          <div className="bg-zinc-950/20 rounded-2xl border border-white/5 overflow-hidden">
            {loadingFerias ? (
              <div className="p-20 text-center">
                <RefreshCw size={24} className="animate-spin text-orange-500 mx-auto" />
              </div>
            ) : feriasDb.length === 0 ? (
              <p className="p-20 text-center text-zinc-500 font-bold uppercase text-xs">Nenhum período de férias registrado no momento.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-900/50 border-b border-white/5 text-[9px] font-black uppercase text-zinc-400">
                  <tr>
                    <th className="p-5 pl-8">Nome do Colaborador</th>
                    <th className="p-5">Início</th>
                    <th className="p-5">Término</th>
                    <th className="p-5 text-right pr-8">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                  {feriasDb.map((f, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-all">
                      <td className="p-5 pl-8 font-bold text-white uppercase">{f.colaborador_nome}</td>
                      <td className="p-5 font-bold uppercase">{f.data_inicio.split('-').reverse().join('/')}</td>
                      <td className="p-5 font-bold uppercase">{f.data_fim.split('-').reverse().join('/')}</td>
                      <td className="p-5 text-right pr-8">
                        <button
                          onClick={() => handleDeleteFerias(f.id)}
                          className="w-9 h-9 bg-zinc-900 border border-white/5 hover:border-red-500/20 hover:text-red-500 hover:bg-red-500/5 rounded-xl flex items-center justify-center transition-all inline-flex shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
