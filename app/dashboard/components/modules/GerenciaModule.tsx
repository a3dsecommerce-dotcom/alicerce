"use client";
import { useState, useEffect } from "react";
import { 
  Activity, Shield, Settings, Database, Loader, LayoutDashboard, MapPin, Plus, Building2, User, Phone, Map, Users, Search
} from "lucide-react";
import { useGerenciaData } from "./gerencia/useGerenciaData";
import StatsCards from "./gerencia/StatsCards";
import ActivitiesLog from "./gerencia/ActivitiesLog";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import UnidadesTable from "./operacional/UnidadesTable";

export default function GerenciaModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading: loadingGerencia, logs, stats } = useGerenciaData();
  const [activeTab, setActiveTab] = useState<"VISAO" | "CONFIG" | "DB" | "ROTAS">((initialTab as any) || "VISAO");
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");

  const [newUnit, setNewUnit] = useState({
    secretaria: "SEMED",
    nome: "",
    endereco: "",
    numero: "",
    bairro: "",
    diretor: "",
    telefone: "",
    atendidos_dia: ""
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === "ROTAS") {
      fetchUnidades();
    }
  }, [activeTab]);

  const fetchUnidades = async () => {
    setLoading(true);
    const { data } = await supabase.from('unidades').select('*').order('nome');
    setUnidades(data || []);
    setLoading(false);
  };

  const handleCreateUnit = async () => {
    if (!newUnit.nome || !newUnit.secretaria) {
      toast.error("Nome e Secretaria são obrigatórios");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('unidades').insert([{
      ...newUnit,
      atendidos_dia: parseInt(newUnit.atendidos_dia) || 0,
      criado_em: new Date().toISOString()
    }]);

    if (!error) {
      toast.success("Unidade cadastrada com sucesso!");
      setIsModalOpen(false);
      setNewUnit({
        secretaria: "SEMED",
        nome: "",
        endereco: "",
        numero: "",
        bairro: "",
        diretor: "",
        telefone: "",
        atendidos_dia: ""
      });
      fetchUnidades();
    } else {
      toast.error("Erro ao cadastrar: " + error.message);
    }
    setSaving(false);
  };

  if (loadingGerencia && activeTab !== "ROTAS") return (
    <div className="p-20">
      <TableSkeleton rows={12} cols={4} />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      
      {/* HEADER GESTÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Painel de Controle Central</h2>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Shield size={16} className="text-[var(--brand)]" /> Governança & Auditoria Alicerce ERP
          </p>
        </div>

        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-md overflow-x-auto w-full lg:w-auto">
          {[
            { id: "VISAO", label: "Visão Geral", icon: LayoutDashboard },
            { id: "ROTAS", label: "Gestão de Rotas", icon: MapPin },
            { id: "CONFIG", label: "Configurações", icon: Settings },
            { id: "DB", label: "Banco de Dados", icon: Database }
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-10 overflow-hidden">
        {activeTab === "VISAO" && (
          <>
            <StatsCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 flex-1 overflow-hidden min-h-[600px]">
              <div className="lg:col-span-2 flex flex-col">
                <ActivitiesLog logs={logs} />
              </div>
              <div className="space-y-8 flex flex-col">
                <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
                  <h4 className="text-lg font-black uppercase italic relative z-10">Status do Sistema</h4>
                  <div className="mt-8 space-y-6 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Uptime VPS</span>
                      <span className="text-xs font-black text-green-400 uppercase">99.8%</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Integridade DB</span>
                      <span className="text-xs font-black text-blue-400 uppercase">Excelente</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/50 uppercase">Segurança RLS</span>
                      <span className="text-xs font-black text-orange-400 uppercase">Ativo</span>
                    </div>
                  </div>
                  <button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-10">Relatório Forense</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "ROTAS" && (
          <div className="flex flex-col gap-8">
            <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)] italic">Unidades Operacionais</h3>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Gestão de postos e rotas de campo</p>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input 
                    className="input-field w-full pl-11 !h-12 text-[10px] font-black uppercase" 
                    placeholder="Filtrar Unidades..." 
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="h-12 px-8 bg-[var(--brand)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-[var(--brand)]/20"
                >
                  <Plus size={18} /> Cadastrar Unidade
                </button>
              </div>
            </div>

            {loading ? (
              <TableSkeleton rows={8} cols={5} />
            ) : (
              <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl overflow-hidden">
                <UnidadesTable unidades={unidades} busca={busca} />
              </div>
            )}
          </div>
        )}

        {(activeTab === "CONFIG" || activeTab === "DB") && (
          <div className="flex-1 flex items-center justify-center p-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] opacity-40">
            <div className="text-center">
              <Settings size={64} className="mx-auto mb-6 text-[var(--brand)] animate-pulse" />
              <h3 className="text-xl font-black uppercase italic">Módulo em Desenvolvimento</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2">As configurações de sistema estão sendo migradas para a nova arquitetura.</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CADASTRO UNIDADE */}
      <AdaptiveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Cadastro de Unidade"
        width="600px"
      >
        <div className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Shield size={12}/> Secretaria</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.secretaria}
                onChange={e => setNewUnit({...newUnit, secretaria: e.target.value})}
              >
                <option value="SEMED">SEMED (Educação)</option>
                <option value="SEMSA">SEMSA (Saúde)</option>
                <option value="SEMAD">SEMAD (Administração)</option>
                <option value="SEMOSP">SEMOSP (Obras)</option>
                <option value="GABINETE">GABINETE</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Building2 size={12}/> Nome da Unidade</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Ex: Escola Municipal Alicerce"
                value={newUnit.nome}
                onChange={e => setNewUnit({...newUnit, nome: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><MapPin size={12}/> Endereço</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Rua, Avenida..."
                value={newUnit.endereco}
                onChange={e => setNewUnit({...newUnit, endereco: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Número</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="S/N"
                value={newUnit.numero}
                onChange={e => setNewUnit({...newUnit, numero: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Map size={12}/> Bairro</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Bairro da Unidade"
                value={newUnit.bairro}
                onChange={e => setNewUnit({...newUnit, bairro: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Users size={12}/> Atendidos/Dia</label>
              <input 
                type="number"
                className="input-field w-full h-12 font-bold"
                placeholder="Qtd. Pessoas"
                value={newUnit.atendidos_dia}
                onChange={e => setNewUnit({...newUnit, atendidos_dia: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><User size={12}/> Nome Diretor(a)</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="Responsável Local"
                value={newUnit.diretor}
                onChange={e => setNewUnit({...newUnit, diretor: e.target.value.toUpperCase()})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Phone size={12}/> Telefone Contato</label>
              <input 
                className="input-field w-full h-12 font-bold"
                placeholder="(00) 00000-0000"
                value={newUnit.telefone}
                onChange={e => setNewUnit({...newUnit, telefone: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handleCreateUnit}
            className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Finalizar Cadastro de Unidade"}
          </button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
