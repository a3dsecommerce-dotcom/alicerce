"use client";
import { useState, useMemo } from "react";
import {
  TrendingDown, TrendingUp, Target, Save, History, 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Minus
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface ItemCoef {
  id: string;
  item: string;
  coeficiente: number;
  preco_unitario: number;
  unidade_medida: string;
  categoria: string;
}

interface Meta {
  id: string;
  mes: number;
  ano: number;
  percentual_reducao: number;
  aplicado_em: string;
  aplicado_por: string;
  observacao: string;
}

interface CoeficientesTabProps {
  estoque: any[];
  metas: Meta[];
  onRefresh: () => void;
}

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function CoeficientesTab({ estoque, metas, onRefresh }: CoeficientesTabProps) {
  const suprimentos = useMemo(
    () => (estoque || []).filter((i) => i.categoria === "SUPRIMENTO"),
    [estoque]
  );

  const hoje = new Date();
  const [metaPercentual, setMetaPercentual] = useState<string>("");
  const [metaMes, setMetaMes] = useState(hoje.getMonth() + 1);
  const [metaAno, setMetaAno] = useState(hoje.getFullYear());
  const [metaObs, setMetaObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState("");
  const [showHistorico, setShowHistorico] = useState(false);

  const percentualNum = parseFloat(metaPercentual) || 0;
  const multiplicador = 1 - percentualNum / 100;

  const filtrados = useMemo(
    () => suprimentos.filter((i) => i.item?.toLowerCase().includes(busca.toLowerCase())),
    [suprimentos, busca]
  );

  const coefPreview = (item: ItemCoef) => {
    const base = editando[item.id] !== undefined ? editando[item.id] : (item.coeficiente ?? 1);
    if (percentualNum <= 0) return base;
    return Math.max(0, parseFloat((base * multiplicador).toFixed(2)));
  };

  const handleSalvarIndividual = async (itemId: string) => {
    if (editando[itemId] === undefined) return;
    try {
      const { error } = await supabase
        .from("almox_suprimentos")
        .update({ coeficiente: editando[itemId] })
        .eq("id", itemId);
      if (error) throw error;
      toast.success("Coeficiente atualizado!");
      onRefresh();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    }
  };

  const handleAplicarMetaGlobal = async () => {
    if (percentualNum <= 0 || percentualNum > 100) {
      toast.error("Informe uma redução entre 1% e 100%.");
      return;
    }
    if (!window.confirm(`Aplicar redução de ${percentualNum}% nos coeficientes de ${suprimentos.length} suprimentos para ${MESES[metaMes - 1]}/${metaAno}?`)) return;

    setSaving(true);
    try {
      // 1. Atualiza cada coeficiente
      const updates = suprimentos.map((item) => {
        const base = item.coeficiente ?? 1;
        const novo = Math.max(0, parseFloat((base * multiplicador).toFixed(2)));
        return supabase.from("almox_suprimentos").update({ coeficiente: novo }).eq("id", item.id);
      });
      await Promise.all(updates);

      // 2. Registra a meta
      const user = JSON.parse(localStorage.getItem("crm_user") || "{}");
      const { error: metaErr } = await supabase.from("almox_metas_reducao").upsert({
        mes: metaMes,
        ano: metaAno,
        percentual_reducao: percentualNum,
        aplicado_em: new Date().toISOString(),
        aplicado_por: user?.nome || "Almoxarifado",
        observacao: metaObs || null,
      }, { onConflict: "mes,ano" });
      if (metaErr) throw metaErr;

      toast.success(`Meta de -${percentualNum}% aplicada a ${suprimentos.length} suprimentos!`);
      setMetaPercentual("");
      setMetaObs("");
      onRefresh();
    } catch (e: any) {
      toast.error("Erro ao aplicar meta: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const metaAtual = metas.find((m) => m.mes === metaMes && m.ano === metaAno);

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10">

      {/* ── PAINEL META GLOBAL ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Título */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Target size={28} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic text-white">Meta de Redução Global</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Aplica % de corte a todos os coeficientes
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
            {/* Seletor de mês/ano */}
            <div className="flex gap-2">
              <select
                value={metaMes}
                onChange={(e) => setMetaMes(Number(e.target.value))}
                className="h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase outline-none focus:ring-2 focus:ring-amber-400/40"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1} className="text-black">{m}</option>
                ))}
              </select>
              <input
                type="number"
                value={metaAno}
                onChange={(e) => setMetaAno(Number(e.target.value))}
                className="h-12 w-24 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-black text-center outline-none focus:ring-2 focus:ring-amber-400/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* % de redução */}
            <div className="relative flex-shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={metaPercentual}
                onChange={(e) => setMetaPercentual(e.target.value)}
                placeholder="20"
                className="h-12 w-36 pl-4 pr-10 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-black text-center outline-none focus:ring-2 focus:ring-amber-400/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm">%</span>
            </div>

            {/* Observação */}
            <input
              type="text"
              value={metaObs}
              onChange={(e) => setMetaObs(e.target.value)}
              placeholder="Justificativa da meta (ex: Corte orçamentário Q3)..."
              className="h-12 flex-1 px-4 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-amber-400/40"
            />

            {/* Botão aplicar */}
            <button
              onClick={handleAplicarMetaGlobal}
              disabled={saving || percentualNum <= 0}
              className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {saving ? (
                <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <TrendingDown size={16} />
              )}
              Aplicar a Todos
            </button>
          </div>
        </div>

        {/* Preview da redução + meta existente */}
        {(percentualNum > 0 || metaAtual) && (
          <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-white/10">
            {percentualNum > 0 && (
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-6 py-3 border border-white/10">
                <TrendingDown size={16} className="text-red-400" />
                <span className="text-[11px] font-black text-slate-300">Preview:</span>
                <span className="text-[13px] font-black text-white">
                  Coef 1.00 → <span className="text-amber-400">{multiplicador.toFixed(2)}</span>
                </span>
              </div>
            )}
            {metaAtual && (
              <div className="flex items-center gap-3 bg-green-500/10 rounded-2xl px-6 py-3 border border-green-500/20">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-[11px] font-black text-green-300 uppercase tracking-widest">
                  Meta registrada: {metaAtual.percentual_reducao}% — {metaAtual.aplicado_por}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TABELA DE COEFICIENTES ── */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-black uppercase italic text-[var(--text-primary)]">
              Coeficientes por Suprimento
            </h3>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
              {suprimentos.length} itens · clique no valor para editar
            </p>
          </div>
          <input
            type="text"
            placeholder="Pesquisar suprimento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 w-72 px-4 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] text-xs outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-base)]/60 border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-left">Suprimento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[160px]">Coef. Atual</th>
                {percentualNum > 0 && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-500 tracking-widest text-center w-[160px]">Novo Coef. ({-percentualNum}%)</th>
                )}
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[160px]">Preço Unit.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[80px]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtrados.map((item) => {
                const coefAtual = editando[item.id] !== undefined ? editando[item.id] : (item.coeficiente ?? 1);
                const preview = coefPreview(item);
                const foiEditado = editando[item.id] !== undefined;
                const tendencia = coefAtual >= 1 ? "up" : coefAtual < 0.8 ? "down" : "neutral";

                return (
                  <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{item.item}</p>
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{item.unidade_medida}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tendencia === "up" && <TrendingUp size={12} className="text-green-500" />}
                        {tendencia === "down" && <TrendingDown size={12} className="text-red-500" />}
                        {tendencia === "neutral" && <Minus size={12} className="text-slate-400" />}
                        <input
                          type="number"
                          min="0"
                          max="9.99"
                          step="0.01"
                          value={coefAtual}
                          onChange={(e) =>
                            setEditando((prev) => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))
                          }
                          className={`w-20 h-9 text-center text-sm font-black rounded-xl border-2 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            foiEditado
                              ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]"
                              : "border-[var(--border)] bg-transparent text-[var(--text-primary)] focus:border-[var(--brand)]"
                          }`}
                        />
                      </div>
                    </td>
                    {percentualNum > 0 && (
                      <td className="px-6 py-5 text-center">
                        <span className={`text-sm font-black ${preview < coefAtual ? "text-amber-600" : "text-green-600"}`}>
                          {preview}
                        </span>
                        {preview < coefAtual && (
                          <span className="block text-[9px] text-amber-500 font-bold">
                            -{(((coefAtual - preview) / coefAtual) * 100).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-black text-[var(--text-muted)]">
                        {item.preco_unitario > 0
                          ? `R$ ${Number(item.preco_unitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : <span className="text-[10px] text-slate-300">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {foiEditado && (
                        <button
                          onClick={() => handleSalvarIndividual(item.id)}
                          className="w-9 h-9 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center mx-auto hover:scale-110 transition-all shadow-md shadow-[var(--brand)]/20"
                        >
                          <Save size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-[var(--text-muted)] text-xs font-bold">
                    Nenhum suprimento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HISTÓRICO DE METAS ── */}
      {metas.length > 0 && (
        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-lg overflow-hidden">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex items-center justify-between p-6 hover:bg-[var(--bg-base)]/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <History size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-black uppercase italic text-[var(--text-primary)]">
                Histórico de Metas ({metas.length})
              </span>
            </div>
            {showHistorico ? <ChevronUp size={18} className="text-[var(--text-muted)]" /> : <ChevronDown size={18} className="text-[var(--text-muted)]" />}
          </button>
          {showHistorico && (
            <div className="border-t border-[var(--border)] overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-base)]/40">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Período</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Redução</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Aplicado por</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {[...metas].sort((a, b) => b.ano - a.ano || b.mes - a.mes).map((meta) => (
                    <tr key={meta.id} className="hover:bg-[var(--bg-base)]/20">
                      <td className="px-6 py-4 text-xs font-black text-[var(--text-primary)]">
                        {MESES[meta.mes - 1]}/{meta.ano}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black border border-amber-500/20">
                          <TrendingDown size={10} /> -{meta.percentual_reducao}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-[var(--text-muted)]">{meta.aplicado_por || "—"}</td>
                      <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{meta.observacao || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
