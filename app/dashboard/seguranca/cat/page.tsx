"use client";
import { useState, useEffect } from "react";
import {
  ShieldAlert, Search, FileText, Plus,
  Clock, CheckCircle2, AlertCircle, Stethoscope, Activity, X, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import { toast } from "sonner";

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  unidade?: string;
}

interface CATForm {
  colaborador_id: string;
  colaborador_nome: string;
  data_acidente: string;
  hora_acidente: string;
  tipo_acidente: string;
  descricao: string;
  testemunhas: string;
}

const TIPOS_ACIDENTE = [
  "Queda em mesmo nível",
  "Queda de altura",
  "Pérfuro-cortante",
  "Choque elétrico",
  "Queimadura",
  "Esforço físico / Ergonômico",
  "Acidente de trajeto",
  "Colisão / Atropelamento",
  "Outros",
];

export default function CATInvestigationPage() {
  const [busca, setBusca] = useState("");
  const [modalCAT, setModalCAT] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [buscaColab, setBuscaColab] = useState("");
  const [loadingColab, setLoadingColab] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [form, setForm] = useState<CATForm>({
    colaborador_id: "",
    colaborador_nome: "",
    data_acidente: "",
    hora_acidente: "",
    tipo_acidente: "",
    descricao: "",
    testemunhas: "",
  });

  // Carrega colaboradores do Supabase ao abrir o modal
  useEffect(() => {
    if (!modalCAT) return;
    async function loadColabs() {
      setLoadingColab(true);
      const { data } = await supabase
        .from("usuarios")
        .select("id, nome, cargo")
        .order("nome");
      setColaboradores(data || []);
      setLoadingColab(false);
    }
    loadColabs();
  }, [modalCAT]);

  const colaboradoresFiltrados = colaboradores.filter((c) =>
    (c.nome || "").toLowerCase().includes(buscaColab.toLowerCase()) ||
    (c.cargo || "").toLowerCase().includes(buscaColab.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!form.colaborador_id || !form.data_acidente || !form.tipo_acidente || !form.descricao) {
      toast.error("Preencha todos os campos obrigatórios: Colaborador, Data, Tipo e Descrição.");
      return;
    }
    setEnviando(true);
    try {
      await n8n.trigger("investigacao-cat-iniciada", {
        ...form,
        solicitante: "SST Portal",
        notificar: ["GERENCIA", "RH_DP", "TECNICO_SEGURANCA"],
      });
      toast.success(`CAT registrada! Colaborador: ${form.colaborador_nome} — Técnico de Segurança notificado.`);
      setModalCAT(false);
      setForm({ colaborador_id: "", colaborador_nome: "", data_acidente: "", hora_acidente: "", tipo_acidente: "", descricao: "", testemunhas: "" });
      setBuscaColab("");
    } catch (err) {
      toast.error("Erro ao registrar CAT. Verifique a conexão e tente novamente.");
    }
    setEnviando(false);
  };

  const cats = [
    { nome: "Marcos Oliveira", cargo: "ASG", unidade: "Escola Solimões", tipo: "Queda em mesmo nível", data: "15/04/2026", status: "EM ANÁLISE", cor: "text-orange-500", bg: "bg-orange-500/10" },
    { nome: "Júlia Santos", cargo: "Zeladora", unidade: "UBS Norte", tipo: "Pérfuro-cortante", data: "10/04/2026", status: "CONCLUÍDO", cor: "text-green-500", bg: "bg-green-500/10" },
    { nome: "Roberto Lima", cargo: "ASG", unidade: "SEMED", tipo: "Trajeto", data: "05/04/2026", status: "PENDENTE LAUDO", cor: "text-red-500", bg: "bg-red-500/10" },
  ].filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.tipo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <Activity className="text-red-500" size={22} /> Investigação de CAT
          </h1>
          <p className="text-white/50 text-xs mt-1">Comunicação de Acidente de Trabalho — SST</p>
        </div>
        <button
          onClick={() => setModalCAT(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 text-sm w-full sm:w-auto justify-center"
        >
          <Plus size={16} /> Iniciar Nova CAT
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "CATs Abertas", value: "3", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Dias sem Acidentes", value: "142", icon: ShieldAlert, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Pendentes de Laudo", value: "1", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "EPIs OK", value: "98%", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={kpi.color} size={20} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{kpi.value}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider leading-tight">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Histórico */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Histórico SST</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={13} />
            <input
              placeholder="Buscar por colaborador..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-xs text-white focus:border-red-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/40 text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="px-4 py-3 font-semibold">Colaborador</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {cats.map((item, idx) => (
                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-sm">{item.nome}</div>
                    <div className="text-[10px] text-white/40">{item.cargo} | {item.unidade}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/60">{item.tipo}</td>
                  <td className="px-4 py-3 text-xs text-white/60">{item.data}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.cor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-red-500 hover:text-red-400 text-[10px] font-bold flex items-center gap-1 ml-auto">
                      LAUDO <FileText size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CAT — Formulário Funcional */}
      {modalCAT && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[92vh] sm:max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-card)] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h2 className="text-base font-black text-[var(--text-primary)]">Nova CAT</h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">Campos * são obrigatórios</p>
                </div>
              </div>
              <button
                onClick={() => setModalCAT(false)}
                className="w-9 h-9 rounded-xl bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 flex flex-col gap-5">

              {/* Campo: Colaborador com busca */}
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                  Colaborador Acidentado *
                </label>
                {/* Busca inline */}
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    className="input-field w-full !pl-9 !h-10 !text-sm"
                    placeholder="Digite para buscar por nome ou cargo..."
                    value={buscaColab}
                    onChange={(e) => {
                      setBuscaColab(e.target.value);
                      // Limpa seleção ao digitar novamente
                      if (form.colaborador_id) setForm(f => ({ ...f, colaborador_id: "", colaborador_nome: "" }));
                    }}
                  />
                </div>

                {/* Resultado selecionado */}
                {form.colaborador_nome && (
                  <div className="flex items-center justify-between p-3 bg-[var(--brand)]/10 border border-[var(--brand)]/30 rounded-xl mb-2">
                    <span className="text-sm font-black text-[var(--brand)]">{form.colaborador_nome}</span>
                    <button onClick={() => setForm(f => ({ ...f, colaborador_id: "", colaborador_nome: "" }))} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Lista de sugestões */}
                {!form.colaborador_id && buscaColab.length >= 1 && (
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                    {loadingColab ? (
                      <div className="flex items-center justify-center p-4 gap-2 text-[var(--text-muted)]">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-xs">Carregando...</span>
                      </div>
                    ) : colaboradoresFiltrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                        Nenhum colaborador encontrado
                      </div>
                    ) : (
                      colaboradoresFiltrados.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, colaborador_id: c.id, colaborador_nome: c.nome }));
                            setBuscaColab("");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-card-hover)] transition-colors border-b border-[var(--border)] last:border-none text-left"
                        >
                          <div className="w-7 h-7 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] text-[10px] font-black flex-shrink-0">
                            {(c.nome || "?").charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--text-primary)]">{c.nome}</div>
                            <div className="text-[10px] text-[var(--text-muted)] uppercase">{c.cargo}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Tipo de Acidente */}
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                  Tipo de Acidente *
                </label>
                <select
                  className="input-field w-full"
                  value={form.tipo_acidente}
                  onChange={(e) => setForm(f => ({ ...f, tipo_acidente: e.target.value }))}
                >
                  <option value="">Selecione o tipo...</option>
                  {TIPOS_ACIDENTE.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Data e Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                    Data do Acidente *
                  </label>
                  <input
                    type="date"
                    className="input-field w-full"
                    value={form.data_acidente}
                    onChange={(e) => setForm(f => ({ ...f, data_acidente: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                    Hora Aproximada
                  </label>
                  <input
                    type="time"
                    className="input-field w-full"
                    value={form.hora_acidente}
                    onChange={(e) => setForm(f => ({ ...f, hora_acidente: e.target.value }))}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                  Descrição do Fato *
                </label>
                <textarea
                  rows={3}
                  className="input-field w-full resize-none"
                  placeholder="Relato detalhado do acidentado ou testemunhas..."
                  value={form.descricao}
                  onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                />
              </div>

              {/* Testemunhas */}
              <div>
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-2 block tracking-wider">
                  Testemunhas (se houver)
                </label>
                <input
                  className="input-field w-full"
                  placeholder="Nome e cargo das testemunhas..."
                  value={form.testemunhas}
                  onChange={(e) => setForm(f => ({ ...f, testemunhas: e.target.value }))}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCAT(false)}
                  className="flex-1 btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={handleSubmit}
                  className="flex-1 btn-brand !bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : "Salvar e Notificar SST"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
