"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Package, Search, Plus, FileText, CheckCircle, Clock, AlertTriangle, 
  ShoppingCart, Filter, Save, X, PlusCircle, LayoutGrid
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
  const [loading, setLoading] = useState(true);
  const [requisicoes, setRequisicoes] = useState<Requisicao[]>([]);
  const [estoqueEscritorio, setEstoqueEscritorio] = useState<any[]>([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [loadingAcao, setLoadingAcao] = useState(false);

  const [buscaMaterial, setBuscaMaterial] = useState("");
  const [materiaisSugeridos, setMateriaisSugeridos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    item_id: "",
    item_nome: "",
    unidade_medida: "UN",
    quantidade: 1,
    observacao: "",
    is_new_product: false
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
      console.error("Erro ao carregar requisições RH:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchMateriais = (val: string) => {
    setBuscaMaterial(val);
    if (val.length > 1) {
      const filtered = estoqueEscritorio.filter(m => 
        m.item.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setMateriaisSugeridos(filtered);
    } else {
      setMateriaisSugeridos([]);
    }
  };

  const handleSalvarReq = async () => {
    if (!formData.item_nome || formData.quantidade <= 0) {
      return toast.error("Preencha o nome do item e a quantidade.");
    }

    setLoadingAcao(true);
    try {
      let finalItemId = formData.item_id;
      let finalItemNome = formData.item_nome;

      // Se for um novo produto, cadastra no almox_escritorio primeiro
      if (formData.is_new_product) {
        const { data: newProd, error: prodErr } = await supabase.from('almox_escritorio').insert([{
          item: formData.item_nome,
          categoria: 'ESCRITORIO',
          unidade_medida: formData.unidade_medida,
          quantidade_atual: 0, // Começa zerado no almoxarifado
          estoque_minimo: 1
        }]).select().single();

        if (prodErr) throw prodErr;
        finalItemId = newProd.id;
      }

      const protocolo = `REQ-RH-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: reqErr } = await supabase.from('requisicoes').insert([{
        item_id: finalItemId,
        item_nome: finalItemNome,
        solicitante: user.nome || user.name,
        unidade_destino: "RH Master",
        secretaria_destino: "RH",
        quantidade: formData.quantidade,
        status: 'SOLICITADO',
        unidade_medida: formData.unidade_medida,
        protocolo: protocolo,
        tipo_item: 'ESCRITORIO',
        data_solicitacao: new Date().toISOString(),
        observacao: formData.observacao
      }]);

      if (reqErr) throw reqErr;

      toast.success("Requisição enviada ao Almoxarifado!");
      setModalNovo(false);
      setFormData({ item_id: "", item_nome: "", unidade_medida: "UN", quantidade: 1, observacao: "", is_new_product: false });
      setBuscaMaterial("");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao processar requisição: " + err.message);
    } finally {
      setLoadingAcao(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-10 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-500/20 shadow-inner">
            <ShoppingCart size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tight">Requisições de Suprimentos</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Materiais de escritório e consumo administrativo</p>
          </div>
        </div>

        <button 
          onClick={() => setModalNovo(true)}
          className="h-16 px-10 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
        >
          <Plus size={20} /> Nova Requisição
        </button>
      </div>

      <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] pl-12">Protocolo / Data</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Material Solicitado</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Quantidade</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-right pr-12">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader className="animate-spin mx-auto text-indigo-500" size={32} /></td></tr>
              ) : requisicoes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-40">
                    <Package size={48} className="mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Nenhuma requisição realizada.</p>
                  </td>
                </tr>
              ) : requisicoes.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-8 pl-12">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-[var(--text-primary)]">{req.protocolo}</span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase italic mt-1">{format(new Date(req.data_solicitacao), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-500/10 shadow-inner">
                        <LayoutGrid size={18} />
                      </div>
                      <span className="text-sm font-black text-slate-900 uppercase">{req.item_nome}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-indigo-600 leading-none">{req.quantidade}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 mt-1">{req.unidade_medida}</span>
                    </div>
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
                    <p className="text-[10px] font-bold text-slate-500 italic max-w-[200px] ml-auto truncate">{req.observacao || "Sem obs."}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AdaptiveModal isOpen={modalNovo} onClose={() => setModalNovo(false)} title="Nova Requisição de Material">
        <div className="p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
          
          <div className="space-y-6">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
               <Package size={14} className="text-indigo-600" /> Item Solicitado
            </label>
            
            <div className="relative">
              <input 
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm" 
                placeholder="BUSCAR OU DIGITAR NOVO MATERIAL..." 
                value={buscaMaterial}
                onChange={(e) => {
                  searchMateriais(e.target.value);
                  setFormData({...formData, item_nome: e.target.value, is_new_product: true, item_id: ""});
                }}
              />
              
              {materiaisSugeridos.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-[var(--border)] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
                  <div className="p-3 bg-slate-50 border-b border-[var(--border)] text-[9px] font-black uppercase text-slate-400">Materiais Disponíveis no Almoxarifado:</div>
                  {materiaisSugeridos.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => { 
                        setFormData({...formData, item_id: m.id, item_nome: m.item, unidade_medida: m.unidade_medida, is_new_product: false}); 
                        setBuscaMaterial(m.item); 
                        setMateriaisSugeridos([]); 
                      }} 
                      className="w-full p-5 text-left hover:bg-indigo-50 border-b border-[var(--border)] last:border-none transition-colors"
                    >
                      <p className="text-xs font-black uppercase text-indigo-900">{m.item}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{m.unidade_medida} • Categoria: ESCRITÓRIO</p>
                    </button>
                  ))}
                </div>
              )}

              {formData.is_new_product && buscaMaterial.length > 2 && materiaisSugeridos.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4">
                  <PlusCircle size={24} className="text-amber-600" />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase tracking-tight">Novo Produto Detectado</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase italic">Este item será cadastrado automaticamente na categoria de Materiais de Escritório.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <Filter size={14} className="text-indigo-600" /> Unidade de Medida
              </label>
              <select 
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm appearance-none"
                value={formData.unidade_medida}
                onChange={e => setFormData({...formData, unidade_medida: e.target.value})}
              >
                <option value="UN">UNIDADE (UN)</option>
                <option value="CX">CAIXA (CX)</option>
                <option value="PCT">PACOTE (PCT)</option>
                <option value="RL">ROLO (RL)</option>
                <option value="FL">FOLHA (FL)</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                 <PlusCircle size={14} className="text-indigo-600" /> Quantidade
              </label>
              <input 
                type="number" 
                min="1"
                className="input-field !h-16 font-black !rounded-2xl border-2 focus:border-indigo-500 shadow-sm text-center text-xl" 
                value={formData.quantidade} 
                onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
               <FileText size={14} className="text-indigo-600" /> Justificativa / Observação
            </label>
            <textarea 
              className="input-field !h-32 p-6 font-bold !rounded-2xl border-2 focus:border-indigo-500 shadow-sm resize-none" 
              placeholder="Descreva a necessidade deste material..."
              value={formData.observacao}
              onChange={e => setFormData({...formData, observacao: e.target.value})}
            />
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSalvarReq} 
              disabled={loadingAcao}
              className="w-full h-20 bg-indigo-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
            >
              {loadingAcao ? (
                <> <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white"></div> ENVIANDO... </>
              ) : (
                <> <Save size={24} /> ENVIAR REQUISIÇÃO </>
              )}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}

const Loader = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
