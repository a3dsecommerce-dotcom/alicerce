"use client";
import { UserCheck, Plus, Save, Trash2, Truck, AlertTriangle, CheckCircle2 } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface AlmoxModalsProps {
  modalAberto: any;
  setModalAberto: (v: any) => void;
  formData: any;
  setFormData: (v: any) => void;
  onSalvarItem: () => void;
  onExcluirItem: () => void;
  entregaData: any;
  setEntregaData: (v: any) => void;
  buscaFuncionario: string;
  setBuscaFuncionario: (v: string) => void;
  usuarios: any[];
  estoque: any[];
  onConfirmarEntregaEPI: () => void;
  reqEditando: any;
  setReqEditando: (v: any) => void;
  onProcessarReq: (id: string, status: 'APROVADO' | 'REPROVADO', qtd?: number) => void;
  entregaConfirm: any;
  setEntregaConfirm: (v: any) => void;
  entregaParcialQtd: number;
  setEntregaParcialQtd: (v: number) => void;
  onConfirmarEntregaTotal: () => void;
  onConfirmarEntregaParcial: () => void;
  ocorrenciaData: any;
  setOcorrenciaData: (v: any) => void;
  onSalvarOcorrencia: () => void;
  resolucaoData: any;
  setResolucaoData: (v: any) => void;
  onFinalizarResolucao: () => void;
  loading: boolean;
}

