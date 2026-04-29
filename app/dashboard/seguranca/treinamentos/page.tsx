"use client";
import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  FileCheck,
  UserCheck,
  BadgeAlert
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function TreinamentosNRPage() {
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [treinamentos, setTreinamentos] = useState<any[]>([]);

  useEffect(() => {
    // Simular carregamento de treinamentos NR
    setTimeout(() => {
      setTreinamentos([
        { id: 1, nr: "NR-06", titulo: "Uso e Conservação de EPI", data: "2026-04-10", validade: "2027-04-10", status: "CONCLUÍDO", participantes: 45, aproveitamento: "98%" },
        { id: 2, nr: "NR-35", titulo: "Trabalho em Altura", data: "2026-05-15", validade: "2028-05-15", status: "AGENDADO", participantes: 12, aproveitamento: "-" },
        { id: 3, nr: "NR-10", titulo: "Segurança em Instalações Elétricas", data: "2026-03-20", validade: "2027-03-20", status: "VENCENDO", participantes: 8, aproveitamento: "100%" },
        { id: 4, nr: "NR-18", titulo: "Segurança na Construção Civil", data: "2026-02-10", validade: "2027-02-10", status: "CONCLUÍDO", participantes: 120, aproveitamento: "92%" },
      ]);
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="text-blue-500" /> Treinamentos e Normas Regulamentadoras
          </h1>
          <p className="text-white/50 text-sm mt-1">Gestão de capacitação técnica, certificados e validade de NRs.</p>
        </div>
        <button 
          onClick={() => alert("Abrindo painel de agendamento de treinamento...")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} /> Agendar Novo Treinamento
        </button>
      </div>

      {/* Grid de KPIs de Treinamento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">185</div>
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Colaboradores Certificados</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <BadgeAlert size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">24</div>
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Certificações a Vencer (30d)</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">96%</div>
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Taxa de Aproveitamento</div>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">08</div>
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Treinamentos Obrigatórios Pendentes</div>
        </div>
      </div>

      {/* Lista de Treinamentos */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex-1">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">Cronograma de Capacitação SST</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              placeholder="Buscar NR ou treinamento..." 
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/40 text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-semibold">Norma / Título</th>
                <th className="px-6 py-4 font-semibold">Data Realização</th>
                <th className="px-6 py-4 font-semibold">Validade</th>
                <th className="px-6 py-4 font-semibold">Participantes</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {treinamentos
                .filter(t => (t.titulo || "").toLowerCase().includes((busca || "").toLowerCase()) || (t.nr || "").toLowerCase().includes((busca || "").toLowerCase()))
                .map((t) => (
                <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-sm">{t.nr}: {t.titulo}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(t.data).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/60">{new Date(t.validade).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-white/80">{t.participantes} colaboradores</div>
                    <div className="text-[10px] text-white/40">Aproveitamento: {t.aproveitamento}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'CONCLUÍDO' ? 'bg-green-500/10 text-green-500' : 
                      t.status === 'AGENDADO' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-500 hover:text-blue-400 text-[10px] font-bold flex items-center gap-1 ml-auto">
                      GERAR CERTIFICADOS <FileCheck size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
