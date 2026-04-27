"use client";
import { useState, useEffect } from "react";
import { 
  Package, Search, Plus, Filter, Truck, ClipboardList, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, FileText, Send
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoModule({ reducao, setReducao }: { reducao: number, setReducao: (v: number) => void }) {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"ESTOQUE" | "ANALISE" | "NOTAS">("ESTOQUE");
  const [modalAjuste, setModalAjuste] = useState<any>(null);
  const [modalNota, setModalNota] = useState<any>(null);
  const [nfNumero, setNfNumero] = useState("");
  const [chegouQuantidade, setChegouQuantidade] = useState(0);

  useEffect(() => {
    fetchData();
  }, [aba]);

  async function fetchData() {
    setLoading(true);
    const { data: estoqueData } = await supabase.from('estoque_atual').select('*').order('item');
    if (estoqueData) setEstoque(estoqueData);
    
    // Simulação de requisições pendentes
    const { data: reqData } = await supabase.from('compras_processos').select('*').order('created_at', { ascending: false });
    if (reqData) setRequisicoes(reqData);
    
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      
      {/* 1. HEADER E FILTRO DE ECONOMIA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Gestão de Almoxarifado Central</h2>
          <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Sincronização de Pedidos e Lançamento de Notas</p>
        </div>

        <div className="flex items-center gap-6 bg-[var(--bg-base)] p-4 rounded-2xl border border-[var(--border)] shadow-inner">
           <div className="flex items-center gap-3">
              <TrendingDown size={18} className="text-orange-500" />
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase">Redução Estratégica (Cota)</p>
                <input 
                  type="range" min="0" max="50" value={reducao} 
                  onChange={(e) => setReducao(Number(e.target.value))}
                  className="w-40 accent-orange-500 h-1 bg-orange-200 rounded-full appearance-none cursor-pointer" 
                />
              </div>
           </div>
           <div className="text-center">
              <span className="text-2xl font-black text-orange-500">{reducao}%</span>
           </div>
        </div>
      </div>

      {/* 2. SUB-NAVEGAÇÃO */}
      <div className="flex gap-3 p-1 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] w-fit shadow-sm">
        {[
          { id: "ESTOQUE", label: "Inventário", icon: Package },
          { id: "ANALISE", label: "Análise de Pedidos", icon: ClipboardList },
          { id: "NOTAS", label: "Lançar Notas (Abate)", icon: FileText },
        ].map((t: any) => (
          <button 
            key={t.id}
            onClick={() => setAba(t.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aba === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* 3. CONTEÚDO DINÂMICO */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-sm flex flex-col flex-1">
          <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
               {aba === 'ESTOQUE' && 'Controle de Saldo Real'}
               {aba === 'ANALISE' && 'Fila de Aprovação de Requisições'}
               {aba === 'NOTAS' && 'Abate de Pedidos por Nota Fiscal'}
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input className="input-field !pl-10 !h-10 text-xs w-64" placeholder="Pesquisar..." />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
               <thead className="bg-[var(--bg-base)]/20 border-b border-[var(--border)]">
                  {aba === 'ESTOQUE' && (
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Material</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Saldo Atual</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Cota Ajustada</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Status</th>
                    </tr>
                  )}
                  {aba === 'ANALISE' && (
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Unidade Solicitante</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Descrição do Pedido</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Qtde Solicitada</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Ações de Gestão</th>
                    </tr>
                  )}
                  {aba === 'NOTAS' && (
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Protocolo</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)]">Unidade</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] text-center">Pedido / Chegou</th>
                      <th className="p-6 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Ação</th>
                    </tr>
                  )}
               </thead>
               <tbody className="divide-y divide-[var(--border)]">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center text-xs italic">Sincronizando banco de dados...</td></tr>
                  ) : aba === 'ESTOQUE' ? (
                    estoque.map(i => (
                      <tr key={i.id} className="hover:bg-[var(--bg-base)]/30 transition-colors">
                        <td className="p-6"><span className="text-xs font-black text-[var(--text-primary)]">{i.item}</span></td>
                        <td className="p-6 font-black text-xs">{i.quantidade} {i.unidade_medida}</td>
                        <td className="p-6 font-black text-xs text-orange-600">{Math.floor(i.quantidade * (1 - (reducao/100)))} {i.unidade_medida}</td>
                        <td className="p-6 text-right">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${i.quantidade <= i.estoque_minimo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              {i.quantidade <= i.estoque_minimo ? 'Crítico' : 'Normal'}
                           </span>
                        </td>
                      </tr>
                    ))
                  ) : aba === 'ANALISE' ? (
                    requisicoes.map(r => (
                      <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-colors">
                        <td className="p-6 text-xs font-black uppercase text-[var(--brand)]">Secretaria Exemplo</td>
                        <td className="p-6 text-xs font-bold text-[var(--text-secondary)]">{r.descricao_pedido}</td>
                        <td className="p-6 font-black text-xs text-blue-600">100 UN</td>
                        <td className="p-6 text-right flex gap-2 justify-end">
                           <button onClick={() => setModalAjuste(r)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Edit3 size={14} /></button>
                           <button className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><CheckCircle2 size={14} /></button>
                           <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><XCircle size={14} /></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    requisicoes.filter(r => i === 0).map((r, i) => (
                      <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-colors">
                         <td className="p-6 text-[11px] font-black">#{r.protocolo_compra || 'REQ-881'}</td>
                         <td className="p-6 text-xs font-bold">Secretaria Exemplo</td>
                         <td className="p-6 text-center">
                            <span className="text-xs font-black">100</span>
                            <span className="mx-2 text-[var(--text-muted)]">/</span>
                            <span className="text-xs font-black text-blue-600">65</span>
                         </td>
                         <td className="p-6 text-right">
                            <button onClick={() => setModalNota(r)} className="px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-2 ml-auto">
                               <Plus size={12} /> Lançar Chegada
                            </button>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
          </div>
      </div>

      {/* MODAIS DE GESTÃO */}
      <AdaptiveModal isOpen={!!modalAjuste} onClose={() => setModalAjuste(null)} title="Ajustar Requisição">
         <div className="p-6 space-y-6">
            <p className="text-xs font-bold text-[var(--text-muted)]">Unidade está pedindo 100 UN. Você deseja ajustar para:</p>
            <input type="number" className="input-field !h-14 text-xl font-black text-center" placeholder="Nova Quantidade" />
            <button className="btn-brand w-full !h-14 text-xs font-black uppercase">Confirmar Ajuste Operacional</button>
         </div>
      </AdaptiveModal>

      <AdaptiveModal isOpen={!!modalNota} onClose={() => setModalNota(null)} title="Lançar Nota Fiscal e Abate">
         <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-1 block">Número da NF</label>
                  <input type="text" className="input-field !h-12" placeholder="Ex: 000.123" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-1 block">Volume que Chegou</label>
                  <input type="number" className="input-field !h-12" placeholder="Qtd Recebida" />
               </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
               <p className="text-[10px] font-bold text-blue-800 leading-tight">Ao confirmar, o sistema abaterá este volume da requisição original até completar 100%.</p>
            </div>
            <button className="btn-brand w-full !h-14 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3">
               <Send size={16} /> Confirmar Recebimento e Abate
            </button>
         </div>
      </AdaptiveModal>

    </div>
  );
}