export default function AlmoxModals({
  modalAberto, setModalAberto,
  formData, setFormData, onSalvarItem, onExcluirItem,
  entregaData, setEntregaData, buscaFuncionario, setBuscaFuncionario, usuarios, estoque, onConfirmarEntregaEPI,
  reqEditando, setReqEditando, onProcessarReq,
  entregaConfirm, setEntregaConfirm, entregaParcialQtd, setEntregaParcialQtd, onConfirmarEntregaTotal, onConfirmarEntregaParcial,
  ocorrenciaData, setOcorrenciaData, onSalvarOcorrencia,
  resolucaoData, setResolucaoData, onFinalizarResolucao,
  loading
}: AlmoxModalsProps) {
  return (
    <>
      {/* MODAL CADASTRO/EDIÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title={formData.id ? "Editar Material" : "Cadastrar Material"}>
         <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Categoria *</label>
                  <select className="input-field w-full font-black text-blue-600" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                     <option value="EPI">Equipamento de Proteção (EPI)</option>
                     <option value="SUPRIMENTO">Suprimentos (Limpeza, Copa, etc)</option>
                     <option value="ESCRITORIO">Materiais de Escritório</option>
                  </select>
               </div>
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição do Material *</label>
                  <input className="input-field w-full font-black" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} placeholder="Ex: Bota de Segurança Sete Léguas" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Código Reg.</label>
                  <input className="input-field w-full font-mono" value={formData.codigo_registro} onChange={e => setFormData({...formData, codigo_registro: e.target.value})} placeholder="Ex: EPI-001" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Unidade Medida</label>
                  <input className="input-field w-full" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})} placeholder="Ex: UN, PAR, RL" />
               </div>
               
               {formData.categoria === 'EPI' && (
                  <>
                     <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">C.A. (Certificado)</label>
                        <input className="input-field w-full font-black text-orange-600" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} placeholder="Ex: 42134" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tamanho</label>
                        <input className="input-field w-full" value={formData.tamanho} onChange={e => setFormData({...formData, tamanho: e.target.value})} placeholder="Ex: G, 42, 40" />
                     </div>
                  </>
               )}

               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Qtd. em Estoque</label>
                  <input type="number" className="input-field w-full font-black text-blue-600" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Estoque Mínimo</label>
                  <input type="number" className="input-field w-full font-black text-red-600" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} />
               </div>
            </div>

            <div className="flex gap-4 pt-6">
               <button onClick={onSalvarItem} disabled={loading} className="flex-1 h-14 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl">
                  <Save size={18} /> {formData.id ? "Salvar Alterações" : "Cadastrar Material"}
               </button>
               {formData.id && (
                  <button onClick={onExcluirItem} disabled={loading} className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all border border-red-100">
                     <Trash2 size={20} />
                  </button>
               )}
            </div>
         </div>
      </AdaptiveModal>

      {/* MODAL ENTREGA DIRETA EPI */}
      <AdaptiveModal isOpen={modalAberto === "entrega"} onClose={() => setModalAberto(null)} title="Entrega Direta de EPI (NR-06)">
         <div className="p-10 space-y-8">
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Selecionar Colaborador</label>
               <div className="relative">
                  <input className="input-field w-full font-black" placeholder="Digite o nome do funcionário..." value={buscaFuncionario} onChange={e => setBuscaFuncionario(e.target.value)} />
                  {buscaFuncionario && !entregaData.colaborador && (
                     <div className="absolute top-full left-0 w-full bg-white border border-[var(--border)] rounded-xl mt-2 shadow-2xl z-50 max-h-60 overflow-auto">
                        {usuarios.filter(u => u.nome.toLowerCase().includes(buscaFuncionario.toLowerCase())).map(u => (
                           <div key={u.id} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center" onClick={() => { setEntregaData({...entregaData, colaborador: u.nome}); setBuscaFuncionario(u.nome); }}>
                              <span className="text-xs font-black">{u.nome}</span>
                              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-1 rounded text-slate-500">{u.cargo}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Itens para Entrega</label>
               <div className="grid grid-cols-1 gap-3 max-h-80 overflow-auto pr-2">
                  {estoque.filter(i => i.categoria === 'EPI').map(epi => {
                     const selecionado = entregaData.itens.find((x: any) => x.id === epi.id);
                     return (
                        <div key={epi.id} className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${selecionado ? 'border-orange-500 bg-orange-50/20' : 'border-[var(--border)] bg-white'}`}>
                           <div>
                              <p className="text-xs font-black">{epi.item}</p>
                              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-0.5">CA: {epi.ca || '---'} • Tam: {epi.tamanho || 'UN'}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              {selecionado ? (
                                 <>
                                    <input type="number" className="w-16 h-10 rounded-lg border-2 border-orange-500 text-center text-xs font-black" value={selecionado.qtd_entrega} onChange={e => {
                                       const newItens = entregaData.itens.map((x: any) => x.id === epi.id ? {...x, qtd_entrega: Number(e.target.value)} : x);
                                       setEntregaData({...entregaData, itens: newItens});
                                    }} />
                                    <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((x: any) => x.id !== epi.id)})} className="p-2 text-red-500"><Trash2 size={16}/></button>
                                 </>
                              ) : (
                                 <button onClick={() => setEntregaData({...entregaData, itens: [...entregaData.itens, {...epi, qtd_entrega: 1}]})} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-orange-600 hover:text-white transition-all"><Plus size={16}/></button>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <button onClick={onConfirmarEntregaEPI} disabled={loading || !entregaData.colaborador || entregaData.itens.length === 0} className="w-full h-16 bg-orange-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-30">
               <UserCheck size={20} /> Gerar Recibo e Baixar Estoque
            </button>
         </div>
      </AdaptiveModal>

      {/* MODAL ANÁLISE REQUISIÇÃO */}
      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Análise Técnica de Requisição">
         {reqEditando && (
           <div className="p-10 space-y-8">
              <div className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)]">
                 <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2">Item Solicitado</p>
                 <h4 className="text-xl font-black text-[var(--text-primary)]">{reqEditando.item_nome || reqEditando.item}</h4>
                 <div className="flex gap-4 mt-4 text-[10px] font-bold uppercase tracking-widest text-orange-600">
                    <span>Solicitado: {reqEditando.quantidade} {reqEditando.unidade_medida}</span>
                    <span>|</span>
                    <span>Estoque Atual: {estoque.find(e => e.id === reqEditando.item_id)?.quantidade || 0}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Quantidade Real Aprovada</label>
                    <input type="number" className="input-field !h-16 text-2xl font-black text-center border-blue-200 text-blue-600" value={reqEditando.quantidade_aprovada} onChange={e => setReqEditando({...reqEditando, quantidade_aprovada: Number(e.target.value) })} />
                 </div>
                 <div className="flex flex-col gap-3 justify-center">
                    <button onClick={() => onProcessarReq(reqEditando.id, 'APROVADO', reqEditando.quantidade_aprovada)} className="h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Aprovar com Ajustes</button>
                    <button onClick={() => onProcessarReq(reqEditando.id, 'REPROVADO')} className="h-12 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Reprovar Totalmente</button>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL GESTÃO DE ENTREGA */}
      <AdaptiveModal isOpen={modalAberto === "confirmar_entrega"} onClose={() => setModalAberto(null)} title="Gestão de Entrega / Logística">
         {reqEditando && (
           <div className="p-10 space-y-10">
              <div className="flex items-center justify-between p-8 bg-[var(--bg-base)] rounded-[2.5rem] border border-[var(--border)]">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-600 shadow-sm">
                       <Truck size={32} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black uppercase text-[var(--text-primary)]">{reqEditando.item_nome || reqEditando.item}</h4>
                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                          {reqEditando.secretaria_destino ? `${reqEditando.secretaria_destino} • ` : ''}{reqEditando.unidade_destino} • Protocolo: {reqEditando.protocolo}
                       </p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Status Atual</p>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${reqEditando.status === 'APROVADO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                       {reqEditando.status}
                    </span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block tracking-widest">Responsável pelo Recebimento *</label>
                       <input className="input-field !h-14 font-black" value={entregaConfirm.recebedor} onChange={e => setEntregaConfirm({recebedor: e.target.value})} placeholder="Ex: João da Silva (Unidade X)" />
                    </div>
                 </div>

                 <div className="bg-orange-50/30 p-8 rounded-[2.5rem] border border-orange-100/50 flex flex-col justify-center gap-4">
                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest text-center mb-2">Opções de Movimentação</p>
                    <div className="grid grid-cols-1 gap-3">
                       <button onClick={onConfirmarEntregaTotal} className="h-14 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Confirmar Entrega Total</button>
                       <div className="flex gap-2">
                          <input type="number" className="w-1/3 input-field !h-14 text-center font-black" placeholder="Qtd" value={entregaParcialQtd || ''} onChange={e => setEntregaParcialQtd(Number(e.target.value))} />
                          <button onClick={onConfirmarEntregaParcial} className="flex-1 h-14 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Entrega Parcial</button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL OCORRENCIA */}
      <AdaptiveModal isOpen={modalAberto === "ocorrencia"} onClose={() => setModalAberto(null)} title="Registrar Falha / Ocorrência Administrativa">
         {reqEditando && (
           <div className="p-10 space-y-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                 <AlertTriangle className="text-red-600 shrink-0" size={24}/>
                 <p className="text-xs font-black text-red-900 uppercase">Gestão de SLA e Prazos</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Descrição da Demanda</label>
                    <textarea className="input-field !h-32 p-4 text-xs font-bold" value={ocorrenciaData.desc} onChange={e => setOcorrenciaData({...ocorrenciaData, desc: e.target.value})} placeholder="O que precisa ser resolvido?" />
                 </div>
                 <button onClick={onSalvarOcorrencia} className="col-span-2 h-14 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Abrir Ticket</button>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* RESOLVER OCORRENCIA */}
      <AdaptiveModal isOpen={modalAberto === "resolver_ocorrencia"} onClose={() => setModalAberto(null)} title="Finalizar Atendimento">
          <div className="p-10 space-y-8">
             <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-start gap-4">
                <CheckCircle2 className="text-green-600 shrink-0" size={24}/>
                <p className="text-xs font-black text-green-900 uppercase tracking-widest">Informar Resolução</p>
             </div>
             <div className="space-y-6">
                <textarea className="input-field !h-40 p-6 text-xs font-bold" placeholder="Descreva a ação tomada..." value={resolucaoData.solucao} onChange={e => setResolucaoData({...resolucaoData, solucao: e.target.value})} />
                <button onClick={onFinalizarResolucao} disabled={loading} className="w-full h-16 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Confirmar Resolução</button>
             </div>
          </div>
      </AdaptiveModal>
    </>
  );
}
