"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Package, Search, Plus, FileText, CheckCircle, Clock, AlertTriangle, 
  ShoppingCart, Filter, Save, X, PlusCircle, LayoutGrid, Loader, ListChecks, History
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import { format } from "date-fns";

interface Requisicao {
  id: string;
  item_nome: string;
  quantidade: number;
  status: string;
  data_solicitacao: string;
  protocolo: string;
  unidade_medida: string;
  observacao?: string;
}

export default function RequisicoesRH({ user }: { user: any }) {
  const [activeSubTab, setActiveSubTab] = useState<"CATALOGO" | "ACOMPANHAR">("CATALOGO");
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [estoqueEscritorio, setEstoqueEscritorio] = useState<any[]>([]);
  const [modalNovoProduto, setModalNovoProduto] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);

  const [buscaMaterial, setBuscaMaterial] = useState("");
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [observacaoGeral, setObservacaoGeral] = useState("");

  const [novoProd, setNovoProd] = useState({
    item: "",
    unidade_medida: "UN",
    quantidade: 1,
    observacao: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, estRes] = await Promise.all([
        supabase.from('requisicoes').select('*').eq('secretaria_destino', 'RH').order('data_solicitacao', { ascending: false }),
        supabase.from('almox_escritorio').select('*').order('item')
      ]);

      if (reqRes.data) setRequisicoes(reqRes.data);
      if (estRes.data) setEstoqueEscritorio(estRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados RH:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnviarPedidoGeral = async () => {
    const itensParaPedir = Object.keys(volumes).filter(id => volumes[id] > 0);
    
    if (itensParaPedir.length === 0) {
      return toast.warning("Selecione quantidades no catálogo antes de enviar.");
    }

    setLoadingAcao(true);
    try {
      const protocolo = `REQ-RH-${Math.floor(100000 + Math.random() * 900000)}`;
      const dataReq = new Date().toISOString();

      const payload = itensParaPedir.map(id => {
        const item = estoqueEscritorio.find(e => String(e.id) === id);
        return {
          item_id: id,
          item_nome: item?.item || 'Item',
          solicitante: user.nome || user.name,
          unidade_destino: "RH Master",
          secretaria_destino: "RH",
          quantidade: volumes[id],
          status: 'SOLICITADO',
          unidade_medida: item?.unidade_medida || 'UN',
          protocolo: protocolo,
          tipo_item: 'ESCRITORIO',
          data_solicitacao: dataReq,
          observacao: observacaoGeral
        };
      });

      const { error } = await supabase.from('requisicoes').insert(payload);
      if (error) throw error;

      toast.success(`Pedido ${protocolo} enviado com sucesso!`);
      setVolumes({});
      setObservacaoGeral("");
      setActiveSubTab("ACOMPANHAR");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao enviar pedido: " + err.message);
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleCadastrarNovoProd = async () => {
    if (!novoProd.item) return toast.error("Informe o nome do item.");
    
    setLoadingAcao(true);
    try {
      const { data: newProd, error: prodErr } = await supabase.from('almox_escritorio').insert([{
        item: novoProd.item,
        categoria: 'ESCRITORIO',
        unidade_medida: novoProd.unidade_medida,
        quantidade_atual: 0,
        estoque_minimo: 1
      }]).select().single();

      if (prodErr) throw prodErr;

      const protocolo = `REQ-RH-NEW-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error: reqErr } = await supabase.from('requisicoes').insert([{
        item_id: newProd.id,
        item_nome: newProd.item,
        solicitante: user.nome || user.name,
        unidade_destino: "RH Master",
        secretaria_destino: "RH",
        quantidade: novoProd.quantidade,
        status: 'SOLICITADO',
        unidade_medida: novoProd.unidade_medida,
        protocolo: protocolo,
        tipo_item: 'ESCRITORIO',
        data_solicitacao: new Date().toISOString(),
        observacao: novoProd.observacao
      }]);

      if (reqErr) throw reqErr;

      toast.success("Novo item cadastrado e requisitado!");
      setModalNovoProduto(false);
      setNovoProd({ item: "", unidade_medida: "UN", quantidade: 1, observacao: "" });
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoadingAcao(false);
    }
  };

  const filtradosCatalogo = estoqueEscritorio.filter(i => 
    i.item.toLowerCase().includes(buscaMaterial.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Header com Botões de Ação */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <ShoppingCart size={120} />
        </div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20 shadow-inner">
            <Package size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Requisição Interna RH</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Materiais de Escritório & Papelaria</p>
          </div>
        </div>

        <div className="flex items-center gap-4 z-10 w-full lg:w-auto">
          {activeSubTab === "CATALOGO" && (
            <button 
              onClick={handleEnviarPedidoGeral}
              disabled={loadingAcao || Object.values(volumes).every(v => !v || v <= 0)}
              className="h-16 px-10 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save size={20} /> Finalizar & Enviar Pedido
            </button>
          )}
          <button 
            onClick={() => setModalNovoProduto(true)}
            className="h-16 px-10 bg-slate-100 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-200 transition-all border border-slate-200"
          >
            <PlusCircle size={20} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Navegação Sub-Tabs */}
      <div className="flex gap-4 p-2 bg-[var(--bg-base)]/30 rounded-3xl w-fit border border-[var(--border)]/50 self-center lg:self-start">
        <button 
          onClick={() => setActiveSubTab("CATALOGO")}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeSubTab === "CATALOGO" ? 'bg-white text-indigo-600 shadow-xl' : 'text-[var(--text-muted)] hover:text-slate-900'}`}
        >
          <ListChecks size={18} /> Catálogo Disponível
        </button>
        <button 
          onClick={() => setActiveSubTab("ACOMPANHAR")}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeSubTab === "ACOMPANHAR" ? 'bg-white text-indigo-600 shadow-xl' : 'text-[var(--text-muted)] hover:text-slate-900'}`}
        >
          <History size={18} /> Acompanhar Pedidos
        </button>
      </div>

      {activeSubTab === "CATALOGO" ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row gap-6 items-end">
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-4">Filtrar Material</label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  className="input-field !h-16 pl-16 !rounded-3xl border-2 focus:border-indigo-500 shadow-sm" 
                  placeholder="Pesquise por nome do item..." 
                  value={buscaMaterial}
                  onChange={(e) => setBuscaMaterial(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-4">Observação do Pedido (Opcional)</label>
              <input 
                className="input-field !h-16 !rounded-3xl border-2 focus:border-indigo-500 shadow-sm" 
                placeholder="Ex: Urgente para reunião de amanhã..." 
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] pl-12">Item / Descrição</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Unidade</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Estoque Atual</th>
                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Quantidade Pedida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtradosCatalogo.map((i) => (
                    <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-8 pl-12">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                             <LayoutGrid size={24} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{i.item}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Categoria: MATERIAL DE ESCRITÓRIO</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-xs font-black text-slate-500 uppercase px-3 py-1 bg-slate-100 rounded-lg">{i.unidade_medida}</span>
                      </td>
                      <td className="p-8 text-center">
                        <span className={`text-sm font-black ${i.quantidade_atual < (i.estoque_minimo || 5) ? 'text-red-600' : 'text-slate-900'}`}>
                          {i.quantidade_atual || 0}
                        </span>
                      </td>
                      <td className="p-8">
                        <input 
                          type="number" 
                          min="0"
                          className="w-28 h-14 mx-auto block rounded-2xl border-2 border-slate-100 bg-white text-center text-lg font-black focus:border-indigo-500 focus:shadow-lg transition-all outline-none"
                          placeholder="0"
                          value={volumes[i.id] || ""}
                          onChange={(e) => setVolumes({...volumes, [i.id]: Number(e.target.value)})}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden animate-fade-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <tr>
                  <th className="p-8 pl-12">Protocolo / Data</th>
                  <th className="p-8">Material Solicitado</th>
                  <th className="p-8 text-center">Quantidade</th>
                  <th className="p-8 text-center">Status</th>
                  <th className="p-8 text-right pr-12">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {requisicoes.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-8 pl-12">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900">{req.protocolo}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic mt-1">{format(new Date(req.data_solicitacao), "dd/MM/yyyy HH:mm")}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="text-sm font-black text-slate-900 uppercase">{req.item_nome}</p>
                    </td>
                    <td className="p-8 text-center">
                      <span className="text-lg font-black text-indigo-600">{req.quantidade}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase ml-1">{req.unidade_medida}</span>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                        req.status === 'SOLICITADO' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        req.status === 'APROVADO' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        req.status === 'ENTREGUE' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-8 text-right pr-12">
                      <p className="text-[10px] font-bold text-slate-500 italic truncate max-w-[150px] ml-auto">{req.observacao || "Sem obs."}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Novo Produto */}
      <AdaptiveModal isOpen={modalNovoProduto} onClose={() => setModalNovoProduto(false)} title="Cadastrar Novo Item de Escritório">
        <div className="p-10 space-y-10 bg-slate-50/50">
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Nome do Material</label>
            <input 
              className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500" 
              placeholder="Ex: Caneta Azul Bic..." 
              value={novoProd.item}
              onChange={e => setNovoProd({...novoProd, item: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Unidade de Medida</label>
              <select 
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 appearance-none"
                value={novoProd.unidade_medida}
                onChange={e => setNovoProd({...novoProd, unidade_medida: e.target.value})}
              >
                <option value="UN">UNIDADE (UN)</option>
                <option value="CX">CAIXA (CX)</option>
                <option value="PCT">PACOTE (PCT)</option>
                <option value="RL">ROLO (RL)</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Quantidade Inicial Pedida</label>
              <input 
                type="number"
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 text-center text-xl" 
                value={novoProd.quantidade}
                onChange={e => setNovoProd({...novoProd, quantidade: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Observação / Justificativa</label>
            <textarea 
              className="input-field !h-32 p-6 font-bold !rounded-2xl border-2 focus:border-indigo-500 resize-none" 
              placeholder="Descreva a finalidade..."
              value={novoProd.observacao}
              onChange={e => setNovoProd({...novoProd, observacao: e.target.value})}
            />
          </div>

          <button 
            onClick={handleCadastrarNovoProd}
            disabled={loadingAcao}
            className="w-full h-20 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loadingAcao ? "Processando..." : "Cadastrar & Solicitar"}
          </button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
