"use client";
import { useState, useEffect } from "react";
import { 
  Shield, Settings, Database, Loader, MapPin, Plus, Building2, User, Phone, Map, Users, Search, Truck,
  LayoutDashboard, ClipboardList, ShieldAlert, Trophy, Target, Calculator
} from "lucide-react";
import { useGerenciaData } from "./gerencia/useGerenciaData";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import UnidadesTable from "./operacional/UnidadesTable";
import VolantesEscala from "./rh/VolantesEscala";
import VisaoGeral from "./gerencia/VisaoGeral";
import MissoesManager from "./gerencia/MissoesManager";
import ActivitiesLog from "./gerencia/ActivitiesLog";
import DenunciasManager from "./gerencia/DenunciasManager";
import CotasManager from "./gerencia/CotasManager";

export default function GerenciaModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading: loadingGerencia, logs, stats, volantes, requisicoesVolantes, refresh } = useGerenciaData();
  const [activeTab, setActiveTab] = useState<"VISAO" | "CONFIG" | "DB" | "ROTAS" | "AUDITORIA" | "VOLANTES" | "MISSOES" | "DENUNCIAS" | "COTAS">((initialTab?.toUpperCase() as any) || "VISAO");
  const [loading, setLoading] = useState(false);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
   const [busca, setBusca] = useState("");
   const [supervisores, setSupervisores] = useState<any[]>([]);
   const [configRotas, setConfigRotas] = useState<any[]>([]);
   const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [newUnit, setNewUnit] = useState({
    secretaria: "SEMED",
    nome: "",
    endereco: "",
    numero: "",
    bairro: "",
    diretor: "",
    telefone: "",
    atendidos_dia: "",
    status: "ATIVO",
    rota: "ROTA 1"
  });

  const resetForm = () => {
    setNewUnit({
      secretaria: "SEMED",
      nome: "",
      endereco: "",
      numero: "",
      bairro: "",
      diretor: "",
      telefone: "",
      atendidos_dia: "",
      status: "ATIVO",
      rota: "ROTA 1"
    });
    setEditingUnit(null);
  };

  const handleEdit = (u: any) => {
    setEditingUnit(u);
    setNewUnit({
      secretaria: u.secretaria || "SEMED",
      nome: u.nome || "",
      endereco: u.endereco || "",
      numero: u.numero || "",
      bairro: u.bairro || "",
      diretor: u.diretor || "",
      telefone: u.telefone || "",
      atendidos_dia: u.atendidos_dia?.toString() || "",
      status: u.status || "ATIVO",
      rota: u.rota || "ROTA 1"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: any) => {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) return;

    const { error } = await supabase.from('unidades').delete().eq('id', id);
    if (!error) {
      toast.success("Unidade excluída!");
      fetchUnidades();
    } else {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab.toUpperCase() as any);
    } else {
      setActiveTab("VISAO");
    }
  }, [initialTab]);

  useEffect(() => {
    fetchConfigRotas();
    fetchUnidades();
  }, []);

  useEffect(() => {
    if (activeTab === "ROTAS") {
      fetchUnidades();
      fetchConfigRotas();
    }
  }, [activeTab]);

  const fetchConfigRotas = async () => {
    // 1. Fetch Encarregados (Mais abrangente para capturar variações de escrita)
    const { data: users } = await supabase
      .from('usuarios')
      .select('id, nome, nivel_acesso')
      .or('cargo.ilike.%encarregado%,nivel_acesso.in.(2,3)')
      .eq('status', 'ATIVO');
    setSupervisores(users || []);

    // 2. Fetch Configurações de Rota
    const { data: configs } = await supabase
      .from('config_rotas')
      .select('*')
      .order('rota_nome');
    setConfigRotas(configs || []);
  };

  const handleUpdateRotaConfig = async (rotaNome: string, encId: string) => {
    const encNome = supervisores.find(s => s.id === encId)?.nome || "";
    const { error } = await supabase
      .from('config_rotas')
      .update({ encarregado_id: encId, encarregado_nome: encNome, updated_at: new Date().toISOString() })
      .eq('rota_nome', rotaNome);
    
    if (!error) {
      toast.success(`Supervisor da ${rotaNome} atualizado!`);
      fetchConfigRotas();
    } else {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const fetchUnidades = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('unidades').select('*').order('nome');
      if (error) throw error;
      setUnidades(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar unidades: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUnit = async () => {
    if (!newUnit.nome || !newUnit.secretaria) {
      toast.error("Nome e Secretaria são obrigatórios");
      return;
    }

    setSaving(true);
    
    // Busca automática do encarregado baseado na rota escolhida
    const rotaConfig = configRotas.find(r => r.rota_nome === newUnit.rota);

    const payload = {
      ...newUnit,
      encarregado_id: rotaConfig?.encarregado_id || null,
      encarregado_nome: rotaConfig?.encarregado_nome || null,
      atendidos_dia: parseInt(newUnit.atendidos_dia) || 0,
      atualizado_em: new Date().toISOString()
    };

    let error;
    if (editingUnit) {
      const { error: err } = await supabase.from('unidades').update(payload).eq('id', editingUnit.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('unidades').insert([{
        ...payload,
        criado_em: new Date().toISOString()
      }]);
      error = err;
    }

    if (!error) {
      toast.success(editingUnit ? "Unidade atualizada!" : "Unidade cadastrada!");
      setIsModalOpen(false);
      resetForm();
      fetchUnidades();
    } else {
      toast.error("Erro ao salvar: " + error.message);
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

        {/* Tabs — scrollable para não vazar em telas menores (Fix #1) */}
        <div className="overflow-x-auto pb-1">
          <div className="flex items-center gap-2 bg-[var(--bg-base)] p-2 rounded-2xl border border-[var(--border)] min-w-max">
            <button 
              onClick={() => setActiveTab("VISAO")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "VISAO" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <LayoutDashboard size={14} /> Visão Geral
            </button>
            <button 
              onClick={() => setActiveTab("VOLANTES")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "VOLANTES" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <ClipboardList size={14} /> Escala
            </button>
            <button 
              onClick={() => setActiveTab("ROTAS")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "ROTAS" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <Truck size={14} /> Unidades
            </button>
            <button 
              onClick={() => setActiveTab("MISSOES")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "MISSOES" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <Trophy size={14} /> Missões
            </button>
            <button 
              onClick={() => setActiveTab("COTAS")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "COTAS" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <Calculator size={14} /> Cotas ASG
            </button>
            <button 
              onClick={() => setActiveTab("AUDITORIA")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "AUDITORIA" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <ShieldAlert size={14} /> Auditoria
            </button>
            <button 
              onClick={() => setActiveTab("DENUNCIAS")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "DENUNCIAS" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-950"}`}
            >
              <ShieldAlert size={14} /> Canal Ético
            </button>
            <button 
              onClick={() => setActiveTab("DB")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "DB" ? "bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20" : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"}`}
            >
              <Database size={14} /> Dados
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-10 overflow-hidden">

        {activeTab === "VISAO" && (
           <VisaoGeral stats={stats} logs={logs} />
        )}

        {activeTab === "MISSOES" && (
           <MissoesManager />
        )}

        {activeTab === "COTAS" && (
           <CotasManager />
        )}

        {activeTab === "DENUNCIAS" && (
           <DenunciasManager />
        )}

        {activeTab === "ROTAS" && (
          <div className="flex flex-col gap-8">
            <div className="bg-[var(--bg-card)] p-10 rounded-[3rem] border border-[var(--border)] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-black text-[var(--text-primary)] italic">Unidades Operacionais</h3>
                <button 
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3 py-1.5 bg-[var(--brand)]/10 text-[var(--brand)] rounded-lg text-[9px] font-black uppercase border border-[var(--brand)]/20 hover:bg-[var(--brand)] hover:text-white transition-all flex items-center gap-2 w-fit"
                >
                  <Settings size={12} /> Configurar Responsáveis
                </button>
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
                  onClick={() => { resetForm(); setIsModalOpen(true); }}
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
                <UnidadesTable 
                  unidades={unidades} 
                  busca={busca} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "VOLANTES" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <VolantesEscala 
              volantes={volantes}
              requisicoes={requisicoesVolantes}
              refresh={refresh}
              user={user}
            />
          </div>
        )}

        {/* Fix #6: Auditoria agora mostra logs reais, DB/CONFIG ainda em dev */}
        {activeTab === "AUDITORIA" && (
          <ActivitiesLog logs={logs} />
        )}

        {(activeTab === "CONFIG" || activeTab === "DB") && (
          <div className="flex-1 flex items-center justify-center p-20 bg-[var(--bg-card)] rounded-[3rem] border border-dashed border-[var(--border)] opacity-40">
            <div className="text-center">
              <Shield size={64} className="mx-auto mb-6 text-[var(--brand)] animate-pulse" />
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-[var(--text-primary)]">Módulo em Desenvolvimento</h3>
              <p className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest mt-2 max-w-xs mx-auto leading-relaxed">
                As funcionalidades avançadas de {activeTab === "DB" ? "Gerenciamento de Dados" : "Configurações"} estão sendo implementadas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CADASTRO UNIDADE */}
      <AdaptiveModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); resetForm(); }} 
        title={editingUnit ? "Editar Unidade" : "Novo Cadastro de Unidade"}
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
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><MapPin size={12}/> Rota / Responsavel</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.rota}
                onChange={e => setNewUnit({...newUnit, rota: e.target.value})}
              >
                {configRotas.length > 0 ? (
                  configRotas.map(r => (
                    <option key={r.id} value={r.rota_nome}>
                      {r.rota_nome}: {r.encarregado_nome || "NÃO ATRIBUÍDO"}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ROTA 1">ROTA 1</option>
                    <option value="ROTA 2">ROTA 2</option>
                    <option value="ROTA 3">ROTA 3</option>
                    <option value="ROTA 4">ROTA 4</option>
                    <option value="ROTA 5">ROTA 5</option>
                  </>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2"><Shield size={12}/> Status</label>
              <select 
                className="input-field w-full h-12 font-bold"
                value={newUnit.status}
                onChange={e => setNewUnit({...newUnit, status: e.target.value})}
              >
                <option value="ATIVO">ATIVO</option>
                <option value="INATIVO">INATIVO</option>
              </select>
            </div>
          </div>

          <button 
            disabled={saving}
            onClick={handleCreateUnit}
            className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {saving ? "Salvando..." : editingUnit ? "Salvar Alteracoes" : "Finalizar Cadastro de Unidade"}
          </button>
        </div>
      </AdaptiveModal>

      {/* MODAL CONFIGURACAO DE RESPONSAVEIS DE ROTA */}
      <AdaptiveModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Gestão de Responsáveis por Rota"
        width="500px"
      >
        <div className="p-8 space-y-6">
          <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed bg-[var(--bg-base)] p-4 rounded-xl border border-[var(--border)]">
            Selecione o Encarregado (Nível 2) responsável por cada rota. Isso atualizará automaticamente quem gerencia as unidades vinculadas.
          </p>
          
          <div className="space-y-4">
            {configRotas.map((rota) => (
              <div key={rota.id} className="flex flex-col gap-2 p-4 bg-[var(--bg-base)]/50 rounded-2xl border border-[var(--border)]">
                <label className="text-[10px] font-black uppercase text-[var(--brand)] flex justify-between items-center">
                  <span>{rota.rota_nome}</span>
                  <span className="text-[8px] text-[var(--text-muted)]">Última alteração: {new Date(rota.updated_at).toLocaleDateString()}</span>
                </label>
                <select 
                  className="input-field w-full h-12 font-bold !bg-white"
                  value={rota.encarregado_id || ""}
                  onChange={(e) => handleUpdateRotaConfig(rota.rota_nome, e.target.value)}
                >
                  <option value="">NÃO ATRIBUÍDO</option>
                  {supervisores.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.nome}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsConfigModalOpen(false)}
            className="w-full h-14 bg-black text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Fechar Configuração
          </button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
