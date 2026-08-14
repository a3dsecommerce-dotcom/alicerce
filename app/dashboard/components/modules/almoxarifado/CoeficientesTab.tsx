"use client";
import { useState, useMemo } from "react";
import {
  TrendingDown, Target, Save, CheckCircle2, RefreshCw, AlertTriangle
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

interface CoeficientesTabProps {
  estoque: any[];
  reducaoGlobal: number;
  onRefresh: () => void;
  onSalvarReducaoGlobal?: (percentual: number) => Promise<void>;
}

export default function CoeficientesTab({
  estoque,
  reducaoGlobal = 0,
  onRefresh,
  onSalvarReducaoGlobal
}: CoeficientesTabProps) {
  const suprimentos = useMemo(
    () => (estoque || []).filter((i) => i.categoria === "SUPRIMENTO"),
    [estoque]
  );

  const [novoPercentual, setNovoPercentual] = useState<string>(reducaoGlobal.toString());
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState("");

  const percentualNum = parseFloat(novoPercentual) || 0;

  const filtrados = useMemo(
    () => suprimentos.filter((i) => i.item?.toLowerCase().includes(busca.toLowerCase())),
    [suprimentos, busca]
  );

  const handleSalvarIndividual = async (itemId: string) => {
    if (editando[itemId] === undefined) return;
    try {
      const { error } = await supabase
        .from("almox_suprimentos")
        .update({ coeficiente: editando[itemId] })
        .eq("id", itemId);
      if (error) throw error;
      toast.success("Coeficiente base atualizado!");
      onRefresh();
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    }
  };

  const handleSalvarReducao = async () => {
    if (percentualNum < 0 || percentualNum > 100) {
      toast.error("Informe uma redução entre 0% e 100%.");
      return;
    }
    setSaving(true);
    try {
      if (onSalvarReducaoGlobal) {
        await onSalvarReducaoGlobal(percentualNum);
        toast.success(`Redução global contínua de ${percentualNum}% aplicada!`);
      }
    } catch (e: any) {
      toast.error("Erro ao salvar redução: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetarReducao = async () => {
    setSaving(true);
    try {
      if (onSalvarReducaoGlobal) {
        await onSalvarReducaoGlobal(0);
        setNovoPercentual("0");
        toast.success("Redução global desativada. Coeficientes voltaram ao normal!");
      }
    } catch (e: any) {
      toast.error("Erro ao limpar redução: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-10">

      {/* ── PAINEL REDUÇÃO CONTINUA GLOBAL ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl border border-slate-700">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          
          {/* Título */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Target size={28} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic text-white">Redução Global Ativa</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Diminui o coeficiente de todos os suprimentos de forma contínua
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="flex flex-col md:flex-row gap-4 flex-1 w-full items-center">
            {/* % de redução */}
            <div className="relative flex-shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={novoPercentual}
                onChange={(e) => setNovoPercentual(e.target.value)}
                placeholder="0"
                className="h-12 w-36 pl-4 pr-10 rounded-xl bg-white/10 border border-white/20 text-white text-lg font-black text-center outline-none focus:ring-2 focus:ring-amber-400/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 font-black text-sm">%</span>
            </div>

            <button
              onClick={handleSalvarReducao}
              disabled={saving}
              className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 shadow-lg shadow-amber-500/30 disabled:opacity-40"
            >
              {saving ? (
                <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <TrendingDown size={16} />
              )}
              Salvar Alteração
            </button>

            {reducaoGlobal > 0 && (
              <button
                onClick={handleResetarReducao}
                disabled={saving}
                className="h-12 px-6 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <RefreshCw size={14} /> Voltar ao Normal (0%)
              </button>
            )}
          </div>
        </div>

        {/* Status de Redução Atual */}
        <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-white/10">
          {reducaoGlobal > 0 ? (
            <div className="flex items-center gap-3 bg-amber-500/10 rounded-2xl px-6 py-3 border border-amber-500/20">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-[11px] font-black text-amber-300 uppercase tracking-widest">
                Redução de {reducaoGlobal}% ativada globalmente. Todos os suprimentos têm cotas calculadas com corte.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-green-500/10 rounded-2xl px-6 py-3 border border-green-500/20">
              <CheckCircle2 size={16} className="text-green-400" />
              <span className="text-[11px] font-black text-green-300 uppercase tracking-widest">
                Sistema Operando Sem Cortes. Coeficientes padrão aplicados em 100%.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── TABELA DE COEFICIENTES ── */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-black uppercase italic text-[var(--text-primary)]">
              Coeficientes Base vs. Efetivos
            </h3>
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
              {suprimentos.length} suprimentos cadastrados · clique no coeficiente base para alterar
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
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[160px]">Coef. Base</th>
                {reducaoGlobal > 0 && (
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-amber-500 tracking-widest text-center w-[180px]">Coef. Efetivo (-{reducaoGlobal}%)</th>
                )}
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[160px]">Preço Unit.</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[80px]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtrados.map((item) => {
                const coefBase = editando[item.id] !== undefined ? editando[item.id] : (item.coeficiente ?? 1);
                const coefEfetivo = Math.max(0, parseFloat((coefBase * (1 - reducaoGlobal / 100)).toFixed(2)));
                const foiEditado = editando[item.id] !== undefined;

                return (
                  <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                    <td className="px-6 py-5">
                      <p className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{item.item}</p>
                      <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{item.unidade_medida}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="9.99"
                          step="0.01"
                          value={coefBase}
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
                    {reducaoGlobal > 0 && (
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-black text-amber-600">
                          {coefEfetivo.toFixed(2)}
                        </span>
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
    </div>
  );
}
