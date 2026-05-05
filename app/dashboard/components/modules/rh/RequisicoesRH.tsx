"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Package, Search, Plus, FileText, CheckCircle, Clock, AlertTriangle, 
  ShoppingCart, Filter, Save, X, PlusCircle, LayoutGrid, Loader, ListChecks, History,
  ArrowRight, Trash2
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
      return toast.warning("Informe as quantidades dos itens que deseja solicitar.");
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
          unidade_destino: "Escritório Central (RH)",
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

      toast.success(`Requisição ${protocolo} enviada para compra!`);
      setVolumes({});
      setObservacaoGeral("");
      setActiveSubTab("ACOMPANHAR");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao enviar: " + err.message);
    } finally {
      setLoadingAcao(false);
    }
  };

  const handleCadastrarNovoProd = async () => {
    if (!novoProd.item) return toast.error("Informe o nome do item.");
    
    setLoadingAcao(true);
    try {
      const { data: newProd, error: prodErr } = await supabase.from('almox_escritorio').insert([{
        item: novoProd.item.toUpperCase(),
        categoria: 'ESCRITORIO',
        unidade_medida: novoProd.unidade_medida,
        quantidade_atual: 0,
        estoque_minimo: 0
      }]).select().single();

      if (prodErr) throw prodErr;

      const protocolo = `REQ-RH-NEW-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error: reqErr } = await supabase.from('requisicoes').insert([{
        item_id: newProd.id,
        item_nome: newProd.item,
        solicitante: user.nome || user.name,
        unidade_destino: "Escritório Central (RH)",
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

      toast.success("Item registrado e solicitado!");
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
      {/* Hero Section */}
      <div className="bg-indigo-700 p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform rotate-12">
           <ShoppingCart size={180} />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">Requisição Direta</span>
              <span className="px-3 py-1 bg-indigo-400/30 rounded-full text-[9px] font-black uppercase tracking-widest">Sem Estoque Físico</span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter">Materiais de Escritório</h2>
            <p className="text-indigo-100/70 text-sm font-medium mt-2 max-w-md">Solicite o que for necessário para o dia a dia. Se não encontrar na lista, cadastre um novo item.</p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            {activeSubTab === "CATALOGO" && (
              <button 
                onClick={handleEnviarPedidoGeral}
                disabled={loadingAcao || Object.values(volumes).every(v => !v || v <= 0)}
                className="h-16 px-10 bg-white text-indigo-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-black/20 disabled:opacity-50"
              >
                <Save size={20} /> Solicitar Itens Selecionados
              </button>
            )}
            <button 
              onClick={() => setModalNovoProduto(true)}
              className="h-16 px-8 bg-indigo-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-400 transition-all border border-indigo-400 shadow-lg"
            >
              <PlusCircle size={20} /> Outro Material
            </button>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex justify-center">
        <div className="flex gap-2 p-2 bg-slate-100 rounded-3xl border border-slate-200">
          <button 
            onClick={() => setActiveSubTab("CATALOGO")}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeSubTab === "CATALOGO" ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <ListChecks size={18} /> Catálogo de Itens
          </button>
          <button 
            onClick={() => setActiveSubTab("ACOMPANHAR")}
            className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeSubTab === "ACOMPANHAR" ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <History size={18} /> Acompanhar Compras
          </button>
        </div>
      </div>

      {activeSubTab === "CATALOGO" ? (
        <div className="flex flex-col gap-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">O que você precisa?</label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  className="input-field !h-16 pl-16 !rounded-2xl border-2 focus:border-indigo-500 bg-slate-50 font-black text-sm" 
                  placeholder="Caneta, papel, cartucho..." 
                  value={buscaMaterial}
                  onChange={(e) => setBuscaMaterial(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Justificativa ou Observação</label>
              <input 
                className="input-field !h-16 !rounded-2xl border-2 focus:border-indigo-500 bg-slate-50 font-bold text-sm" 
                placeholder="Ex: Para uso no setor de DP..." 
                value={observacaoGeral}
                onChange={(e) => setObservacaoGeral(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 pl-12">Descrição do Material</th>
                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Unidade</th>
                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Quantidade</th>
                    <th className="p-8 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradosCatalogo.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-20 text-center">
                        <p className="text-sm font-black text-slate-300 uppercase italic tracking-widest">Nenhum material encontrado. Clique em "Outro Material" para adicionar.</p>
                      </td>
                    </tr>
                  ) : filtradosCatalogo.map((i) => (
                    <tr key={i.id} className={`transition-colors ${volumes[i.id] > 0 ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                      <td className="p-8 pl-12">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${volumes[i.id] > 0 ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                             <LayoutGrid size={20} />
                          </div>
                          <span className="text-sm font-black text-slate-900 uppercase tracking-tight leading-tight">{i.item}</span>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase px-3 py-1 bg-slate-100 rounded-lg">{i.unidade_medida}</span>
                      </td>
                      <td className="p-8">
                        <div className="flex items-center justify-center gap-4">
                          <button 
                            onClick={() => setVolumes({...volumes, [i.id]: Math.max(0, (volumes[i.id] || 0) - 1)})}
                            className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400"
                          >-</button>
                          <input 
                            type="number" 
                            min="0"
                            className="w-20 h-12 rounded-xl border-2 border-slate-100 bg-white text-center text-sm font-black focus:border-indigo-500 transition-all outline-none"
                            value={volumes[i.id] || ""}
                            onChange={(e) => setVolumes({...volumes, [i.id]: Math.max(0, Number(e.target.value))})}
                          />
                          <button 
                            onClick={() => setVolumes({...volumes, [i.id]: (volumes[i.id] || 0) + 1})}
                            className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all text-slate-400"
                          >+</button>
                        </div>
                      </td>
                      <td className="p-8 text-center">
                        {volumes[i.id] > 0 && (
                          <button 
                            onClick={() => setVolumes({...volumes, [i.id]: 0})}
                            className="p-3 text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="p-8 pl-12">Protocolo</th>
                  <th className="p-8">Material</th>
                  <th className="p-8 text-center">Qtd</th>
                  <th className="p-8 text-center">Status</th>
                  <th className="p-8 text-right pr-12">Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisicoes.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-8 pl-12">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 leading-tight">{req.protocolo}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic mt-1">{format(new Date(req.data_solicitacao), "dd/MM/yyyy")}</span>
                      </div>
                    </td>
                    <td className="p-8">
                      <p className="text-sm font-black text-slate-900 uppercase leading-tight">{req.item_nome}</p>
                    </td>
                    <td className="p-8 text-center">
                      <span className="text-base font-black text-indigo-600 leading-none">{req.quantidade}</span>
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
                      <p className="text-[10px] font-bold text-slate-400 italic truncate max-w-[150px] ml-auto">{req.observacao || "---"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Novo Item */}
      <AdaptiveModal isOpen={modalNovoProduto} onClose={() => setModalNovoProduto(false)} title="Cadastrar & Pedir Novo Material">
        <div className="p-10 space-y-10 bg-white">
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
            <AlertTriangle className="text-indigo-600" size={24} />
            <p className="text-[11px] font-bold text-indigo-900 uppercase italic">Utilize esta opção apenas se o material não estiver listado no catálogo geral.</p>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Descrição do Produto</label>
            <input 
              className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 uppercase text-sm" 
              placeholder="Ex: TONER HP LASERJET 1020..." 
              value={novoProd.item}
              onChange={e => setNovoProd({...novoProd, item: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Unidade</label>
              <select 
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 appearance-none text-sm"
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
              <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Qtd Necessária</label>
              <input 
                type="number"
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 text-center text-xl" 
                value={novoProd.quantidade}
                onChange={e => setNovoProd({...novoProd, quantidade: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-slate-400 ml-2">Finalidade / Observação</label>
            <textarea 
              className="input-field !h-32 p-6 font-bold !rounded-2xl border-2 focus:border-indigo-500 resize-none text-sm" 
              placeholder="Descreva para que serve..."
              value={novoProd.observacao}
              onChange={e => setNovoProd({...novoProd, observacao: e.target.value})}
            />
          </div>

          <button 
            onClick={handleCadastrarNovoProd}
            disabled={loadingAcao}
            className="w-full h-20 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loadingAcao ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
            {loadingAcao ? "PROCESSANDO..." : "REGISTRAR E SOLICITAR AGORA"}
          </button>
        </div>
      </AdaptiveModal>
    </div>
  );
}
