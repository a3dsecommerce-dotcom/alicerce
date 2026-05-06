"use client";
import { useState, useEffect } from "react";
import { 
  Shield, Settings, Database, Loader, MapPin, Plus, Building2, User, Phone, Map, Users, Search, Truck,
  LayoutDashboard, ClipboardList, ShieldAlert, Trophy, Target
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

export default function GerenciaModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading: loadingGerencia, logs, stats, volantes, requisicoesVolantes, refresh } = useGerenciaData();
  const [activeTab, setActiveTab] = useState<"VISAO" | "CONFIG" | "DB" | "ROTAS" | "AUDITORIA" | "VOLANTES" | "MISSOES">("MISSOES");
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
      setActiveTab("MISSOES");
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

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      <div className="bg-orange-500 text-white p-2 text-[8px] font-black uppercase text-center rounded-lg">CENTRAL OPS ACTIVE</div>
      
      {/* HEADER GESTÃO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Painel de Controle Central</h2>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Shield size={16} className="text-[var(--brand)]" /> Governança & Auditoria Alicerce ERP
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navegação interna simplificada conforme solicitado: Foco em Missões */}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-10 overflow-hidden">

        {activeTab === "MISSOES" && (
           <MissoesManager />
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
