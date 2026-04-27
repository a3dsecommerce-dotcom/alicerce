"use client";
import { useState } from "react";
import { 
  ShieldAlert, 
  Search, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Activity
} from "lucide-react";
import { n8n } from "@/lib/n8n";

export default function CATInvestigationPage() {
  const [busca, setBusca] = useState("");
  const [modalCAT, setModalCAT] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="text-red-500" /> Segurança do Trabalho: Investigação de CAT
          </h1>
          <p className="text-white/50 text-sm mt-1">Módulo de registro e análise de incidentes de trabalho (SST).</p>
        </div>
        <button 
          onClick={() => setModalCAT(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus size={18} /> Iniciar Nova Investigação
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "CATs Abertas (Mês)", value: "3", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Dias sem Acidentes", value: "142", icon: ShieldAlert, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Pendentes de Laudo", value: "1", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
          { label: "EPIs em Conformidade", value: "98%", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{kpi.value}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content - List of CATs */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Histórico de Ocorrências SST</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              placeholder="Buscar por colaborador ou tipo..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-red-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/40 text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Colaborador / Unidade</th>
                <th className="px-6 py-4 font-semibold">Tipo de Acidente</th>
                <th className="px-6 py-4 font-semibold">Data Ocorrência</th>
                <th className="px-6 py-4 font-semibold">Status Investigação</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { nome: "Marcos Oliveira", cargo: "ASG", unidade: "Escola Solimões", tipo: "Queda em mesmo nível", data: "15/04/2026", status: "EM ANÁLISE", cor: "text-orange-500", bg: "bg-orange-500/10" },
                { nome: "Júlia Santos", cargo: "Zeladora", unidade: "UBS Norte", tipo: "Pérfuro-cortante", data: "10/04/2026", status: "CONCLUÍDO", cor: "text-green-500", bg: "bg-green-500/10" },
                { nome: "Roberto Lima", cargo: "ASG", unidade: "SEMED", tipo: "Trajeto", data: "05/04/2026", status: "PENDENTE LAUDO", cor: "text-red-500", bg: "bg-red-500/10" },
              ].map((item, idx) => (
                <tr key={idx} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{item.nome}</div>
                    <div className="text-[10px] text-white/40">{item.cargo} | {item.unidade}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60">{item.tipo}</td>
                  <td className="px-6 py-4 text-xs text-white/60">{item.data}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.bg} ${item.cor}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-red-500 hover:text-red-400 text-[10px] font-bold flex items-center gap-1 ml-auto">
                      GERAR LAUDO SST <FileText size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CAT - Placeholder for Form */}
      {modalCAT && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#121212] border border-white/10 w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500">
                <Stethoscope size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">Formulário de Investigação de CAT</h2>
                <p className="text-xs text-white/40">Coleta de dados técnicos para abertura de Comunicação de Acidente de Trabalho.</p>
              </div>
            </div>

            <form className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Colaborador Acidentado</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-all">
                  <option>Pesquisar colaborador...</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Data do Acidente</label>
                <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Hora Aproximada</label>
                <input type="time" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-all" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Descrição do Fato</label>
                <textarea rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-all resize-none" placeholder="Relato inicial do acidentado ou testemunhas..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-white/40 uppercase mb-1.5 block">Testemunhas (se houver)</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none transition-all" placeholder="Nome e cargo das testemunhas..." />
              </div>

              <div className="col-span-2 flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalCAT(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={() => { n8n.trigger('investigacao-cat-iniciada', { status: 'new' }); alert("Fluxo de investigação iniciado! O Técnico de Segurança receberá os dados."); setModalCAT(false); }}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Salvar e Notificar SST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
