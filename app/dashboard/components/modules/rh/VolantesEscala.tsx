"use client";
import { useState } from "react";
import { Truck, Calendar, MapPin, User, FileText, Plus, X, Clock, Save, Trash2, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface VolantesEscalaProps {
  volantes: any[];
  requisicoes: any[];
  refresh: () => void;
  user: any;
}

export default function VolantesEscala({ volantes, requisicoes = [], refresh, user }: VolantesEscalaProps) {
  const [modalNovo, setModalNovo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const canEdit = Number(user?.nivel || user?.nivel_acesso) >= 3;
  
  const [formData, setFormData] = useState({
    colaborador_id: "",
    colaborador_nome: "",
    data: format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
    detalhes: [] as any[]
  });

  const handleEdit = (v: any) => {
    setEditingId(v.id);
    setFormData({
      colaborador_id: v.colaborador_id,
      colaborador_nome: v.colaborador_nome,
      data: v.data,
      observacoes: v.observacoes || "",
      detalhes: v.detalhes_visitas || []
    });
    setBuscaColab(v.colaborador_nome);
    setModalNovo(true);
  };

  const [novoDetalhe, setNovoDetalhe] = useState({
    unidade: "",
    entrada: "",
    saida: "",
    motivo: ""
  });

  // Busca de colaboradores
  const [buscaColab, setBuscaColab] = useState("");
  const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);

  const searchColabs = async (val: string) => {
    setBuscaColab(val);
    if (val.length > 1) {
      const { data } = await supabase.from('usuarios').select('*').ilike('nome', `%${val}%`).limit(5);
      if (data) setColabsSugeridos(data);
    } else {
      setColabsSugeridos([]);
    }
  };

  // Busca de unidades
  const [buscaUnidade, setBuscaUnidade] = useState("");
  const [unidadesSugeridas, setUnidadesSugeridas] = useState<any[]>([]);

  const searchUnidades = async (val: string) => {
    setBuscaUnidade(val);
    if (val.length > 1) {
      const { data } = await supabase.from('unidades').select('*').ilike('nome', `%${val}%`).limit(5);
      if (data) setUnidadesSugeridas(data);
    } else {
      setUnidadesSugeridas([]);
    }
  };

  const addDetalhe = () => {
    if (!novoDetalhe.unidade || !novoDetalhe.entrada) return toast.error("Preencha unidade e entrada");
    if (formData.detalhes.length >= 2) return toast.error("Máximo de 2 unidades por dia.");
    setFormData({ ...formData, detalhes: [...formData.detalhes, novoDetalhe] });
    setNovoDetalhe({ unidade: "", entrada: "", saida: "", motivo: "" });
    setBuscaUnidade("");
  };

  const removeDetalhe = (idx: number) => {
    setFormData({ ...formData, detalhes: formData.detalhes.filter((_, i) => i !== idx) });
  };

  const handleSalvar = async () => {
    if (!formData.colaborador_id || formData.detalhes.length === 0) return toast.error("Preencha o colaborador e ao menos uma unidade.");
    
    setLoading(true);
    
    const payload = {
      colaborador_id: formData.colaborador_id,
      colaborador_nome: formData.colaborador_nome,
      data: formData.data,
      detalhes_visitas: formData.detalhes,
      observacoes: formData.observacoes,
      updated_at: new Date()
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('escala_volantes').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('escala_volantes').insert([{
        ...payload,
        criado_por_id: user.id,
        criado_por_nome: user.name || user.nome
      }]);
      error = err;
    }

    if (!error) {
      toast.success(editingId ? "Escala atualizada!" : "Escala registrada!");
      setModalNovo(false);
      setEditingId(null);
      setFormData({ colaborador_id: "", colaborador_nome: "", data: format(new Date(), "yyyy-MM-dd"), observacoes: "", detalhes: [] });
      setBuscaColab("");
      setBuscaUnidade("");
      refresh();
    } else {
      toast.error("Erro ao salvar escala.");
    }
    setLoading(false);
  };

  const handleGerarPDFMensal = () => {
    const doc = new jsPDF();
    const mesFormatado = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`ESCALA MENSAL DE VOLANTES - ${mesFormatado.toUpperCase()}`, 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

    const filtrados = volantes.filter(v => {
      const d = new Date(v.data);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });

    autoTable(doc, {
      startY: 40,
      head: [['Data', 'Colaborador', 'Unidade 1', 'Unidade 2']],
      body: filtrados.map(v => [
        format(new Date(v.data), "dd/MM/yyyy"),
        v.colaborador_nome,
        v.detalhes_visitas[0] ? `${v.detalhes_visitas[0].unidade} (${v.detalhes_visitas[0].entrada}-${v.detalhes_visitas[0].saida || '...'})` : '-',
        v.detalhes_visitas[1] ? `${v.detalhes_visitas[1].unidade} (${v.detalhes_visitas[1].entrada}-${v.detalhes_visitas[1].saida || '...'})` : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      styles: { fontSize: 7, font: "helvetica" }
    });

    doc.save(`Escala_Volantes_${format(selectedMonth, "MM_yyyy")}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20 shadow-inner">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Escala de Volantes</h2>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Logística de deslocamento e substituições</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><Calendar size={14} /></button>
            <span className="text-[10px] font-black uppercase px-4">{format(selectedMonth, "MMM yyyy", { locale: ptBR })}</span>
            <button onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))} className="p-2 hover:bg-white rounded-lg transition-all"><Calendar size={14} /></button>
          </div>
          <button onClick={handleGerarPDFMensal} className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg">
             <FileText size={16} /> Escala Mensal PDF
          </button>
          {canEdit && (
            <button onClick={() => setModalNovo(true)} className="h-12 px-8 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20">
              <Plus size={16} /> Novo Registro
            </button>
          )}
        </div>
      </div>

      {/* Seção de Requisições de Unidades */}
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-3 ml-2">
          <TrendingUp size={16} className="text-amber-500" />
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Requisições de Ajuda Pendentes</h3>
        </div>
        
        {requisicoes.filter(r => r.status === 'PENDENTE' || r.status === 'EM_CURSO').length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {requisicoes.filter(r => r.status === 'PENDENTE' || r.status === 'EM_CURSO').map((req) => (
              <div key={req.id} className="min-w-[320px] bg-white border border-amber-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4 border-l-8 border-l-amber-500 relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform">
                  <Truck size={80} />
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{req.prioridade || 'NORMAL'}</p>
                    <h4 className="text-sm font-black text-slate-900 uppercase leading-tight">{req.unidade_destino}</h4>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${req.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {req.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{format(new Date(req.data_inicio), "dd/MM/yyyy")} {req.data_fim ? `até ${format(new Date(req.data_fim), "dd/MM/yyyy")}` : ''}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">
                    "{req.motivo || 'Nenhum motivo detalhado'}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black">
                       {req.quantidade_necessaria}
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase">Volantes</span>
                   </div>
                   {canEdit && (
                     <button 
                      onClick={() => {
                        setFormData({
                          ...formData,
                          data: format(new Date(req.data_inicio), "yyyy-MM-dd"),
                          detalhes: [{ unidade: req.unidade_destino, entrada: "08:00", saida: "17:00", motivo: req.motivo }]
                        });
                        setModalNovo(true);
                      }}
                      className="h-10 px-4 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all"
                     >
                       Atender Pedido
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 opacity-60">
            <CheckCircle size={32} className="text-green-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhuma unidade solicitando ajuda no momento</p>
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] pl-8">Data / Registro</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Colaborador Volante</th>
                <th className="p-6 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Roteiro Diário (Máx 2 Unidades)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {volantes.filter(v => {
                const d = new Date(v.data);
                return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
              }).map((v, idx) => (
                <tr key={idx} className="hover:bg-[var(--brand-alpha)] transition-all group">
                  <td className="p-6 pl-8 w-48">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[var(--text-primary)]">{format(new Date(v.data), "dd/MM/yyyy")}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">ID-{v.id.substring(0,4)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 w-80">
                    <div 
                      className="flex items-center gap-4 cursor-pointer hover:bg-white/50 p-3 rounded-2xl transition-all border border-transparent hover:border-indigo-100"
                      onClick={() => handleEdit(v)}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-lg border border-indigo-500/10 shadow-inner">
                        {v.colaborador_nome?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight">{v.colaborador_nome}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-0.5">Base: {v.unidade_original || 'OPERAÇÃO'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center w-full">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full max-w-[700px]">
                        {[0, 1].map(i => {
                          const d = v.detalhes_visitas[i];
                          if (d) {
                            return (
                              <div key={i} className="p-5 bg-white border border-[var(--border)] rounded-2xl flex flex-col gap-2 shadow-sm border-l-8 border-l-indigo-500 min-h-[100px] justify-center">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-[12px] font-black text-indigo-600 uppercase flex items-center gap-2"><MapPin size={14} /> {d.unidade}</span>
                                  <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                     <Clock size={12} /> {d.entrada}-{d.saida || '...'}
                                  </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic truncate px-1">
                                   "{d.motivo || 'Substituição'}"
                                </p>
                              </div>
                            );
                          }
                          return (
                            <div key={i} className="p-5 bg-[var(--bg-base)]/50 border-2 border-dashed border-[var(--border)] rounded-2xl flex items-center justify-center opacity-40 min-h-[100px]">
                               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Slot Disponível</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
               {volantes.filter(v => {
                const d = new Date(v.data);
                return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
              }).length === 0 && (
                <tr>
                  <td colSpan={3} className="p-20 text-center opacity-30">
                    <Truck size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma escala para este mês.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdaptiveModal isOpen={modalNovo} onClose={() => { setModalNovo(false); setEditingId(null); setFormData({ colaborador_id: "", colaborador_nome: "", data: format(new Date(), "yyyy-MM-dd"), observacoes: "", detalhes: [] }); setBuscaColab(""); }} title={editingId ? "Editar Escala Diária" : "Nova Escala Diária"}>
        <div className="p-6 md:p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar bg-[var(--bg-base)]/30">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <User size={14} className="text-indigo-600" /> Seleção do Colaborador
              </label>
              <div className="relative">
                <input 
                  className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm" 
                  placeholder="DIGITE O NOME PARA BUSCAR..." 
                  value={buscaColab}
                  onChange={(e) => searchColabs(e.target.value)}
                />
                {colabsSugeridos.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-[var(--border)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                    {colabsSugeridos.map(c => (
                      <button key={c.id} onClick={() => { setFormData({...formData, colaborador_id: c.id, colaborador_nome: c.nome}); setBuscaColab(c.nome); setColabsSugeridos([]); }} className="w-full p-5 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none transition-colors">
                        <p className="text-xs font-black uppercase text-indigo-900">{c.nome}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{c.funcao || 'VOLANTE'} • {c.unidade_alocacao || 'OPERAÇÃO'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <Calendar size={14} className="text-indigo-600" /> Data da Escala
              </label>
              <input type="date" className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} />
            </div>
          </div>

            {(!editingId || canEdit) && (
              <div className="p-8 bg-white rounded-3xl border-2 border-indigo-100 shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <MapPin size={120} />
                </div>
                
                <h5 className="text-[11px] font-black uppercase text-indigo-600 flex items-center gap-3 italic">
                  <Plus size={18} className="bg-indigo-600 text-white rounded-lg p-0.5" /> Adicionar Roteiro de Visitas
                </h5>
    
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2 relative">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Unidade</p>
                    <input 
                      className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" 
                      placeholder="Buscar Escola..." 
                      value={buscaUnidade} 
                      onChange={(e) => searchUnidades(e.target.value)} 
                    />
                    {unidadesSugeridas.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[var(--border)] rounded-xl shadow-2xl z-[110] overflow-hidden">
                        {unidadesSugeridas.map(u => (
                          <button key={u.id} onClick={() => { setNovoDetalhe({...novoDetalhe, unidade: u.nome}); setBuscaUnidade(u.nome); setUnidadesSugeridas([]); }} className="w-full p-3 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none">
                            <p className="text-[10px] font-black uppercase text-indigo-900">{u.nome}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Entrada</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="08:00" value={novoDetalhe.entrada} onChange={(e) => setNovoDetalhe({...novoDetalhe, entrada: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Saída</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="12:00" value={novoDetalhe.saida} onChange={(e) => setNovoDetalhe({...novoDetalhe, saida: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase ml-1">Motivo</p>
                    <input className="input-field !h-12 text-[11px] font-bold !bg-slate-50 border-transparent focus:!bg-white focus:border-indigo-200" placeholder="Substituição" value={novoDetalhe.motivo} onChange={(e) => setNovoDetalhe({...novoDetalhe, motivo: e.target.value})} />
                  </div>
                </div>
    
                <button 
                  onClick={addDetalhe} 
                  disabled={formData.detalhes.length >= 2}
                  className="w-full h-14 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                >
                  {formData.detalhes.length >= 2 ? 'Limite de 2 Unidades Atingido' : 'Confirmar Unidade no Roteiro'}
                </button>
              </div>
            )}

          {formData.detalhes.length > 0 && (
            <div className="space-y-6">
              <h5 className="text-[11px] font-black uppercase text-slate-900 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div> Resumo do Roteiro Gerado
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formData.detalhes.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white border-2 border-indigo-50 rounded-2xl shadow-sm hover:border-indigo-200 transition-all relative group">
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{d.unidade}</p>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase mt-1 flex items-center gap-1.5">
                         <Clock size={12} /> {d.entrada} às {d.saida || '...'}
                      </p>
                    </div>
                    {(!editingId || canEdit) && (
                      <button onClick={() => removeDetalhe(i)} className="w-10 h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-10">
            {canEdit ? (
              <button onClick={handleSalvar} disabled={loading} className="w-full h-20 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                {loading ? (
                  <> <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white"></div> PROCESSANDO... </>
                ) : (
                  <> <Save size={24} /> {editingId ? 'ATUALIZAR ESCALA' : 'SALVAR ESCALA DIÁRIA'} </>
                )}
              </button>
            ) : (
              <div className="p-8 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center gap-3">
                <TrendingUp size={32} className="text-amber-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 text-center leading-relaxed">
                  MODO DE CONSULTA: Seu nível de acesso permite apenas a consulta das escalas. <br/>
                  O registro e alterações são realizados exclusivamente pela Gerência ou Master (Nível 3+).
                </p>
              </div>
            )}
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
