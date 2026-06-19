"use client";
import { useState, useEffect } from "react";
import { 
  Clock, AlertTriangle, FileSpreadsheet, UserPlus, CheckCircle, 
  Search, Calendar, MessageSquare, Send, History, Trash2, Plus, Upload
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import FichaColaborador360 from "../components/FichaColaborador360";
import { toast } from "sonner";

export default function RHPontoPage() {
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalBulk, setModalBulk] = useState(false);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [horarios, setHorarios] = useState<string[]>(["08:00", "14:00", "18:00"]);
  const [newHorario, setNewHorario] = useState("");
  const [filtro, setFiltro] = useState<"TODOS" | "PENDENTES" | "RESOLVIDOS">("TODOS");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Carregar cobranças ativas (Ajustes de Ponto)
        const { data: a } = await supabase.from('ajustes_ponto')
          .select('*, usuarios(id, nome, telefone, cargo, unidade_alocacao)')
          .order('created_at', { ascending: false });
        
        if (a) setAjustes(a);
        
        // Carregar horários de cobrança
        const { data: config } = await supabase
          .from('config_ponto')
          .select('valor')
          .eq('chave', 'horarios_cobranca')
          .single();
        if (config && config.valor) {
          setHorarios(config.valor);
        }
      } catch (err) {
        console.warn("Tabela config_ponto ou registros não encontrados. Usando padrões.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const dispararCobrancaIndividual = async (ajuste: any) => {
    setLoading(true);
    await n8n.trigger('cobranca-ponto-individual', {
      telefone: ajuste.usuarios?.telefone,
      nome: ajuste.usuarios?.nome,
      data_referencia: ajuste.data_referencia,
      ajuste_id: ajuste.id
    });
    toast.success(`Cobrança reenviada para ${ajuste.usuarios?.nome} via WhatsApp.`);
    setLoading(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        toast.error("Arquivo CSV vazio ou inválido.");
        return;
      }

      const parsedData: any[] = [];
      const headerLine = lines[0].toLowerCase();
      const hasHeaders = headerLine.includes("nome") || headerLine.includes("colaborador");
      const startIndex = hasHeaders ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        // Resolve simple comma or semicolon separation
        const delimiter = lines[i].includes(";") ? ";" : ",";
        const columns = lines[i].split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
        if (columns.length >= 2) {
          const nome = columns[0];
          const data_referencia = columns[1];
          const motivo = columns[2] || "Ajuste pendente";
          
          parsedData.push({ nome, data_referencia, motivo });
        }
      }

      if (parsedData.length === 0) {
        toast.error("Nenhum dado válido encontrado no CSV.");
        return;
      }

      setLoading(true);
      try {
        const { data: users } = await supabase.from('usuarios').select('id, nome, telefone');
        const userMap = new Map((users || []).map(u => [u.nome.toLowerCase(), u]));

        const novosAjustes = [];
        for (const item of parsedData) {
          const userObj = userMap.get(item.nome.toLowerCase());
          if (userObj) {
            novosAjustes.push({
              usuario_id: userObj.id,
              data_referencia: item.data_referencia,
              motivo: item.motivo,
              resolvido: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }

        if (novosAjustes.length === 0) {
          toast.error("Nenhum colaborador do CSV correspondente foi encontrado no sistema.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('ajustes_ponto').insert(novosAjustes);
        if (error) throw error;

        await n8n.trigger('cobranca-massa-ponto', { dados: novosAjustes });
        toast.success(`${novosAjustes.length} cobranças de ponto importadas com sucesso!`);
        
        // Recarregar os ajustes
        const { data: a } = await supabase.from('ajustes_ponto')
          .select('*, usuarios(id, nome, telefone, cargo, unidade_alocacao)')
          .order('created_at', { ascending: false });
        if (a) setAjustes(a);
        
        setModalBulk(false);
      } catch (err: any) {
        toast.error("Erro ao importar CSV: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const salvarHorarios = async (novosHorarios: string[]) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('config_ponto')
        .upsert({
          chave: 'horarios_cobranca',
          valor: novosHorarios,
          updated_at: new Date().toISOString()
        }, { onConflict: 'chave' });
      
      if (error) throw error;
      setHorarios(novosHorarios);
      await n8n.trigger('atualizar-agenda-ponto', { horarios: novosHorarios });
      toast.success("Configuração de horários atualizada no Bot!");
    } catch (err: any) {
      toast.error("Erro ao salvar horários: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarHorario = () => {
    if (!newHorario) return;
    if (horarios.includes(newHorario)) {
      toast.warning("Este horário já está cadastrado!");
      return;
    }
    const novos = [...horarios, newHorario].sort();
    salvarHorarios(novos);
    setNewHorario("");
  };

  const removerHorario = (hora: string) => {
    const novos = horarios.filter(h => h !== hora);
    salvarHorarios(novos);
  };

  const countPendentes = ajustes.filter(a => !a.resolvido).length;
  const countResolvidos = ajustes.filter(a => a.resolvido).length;

  const filtrados = ajustes.filter(a => {
    if (filtro === "PENDENTES") return !a.resolvido;
    if (filtro === "RESOLVIDOS") return a.resolvido;
    return true;
  }).filter(a => {
    const term = busca.toLowerCase();
    return (
      (a.usuarios?.nome || "").toLowerCase().includes(term) ||
      (a.usuarios?.unidade_alocacao || "").toLowerCase().includes(term) ||
      (a.motivo || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-8 h-full pb-10 px-4 md:px-10 animate-fade-in">
      {/* Header Estratégico */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500 opacity-20" />
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Célula de Regularização de Ponto</h1>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-2 flex items-center gap-2">
            <Clock size={14} className="text-orange-500" /> Orquestração de cobranças automáticas via Bot do WhatsApp
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="px-5 h-12 bg-amber-500/10 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
            onClick={() => {
              n8n.trigger('notificacao-encarregados-ponto', { acao: 'COBRAR_EQUIPE' });
              toast.success("Encarregados notificados para cobrar regularização imediata das equipes.");
            }}
          >
            <AlertTriangle size={16} /> Notificar Encarregados
          </button>
          <button 
            className="px-6 h-12 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-orange-600/20"
            onClick={() => setModalBulk(true)}
          >
            <UserPlus size={16} /> Importar Planilha CSV
          </button>
        </div>
      </div>

      {/* Grid com Predictable Asymmetry 70/30 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabela de Cobranças Ativas (70%) */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-xl overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-base)]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h2 className="text-sm font-black uppercase text-[var(--text-primary)]">Fila de Regularização</h2>
              <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-0.5 rounded border border-[var(--border)]">{filtrados.length} registros</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
                <input 
                  aria-label="Buscar Colaborador"
                  className="input-field w-full pl-9 !h-9 !text-[10px] font-black uppercase" 
                  placeholder="Buscar..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
              <div className="flex p-0.5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] shadow-inner">
                {[
                  { id: "TODOS", label: "Tudo" },
                  { id: "PENDENTES", label: `Pend. (${countPendentes})` },
                  { id: "RESOLVIDOS", label: `Res. (${countResolvidos})` }
                ].map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setFiltro(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${filtro === f.id ? 'bg-orange-600 text-white shadow' : 'text-[var(--text-muted)]'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 max-h-[600px] scrollbar-thin">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-base)]/5">
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Colaborador</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Data Ref.</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Motivo</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider">Última Cobrança</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--text-muted)] animate-pulse">
                      Sincronizando com o Bot...
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-xs font-black uppercase tracking-widest text-[var(--text-muted)] italic opacity-35">
                      Nenhuma cobrança ativa na fila.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((a, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-base)]/20 transition-all group">
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setSelecionado(a.usuarios)}>
                        <div className="text-xs font-black text-orange-600 uppercase tracking-tight">{a.usuarios?.nome}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">{a.usuarios?.unidade_alocacao}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-[var(--text-primary)]">{a.data_referencia}</td>
                      <td className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] italic">"{a.motivo || "Ajuste pendente"}"</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)]">
                          <History size={12} className="text-orange-500" />
                          <span>{new Date(a.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          a.resolvido ? 'bg-green-100 text-green-700' : 
                          a.autorizado ? 'bg-blue-100 text-blue-700 animate-pulse' : 
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {a.resolvido ? 'RESOLVIDO' : a.autorizado ? 'COBRANDO...' : 'AGUARDANDO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!a.resolvido && (
                          <button 
                            className="px-3 py-1.5 bg-orange-600/10 text-orange-600 hover:bg-orange-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider border border-orange-600/10 transition-all"
                            onClick={() => dispararCobrancaIndividual(a)}
                          >
                            <Send size={10} className="inline mr-1" /> Re-cobrar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painéis de Configuração & Status (30%) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Status Geral Bot */}
          <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#10B981] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">Agente de Cobrança Online</span>
            </div>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase leading-relaxed">
              O Bot está ativo e programado para varrer o banco nos horários agendados. Disparos manuais ignoram a escala.
            </p>
          </div>

          {/* Painel de Horários de Cobrança */}
          <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-black uppercase text-[var(--text-primary)]">Escala de Disparos Automáticos</h3>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Configure as janelas de cobrança do Bot</p>
            </div>

            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
              {horarios.map(hora => (
                <div key={hora} className="flex justify-between items-center p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] group/item hover:border-orange-500/20 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock size={14} className="text-orange-500" />
                    <span className="text-xs font-black text-[var(--text-primary)]">{hora}</span>
                  </div>
                  <button 
                    onClick={() => removerHorario(hora)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover/item:opacity-100 transition-all"
                    title="Excluir Horário"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {horarios.length === 0 && (
                <div className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">Nenhum horário cadastrado.</div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
              <input 
                type="time" 
                aria-label="Adicionar Horário de Cobrança"
                className="input-field flex-1 !h-10 text-xs font-black"
                value={newHorario}
                onChange={e => setNewHorario(e.target.value)}
              />
              <button 
                onClick={adicionarHorario}
                disabled={!newHorario}
                className="h-10 px-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-30 disabled:hover:scale-100"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Live Feed */}
          <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] shadow-xl flex flex-col gap-4 flex-1">
            <h3 className="text-xs font-black uppercase text-[var(--text-primary)] flex items-center gap-2">
              <MessageSquare size={16} className="text-orange-500" /> Live Feed (WhatsApp Bot)
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[250px] pr-1">
              {ajustes.slice(0, 5).map((a, i) => (
                <div key={i} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-[10px] font-bold uppercase tracking-wide">
                  <span className="text-orange-600 font-black">{a.usuarios?.nome}:</span>
                  <span className="text-[var(--text-secondary)]"> {a.resolvido ? "Confirmou ajuste no Marponto ✓" : "Cobrança enviada via WhatsApp..."}</span>
                </div>
              ))}
              {ajustes.length === 0 && (
                <div className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] italic">Sem atividades registradas.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ficha 360 do Colaborador */}
      <FichaColaborador360 
        colabId={selecionado?.id} 
        isOpen={!!selecionado} 
        onClose={() => setSelecionado(null)} 
      />

      {/* Modal de Lançamento de Cobrança por CSV */}
      {modalBulk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6 animate-fade-in" onClick={() => setModalBulk(false)}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 flex flex-col gap-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-xl font-black uppercase text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={24} className="text-orange-600" /> Importar Planilha de Ponto
              </h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Insira o relatório de inconsistências do Marponto</p>
            </div>

            <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 bg-slate-50 hover:bg-slate-100/50 hover:border-orange-500/30 transition-all relative cursor-pointer group">
              <input 
                type="file" 
                accept=".csv"
                aria-label="Upload de Arquivo CSV"
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleCSVUpload}
              />
              <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 group-hover:scale-110 group-hover:text-orange-600 transition-all">
                <Upload size={28} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-700">Selecione o Arquivo CSV</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Formatos suportados: .csv separated by comma or semicolon</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[9px] font-bold text-slate-500 uppercase space-y-1">
              <p className="font-black text-slate-700">Estrutura de Colunas Requerida:</p>
              <p>1ª Coluna: Nome do colaborador (Exato igual ao cadastro)</p>
              <p>2ª Coluna: Data de referência do ajuste (Ex: 20/04/2026)</p>
              <p>3ª Coluna: Motivo do ajuste (Opcional - Ex: Falta batida entrada)</p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
              <button 
                onClick={() => setModalBulk(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
