"use client";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  HardHat,
  Eye,
  Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import QuickActions from "../../components/QuickActions";
import ColaboradoresSharedTable from "../../components/ColaboradoresSharedTable";
import TicketHub from "../../components/TicketHub";

export default function GestaoEPISSTPage() {
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function loadEntregas() {
      // Simulando busca de entregas de EPI para auditoria
      // Na vida real, filtraria o estoque/requisicoes por categoria EPI
      const { data } = await supabase
        .from('requisicoes')
        .select('*')
        .eq('status', 'APROVADO') // Apenas o que já foi entregue ou aprovado
        .limit(20);
      
      setEntregas(data || []);
      setLoading(false);
    }
    loadEntregas();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "calc(100vh - 120px)" }}>
      {/* Command Center: Ações Rápidas */}
      <div className="no-print">
        <QuickActions user={{ role: 'TECNICO_SEGURANCA', nivel: 3 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", flex: 1, overflow: "hidden" }} className="no-print">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
      {/* Header Premium */}
      <div className="card !bg-gradient-to-r !from-[var(--brand)] !to-[var(--brand-dark)] !border-none p-8 flex justify-between items-center overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-4 tracking-tight">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <HardHat size={28} className="text-white" />
            </div>
            Gestão de EPIs (Auditoria SST)
          </h1>
          <p className="text-white/70 text-[0.8rem] font-bold mt-2 uppercase tracking-widest">Controle Técnico NR-06 • Monitoramento de Conformidade</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-3 transition-all border border-white/5 backdrop-blur-sm">
            <Download size={18} /> Exportar Relatório
          </button>
          <button className="bg-white text-[var(--brand)] px-8 py-3 rounded-2xl text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-black/10 hover:scale-105 active:scale-95">
            <ShieldCheck size={18} /> Validar Lote
          </button>
        </div>
      </div>

      {/* Stats - Estilo Cockpit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card group hover:border-[var(--brand)]/30 transition-all cursor-default">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={28} />
            </div>
            <div className="text-[0.65rem] font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full">+12% ALTA</div>
          </div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">94.8%</div>
          <div className="text-[0.65rem] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-2">Índice de Conformidade</div>
        </div>

        <div className="card group hover:border-amber-500/30 transition-all cursor-default border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform">
              <Clock size={28} />
            </div>
          </div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">15</div>
          <div className="text-[0.65rem] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-2">C.A Próximos ao Vencimento</div>
        </div>

        <div className="card group hover:border-red-500/30 transition-all cursor-default border-l-4 border-l-red-500">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
              <AlertTriangle size={28} />
            </div>
          </div>
          <div className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">08</div>
          <div className="text-[0.65rem] text-[var(--text-muted)] uppercase font-black tracking-[0.15em] mt-2">Trocas Pendentes (Urgente)</div>
        </div>
      </div>

      {/* Audit Table - Elite Design */}
      <div className="card !p-0 overflow-hidden flex-1">
        <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-card-hover)]/10">
          <div>
            <h2 className="text-[0.9rem] font-black text-[var(--text-primary)] uppercase tracking-widest">Registro de Auditoria SST</h2>
            <p className="text-[0.65rem] font-bold text-[var(--text-muted)] mt-1">CONTROLE DE CONFORMIDADE NR-06</p>
          </div>
          <div className="flex gap-4">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={14} />
              <input 
                placeholder="Filtrar colaborador ou EPI..." 
                className="input-field !pl-12 !h-12 !text-[0.75rem]"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button className="btn-ghost !w-12 !h-12 !p-0 flex items-center justify-center rounded-2xl">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/40 text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4">Colaborador / Rota</th>
                <th className="px-6 py-4">EPI Entregue</th>
                <th className="px-6 py-4">CA (Certif. Aprovação)</th>
                <th className="px-6 py-4">Data Entrega</th>
                <th className="px-6 py-4">Status SST</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { nome: "João Silva", rota: "Rota 01", epi: "Botina Bico de Aço", ca: "42.331", data: "22/04/2026", status: "VALIDADO", cor: "text-green-500", bg: "bg-green-500/10" },
                { nome: "Ana Costa", rota: "Rota 01", epi: "Luva de Vaqueta", ca: "35.120", data: "21/04/2026", status: "AGUARDANDO", cor: "text-yellow-500", bg: "bg-yellow-500/10" },
                { nome: "Maria Oliveira", rota: "Rota 02", epi: "Protetor Auricular", ca: "11.200", data: "20/04/2026", status: "AUDITORIA", cor: "text-blue-500", bg: "bg-blue-500/10" },
              ].map((ent, i) => (
                <tr key={i} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{ent.nome}</div>
                    <div className="text-[10px] text-white/40">{ent.rota}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-white/80">{ent.epi}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-white/40">{ent.ca}</td>
                  <td className="px-6 py-4 text-xs text-white/60">{ent.data}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ent.bg} ${ent.cor}`}>
                      {ent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Ver Ficha de EPI">
                        <Eye size={14} />
                      </button>
                      <button className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all" title="Validar Entrega">
                        <CheckCircle2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>

      {/* Lado Direito: Inteligência Operacional & Efetivo */}
      <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar no-print">
        <TicketHub />
        <ColaboradoresSharedTable />

        <div className="card p-6 bg-[var(--brand)]/5 border-[var(--brand)]/20">
          <h4 className="text-xs font-black text-[var(--brand)] uppercase mb-4">Compliance SST</h4>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Auditoria de conformidade baseada no efetivo real alocado nas unidades.
          </p>
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}
