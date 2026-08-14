"use client";
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  Plus, Trash2, Building2, ChevronRight, Minus, X
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Nota {
  id: string;
  protocolo: string;
  secretaria: string;
  mes: number;
  ano: number;
  valor_nota: number;
  numero_nf: string;
  fornecedor: string;
  observacao: string;
  lancado_por: string;
  created_at: string;
}

interface Requisicao {
  protocolo: string;
  secretaria_destino: string;
  status_geral: string;
  itens: any[];
}

interface RelatoriosAlmoxTabProps {
  notas: Nota[];
  requisicoes: any[];
  estoque: any[];
  onRefresh: () => void;
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const CORES = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

const formatCurrency = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function RelatoriosAlmoxTab({
  notas,
  requisicoes,
  estoque,
  onRefresh,
}: RelatoriosAlmoxTabProps) {
  const hoje = new Date();
  const [mesSel, setMesSel] = useState(hoje.getMonth() + 1);
  const [anoSel, setAnoSel] = useState(hoje.getFullYear());
  const [showFormNF, setShowFormNF] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulário de nova NF
  const [nfForm, setNfForm] = useState({
    protocolo: "",
    secretaria: "",
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
    valor_nota: "",
    numero_nf: "",
    fornecedor: "",
    observacao: "",
  });

  // ── Notas do mês selecionado ──
  const notasMes = useMemo(
    () => notas.filter((n) => n.mes === mesSel && n.ano === anoSel),
    [notas, mesSel, anoSel]
  );

  const totalMes = useMemo(
    () => notasMes.reduce((acc, n) => acc + (n.valor_nota || 0), 0),
    [notasMes]
  );

  // ── Ranking por secretaria (mês atual) ──
  const rankingSecretarias = useMemo(() => {
    const map: Record<string, number> = {};
    notasMes.forEach((n) => {
      map[n.secretaria] = (map[n.secretaria] || 0) + n.valor_nota;
    });
    return Object.entries(map)
      .map(([sec, total]) => ({ secretaria: sec, total }))
      .sort((a, b) => b.total - a.total);
  }, [notasMes]);

  // ── Série histórica (últimos 6 meses) ──
  const historico = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anoSel, mesSel - 1 - i, 1);
      const m = d.getMonth() + 1;
      const a = d.getFullYear();
      const total = notas
        .filter((n) => n.mes === m && n.ano === a)
        .reduce((acc, n) => acc + n.valor_nota, 0);
      data.push({ label: `${MESES[m - 1]}/${a}`, total, mes: m, ano: a });
    }
    return data;
  }, [notas, mesSel, anoSel]);

  // Tendência vs. mês anterior
  const mesAtualValor = historico[5]?.total || 0;
  const mesAnteriorValor = historico[4]?.total || 0;
  const tendenciaPct =
    mesAnteriorValor > 0
      ? (((mesAtualValor - mesAnteriorValor) / mesAnteriorValor) * 100).toFixed(1)
      : null;

  // Protocólos disponíveis (requisições atendidas)
  const protocolosAtendidos = useMemo(
    () =>
      (requisicoes || [])
        .filter((r) => r.status_geral === "ENTREGUE" && !r.arquivado)
        .map((r) => ({ protocolo: r.protocolo, secretaria: r.secretaria_destino })),
    [requisicoes]
  );

  const handleLancarNF = async () => {
    if (!nfForm.protocolo || !nfForm.secretaria || !nfForm.valor_nota) {
      toast.error("Protocolo, secretaria e valor são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("crm_user") || "{}");
      const { error } = await supabase.from("almox_notas_requisicao").insert({
        protocolo: nfForm.protocolo.trim().toUpperCase(),
        secretaria: nfForm.secretaria.trim().toUpperCase(),
        mes: nfForm.mes,
        ano: nfForm.ano,
        valor_nota: parseFloat(nfForm.valor_nota.replace(",", ".")),
        numero_nf: nfForm.numero_nf || null,
        fornecedor: nfForm.fornecedor || null,
        observacao: nfForm.observacao || null,
        lancado_por: user?.nome || "Almoxarifado",
      });
      if (error) throw error;
      toast.success("Nota fiscal registrada!");
      setNfForm({ protocolo: "", secretaria: "", mes: hoje.getMonth() + 1, ano: hoje.getFullYear(), valor_nota: "", numero_nf: "", fornecedor: "", observacao: "" });
      setShowFormNF(false);
      onRefresh();
    } catch (e: any) {
      toast.error("Erro ao registrar NF: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirNota = async (id: string) => {
    if (!window.confirm("Remover esta nota fiscal do registro?")) return;
    const { error } = await supabase.from("almox_notas_requisicao").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Nota removida.");
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10">

      {/* ── FILTRO DE MÊS/ANO ── */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-black uppercase italic text-[var(--text-primary)]">Relatório Financeiro de Suprimentos</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
            Análise de custo real por secretaria via notas fiscais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={mesSel}
            onChange={(e) => setMesSel(Number(e.target.value))}
            className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input
            type="number"
            value={anoSel}
            onChange={(e) => setAnoSel(Number(e.target.value))}
            className="h-11 w-24 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[11px] font-black text-center outline-none focus:ring-2 focus:ring-[var(--brand)]/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => setShowFormNF(true)}
            className="h-11 px-6 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-md shadow-[var(--brand)]/20"
          >
            <Plus size={14} /> Lançar NF
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total do mês */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <DollarSign size={18} className="text-blue-500" />
            </div>
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
              Total {MESES[mesSel - 1]}/{anoSel}
            </p>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{formatCurrency(totalMes)}</p>
          {tendenciaPct !== null && (
            <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-black ${Number(tendenciaPct) > 0 ? "text-red-500" : "text-green-500"}`}>
              {Number(tendenciaPct) > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(Number(tendenciaPct))}% vs. mês anterior
            </div>
          )}
        </div>

        {/* NFs lançadas */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FileText size={18} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">NFs Lançadas</p>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{notasMes.length}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2">protocolos no mês</p>
        </div>

        {/* Secretarias atendidas */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Building2 size={18} className="text-violet-500" />
            </div>
            <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretarias</p>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{rankingSecretarias.length}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold mt-2">secretarias com gasto no mês</p>
        </div>
      </div>

      {/* ── GRÁFICO HISTÓRICO ── */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-8 shadow-sm">
        <h4 className="text-sm font-black uppercase italic text-[var(--text-primary)] mb-6">
          Evolução de Gastos — Últimos 6 Meses
        </h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historico} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 700, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontWeight: 700, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), "Total"]}
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", fontSize: "11px", fontWeight: 700 }}
                cursor={{ fill: "var(--bg-base)", opacity: 0.5 }}
              />
              {mesAnteriorValor > 0 && (
                <ReferenceLine y={mesAnteriorValor} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Mês ant.", position: "right", fontSize: 9, fill: "#f59e0b" }} />
              )}
              <Bar dataKey="total" radius={[8, 8, 0, 0]} maxBarSize={60}>
                {historico.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 5 ? "var(--brand)" : `${CORES[index % CORES.length]}50`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── RANKING POR SECRETARIA ── */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <h4 className="text-sm font-black uppercase italic text-[var(--text-primary)] mb-5">
            Ranking por Secretaria — {MESES[mesSel - 1]}/{anoSel}
          </h4>
          {rankingSecretarias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
              <DollarSign size={32} className="opacity-20 mb-3" />
              <p className="text-xs font-bold">Nenhuma NF lançada neste mês</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rankingSecretarias.map((item, idx) => {
                const pct = totalMes > 0 ? (item.total / totalMes) * 100 : 0;
                return (
                  <div key={item.secretaria} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-[var(--text-muted)] w-5 shrink-0">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-black text-[var(--text-primary)]">{item.secretaria}</span>
                        <span className="text-[11px] font-black text-[var(--text-primary)]">{formatCurrency(item.total)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: CORES[idx % CORES.length] }}
                        />
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)] font-bold">{pct.toFixed(1)}% do total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── LISTAGEM DE NFS ── */}
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] p-6 shadow-sm">
          <h4 className="text-sm font-black uppercase italic text-[var(--text-primary)] mb-5">
            Notas Fiscais — {MESES[mesSel - 1]}/{anoSel}
          </h4>
          <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
            {notasMes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
                <FileText size={32} className="opacity-20 mb-3" />
                <p className="text-xs font-bold">Nenhuma NF lançada</p>
                <button onClick={() => setShowFormNF(true)} className="mt-4 px-6 py-2 bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-all">
                  Lançar primeira NF
                </button>
              </div>
            ) : (
              notasMes.map((nota) => (
                <div key={nota.id} className="flex items-start justify-between gap-4 p-4 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-base)]/50 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-[var(--brand)] uppercase">{nota.protocolo}</span>
                      <ChevronRight size={10} className="text-[var(--text-muted)]" />
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase">{nota.secretaria}</span>
                      {nota.numero_nf && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] font-bold">
                          NF {nota.numero_nf}
                        </span>
                      )}
                    </div>
                    {nota.fornecedor && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">{nota.fornecedor}</p>
                    )}
                    <p className="text-sm font-black text-[var(--text-primary)] mt-1">{formatCurrency(nota.valor_nota)}</p>
                  </div>
                  <button
                    onClick={() => handleExcluirNota(nota.id)}
                    className="w-8 h-8 rounded-xl border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL LANÇAR NF ── */}
      {showFormNF && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFormNF(false)}>
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-2xl w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black uppercase italic text-[var(--text-primary)]">Lançar Nota Fiscal</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Valor real pago pela requisição atendida</p>
              </div>
              <button onClick={() => setShowFormNF(false)} className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-base)] transition-all">
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Protocolo */}
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Protocolo da Requisição *</label>
                <select
                  value={nfForm.protocolo}
                  onChange={(e) => {
                    const proto = protocolosAtendidos.find((p) => p.protocolo === e.target.value);
                    setNfForm((prev) => ({ ...prev, protocolo: e.target.value, secretaria: proto?.secretaria || prev.secretaria }));
                  }}
                  className="input-field text-xs"
                >
                  <option value="">Selecionar protocolo...</option>
                  {protocolosAtendidos.map((p) => (
                    <option key={p.protocolo} value={p.protocolo}>{p.protocolo} — {p.secretaria}</option>
                  ))}
                  <option value="AVULSO">Avulso (sem protocolo)</option>
                </select>
              </div>

              {/* Secretaria */}
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Secretaria *</label>
                <input
                  type="text"
                  value={nfForm.secretaria}
                  onChange={(e) => setNfForm((prev) => ({ ...prev, secretaria: e.target.value }))}
                  placeholder="Ex: SEMED"
                  className="input-field text-xs uppercase"
                />
              </div>

              {/* Mês/Ano + Valor */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Mês *</label>
                  <select
                    value={nfForm.mes}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, mes: Number(e.target.value) }))}
                    className="input-field text-xs"
                  >
                    {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Ano *</label>
                  <input
                    type="number"
                    value={nfForm.ano}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, ano: Number(e.target.value) }))}
                    className="input-field text-xs text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Valor (R$) *</label>
                  <input
                    type="text"
                    value={nfForm.valor_nota}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, valor_nota: e.target.value }))}
                    placeholder="0,00"
                    className="input-field text-xs text-right"
                  />
                </div>
              </div>

              {/* NF + Fornecedor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Nº da NF</label>
                  <input
                    type="text"
                    value={nfForm.numero_nf}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, numero_nf: e.target.value }))}
                    placeholder="Ex: 00123"
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Fornecedor</label>
                  <input
                    type="text"
                    value={nfForm.fornecedor}
                    onChange={(e) => setNfForm((prev) => ({ ...prev, fornecedor: e.target.value }))}
                    placeholder="Nome do fornecedor"
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block mb-1.5">Observação</label>
                <input
                  type="text"
                  value={nfForm.observacao}
                  onChange={(e) => setNfForm((prev) => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Opcional..."
                  className="input-field text-xs"
                />
              </div>

              {/* Botão */}
              <button
                onClick={handleLancarNF}
                disabled={saving}
                className="h-12 w-full bg-[var(--brand)] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.01] transition-all shadow-lg disabled:opacity-40"
              >
                {saving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <DollarSign size={16} />}
                Registrar Nota Fiscal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
