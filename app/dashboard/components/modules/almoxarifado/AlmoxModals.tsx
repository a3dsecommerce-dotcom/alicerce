"use client";
import { UserCheck, Plus, Save, Trash2, Truck, AlertTriangle, CheckCircle2, Printer } from "lucide-react";
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
  cotasMap: Record<string, number>;
  onProcessarReq: (id: string, status: 'APROVADO' | 'REPROVADO', qtd?: number) => void;
  entregaConfirm: any;
  setEntregaConfirm: (v: any) => void;
  entregaParcialQtd: number;
  setEntregaParcialQtd: (v: number) => void;
  onConfirmarEntregaTotal: () => void;
  onConfirmarEntregaParcial: () => void;
  onConfirmarEntregaParcialExternal: (it: any, qtd: number, status: string) => Promise<void>;
  ocorrenciaData: any;
  setOcorrenciaData: (v: any) => void;
  onSalvarOcorrencia: () => void;
  resolucaoData: any;
  setResolucaoData: (v: any) => void;
  onFinalizarResolucao: () => void;
  onFinalizarRequisicaoInternal: () => void;
  onEstornarEntrega?: (id: string) => Promise<void>;
  loading: boolean;
}

export default function AlmoxModals({
  modalAberto, setModalAberto,
  formData, setFormData, onSalvarItem, onExcluirItem,
  entregaData, setEntregaData, buscaFuncionario, setBuscaFuncionario, usuarios, estoque, onConfirmarEntregaEPI,
  reqEditando, setReqEditando, cotasMap, onProcessarReq,
  entregaConfirm, setEntregaConfirm, entregaParcialQtd, setEntregaParcialQtd, onConfirmarEntregaTotal, onConfirmarEntregaParcial, onConfirmarEntregaParcialExternal,
  ocorrenciaData, setOcorrenciaData, onSalvarOcorrencia,
  resolucaoData, setResolucaoData, onFinalizarResolucao,
  onFinalizarRequisicaoInternal,
  onEstornarEntrega,
  loading
}: AlmoxModalsProps) {
  
  const colaboradorInfo = usuarios.find(u => u.nome === entregaData.colaborador);

  const handleImprimir = () => {
    const printContent = document.getElementById('print-recibo-content');
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <he${""}ad>
          <title>Ficha de EPI - ${entregaData.colaborador}</title>
          <style>
            @page { size: landscape; margin: 0.5cm; }
            body { 
              font-family: 'Inter', system-ui, -apple-system, sans-serif; 
              margin: 0; 
              padding: 10px; 
              color: black; 
              overflow: hidden;
            }
            .ficha-container { 
              width: 277mm;
              height: 190mm;
              border: 2px solid black; 
              padding: 25px; 
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
            }
            .header { border: 4px solid black; padding: 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .header-left h2 { margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; font-style: italic; }
            .header-right { text-align: right; border-left: 2px solid black; padding-left: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 2px solid black; margin-bottom: 15px; background: #f9f9f9; }
            .info-item { padding: 10px; border-right: 2px solid black; }
            .info-item:last-child { border-right: none; }
            .info-label { font-size: 7px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 3px; }
            .info-value { font-size: 11px; font-weight: 900; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 15px; }
            th { background: black; color: white; padding: 10px; font-size: 8px; text-transform: uppercase; letter-spacing: 1px; text-align: left; }
            td { padding: 8px; border: 1px solid black; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .termo { border: 2px solid black; padding: 15px; background: #f9f9f9; margin-bottom: 20px; }
            .termo h4 { margin: 0 0 8px 0; font-size: 9px; text-transform: uppercase; text-decoration: underline; }
            .termo p { margin: 0; font-size: 8px; line-height: 1.4; text-align: justify; font-weight: bold; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: auto; padding-bottom: 20px; }
            .sig-box { text-align: center; }
            .sig-line { border-bottom: 2px solid black; margin-bottom: 5px; height: 50px; }
            .sig-label { font-size: 9px; font-weight: 900; text-transform: uppercase; }
            .footer { border-top: 1px solid #eee; padding-top: 8px; display: flex; justify-content: space-between; font-size: 7px; color: #999; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="ficha-container">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

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
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                    Cota Máxima por Requisição <span className="text-orange-500 font-black">★</span>
                  </label>
                  <input
                    type="number"
                    className="input-field w-full font-black text-orange-600"
                    value={formData.quantidade_maxima ?? 0}
                    min={0}
                    onChange={e => setFormData({...formData, quantidade_maxima: Number(e.target.value)})}
                    placeholder="0 = sem limite configurado"
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-wide">
                    Limite máximo que uma unidade pode solicitar por pedido mensal. Deixe 0 para não restringir.
                  </p>
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
                              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mt-0.5">CA: {epi.ca || '---'} • Tam: {epi.tamanho || 'UN'} • <span className={epi.quantidade > 0 ? "text-green-600" : "text-red-600"}>Estoque: {epi.quantidade}</span></p>
                           </div>
                           <div className="flex items-center gap-3">
                              {selecionado ? (
                                 <>
                                    <input 
                                       type="number" 
                                       className="w-16 h-10 rounded-lg border-2 border-orange-500 text-center text-xs font-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                       value={selecionado.qtd_entrega} 
                                       max={epi.quantidade} 
                                       min={1} 
                                       onChange={e => {
                                          const val = Math.min(Number(e.target.value), epi.quantidade);
                                          const newItens = entregaData.itens.map((x: any) => x.id === epi.id ? {...x, qtd_entrega: val} : x);
                                          setEntregaData({...entregaData, itens: newItens});
                                       }} 
                                    />
                                    <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((x: any) => x.id !== epi.id)})} className="p-2 text-red-500"><Trash2 size={16}/></button>
                                 </>
                              ) : (
                                 <button onClick={() => setEntregaData({...entregaData, itens: [...entregaData.itens, {...epi, qtd_entrega: 1}]})} disabled={epi.quantidade <= 0} className="p-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-orange-600 hover:text-white transition-all disabled:opacity-30"><Plus size={16}/></button>
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

      {/* MODAL RECIBO DE ENTREGA (VISUALIZAÇÃO NO DASHBOARD - IDÊNTICA À ORIGINAL) */}
      <AdaptiveModal isOpen={modalAberto === "recibo"} onClose={() => setModalAberto(null)} title="Ficha de Entrega de EPI (NR-06)" width="1200px">
         <div className="p-10 space-y-8 bg-slate-100 min-h-screen overflow-y-auto">
            <div className="bg-white p-12 shadow-2xl rounded-sm w-full max-w-[1100px] border border-slate-300 mx-auto" id="print-recibo-content">
               
               {/* CABEÇALHO SST */}
               <div className="border-[4px] border-black p-4 mb-8 flex justify-between items-center" style={{borderColor: 'black'}}>
                  <div className="space-y-1">
                     <h2 className="text-2xl font-black uppercase tracking-tighter italic" style={{margin: 0, fontSize: '24px', fontWeight: '900', fontStyle: 'italic'}}>Alicerce ERP</h2>
                     <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500" style={{fontSize: '9px', fontWeight: 'bold', color: '#666', marginTop: '5px'}}>Sistema de Gestão Logística e Segurança</p>
                  </div>
                  <div className="text-right border-l-2 border-black pl-8" style={{borderLeft: '2px solid black', paddingLeft: '30px', textAlign: 'right'}}>
                     <h3 className="text-xl font-black uppercase tracking-tight" style={{fontSize: '20px', fontWeight: '900', margin: 0}}>Ficha de Entrega de EPI</h3>
                     <p className="text-[10px] font-black uppercase text-slate-600" style={{fontSize: '10px', fontWeight: '900', color: '#666', marginTop: '5px'}}>Equipamento de Proteção Individual - NR-06</p>
                  </div>
               </div>

               {/* DADOS DO COLABORADOR */}
               <div className="grid grid-cols-3 gap-0 border-x-2 border-t-2 border-black mb-8 bg-slate-50/50" style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: '2px solid black', marginBottom: '30px', background: '#f9f9f9'}}>
                  <div className="p-4 border-r-2 border-black" style={{padding: '15px', borderRight: '2px solid black'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Nome do Colaborador / Funcionário</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{entregaData.colaborador}</p>
                  </div>
                  <div className="p-4 border-r-2 border-black" style={{padding: '15px', borderRight: '2px solid black'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Função / Cargo</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{colaboradorInfo?.cargo || 'Não Informado'}</p>
                  </div>
                  <div className="p-4" style={{padding: '15px'}}>
                     <label className="text-[8px] font-black uppercase text-slate-500 block mb-1" style={{fontSize: '8px', fontWeight: '900', color: '#666', marginBottom: '5px'}}>Data da Entrega</label>
                     <p className="text-xs font-black uppercase" style={{fontSize: '12px', fontWeight: '900'}}>{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>

               {/* TABELA DE ITENS */}
               <div className="border-2 border-black rounded-none mb-8 overflow-hidden" style={{border: '2px solid black', marginBottom: '30px'}}>
                  <table className="w-full text-left border-collapse" style={{width: '100%', borderCollapse: 'collapse'}}>
                     <thead>
                        <tr className="bg-black text-white text-[9px] font-black uppercase tracking-widest" style={{background: 'black', color: 'white'}}>
                           <th className="p-3 border-r border-white/20 w-[45%]" style={{padding: '12px', fontSize: '9px', fontWeight: '900', textAlign: 'left'}}>Descrição do Item (EPI/EPC)</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>C.A.</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>Tam</th>
                           <th className="p-3 text-center border-r border-white/20" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>U.M.</th>
                           <th className="p-3 text-center" style={{padding: '12px', textAlign: 'center', fontSize: '9px', fontWeight: '900'}}>Qtd</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-black">
                        {entregaData.itens.map((item: any) => (
                           <tr key={item.id} className="text-[10px] font-bold uppercase" style={{fontSize: '10px', fontWeight: 'bold'}}>
                              <td className="p-3 border-r border-black" style={{padding: '12px', border: '1px solid black'}}>{item.item}</td>
                              <td className="p-3 text-center border-r border-black font-black text-blue-800" style={{padding: '12px', textAlign: 'center', border: '1px solid black', fontWeight: '900', color: '#1e40af'}}>{item.ca || 'N/A'}</td>
                              <td className="p-3 text-center border-r border-black" style={{padding: '12px', textAlign: 'center', border: '1px solid black'}}>{item.tamanho || 'UN'}</td>
                              <td className="p-3 text-center border-r border-black" style={{padding: '12px', textAlign: 'center', border: '1px solid black'}}>{item.unidade_medida || 'UN'}</td>
                              <td className="p-3 text-center font-black bg-slate-50 text-sm" style={{padding: '12px', textAlign: 'center', border: '1px solid black', fontSize: '14px', background: '#f9f9f9', fontWeight: '900'}}>{item.qtd_entrega}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               {/* TERMO DE RESPONSABILIDADE */}
               <div className="border-2 border-black p-6 bg-slate-50 mb-10" style={{border: '2px solid black', padding: '20px', background: '#f9f9f9', marginBottom: '40px'}}>
                  <h4 className="text-[10px] font-black uppercase mb-4 underline decoration-2" style={{margin: '0 0 10px 0', fontSize: '10px', fontWeight: '900', textDecoration: 'underline'}}>Termo de Responsabilidade e Ciência (NR-06 / CLT)</h4>
                  <p className="text-[9px] font-bold text-justify leading-relaxed uppercase" style={{margin: 0, fontSize: '9px', lineHeight: '1.6', textAlign: 'justify', fontWeight: 'bold'}}>
                     Declaro ter recebido os equipamentos de proteção individual (EPIs) constantes desta ficha, os quais são de uso obrigatório nas minhas atividades, estando em perfeito estado de conservação e uso. Comprometo-me a utilizá-los apenas para a finalidade a que se destinam, responsabilizando-me pela sua guarda e conservação, observando as normas de segurança da empresa e as diretrizes da NR-06. Estou ciente de que o não uso dos mesmos constitui falta grave, passível de punições disciplinares conforme a CLT, bem como autorizo o desconto em folha de pagamento em caso de extravio ou dano por uso inadequado, conforme Artigo 462 da CLT.
                  </p>
               </div>

               {/* ASSINATURAS */}
               <div className="grid grid-cols-2 gap-20 pt-10" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', marginTop: '60px'}}>
                  <div className="flex flex-col items-center" style={{textAlign: 'center'}}>
                     <div className="w-full border-b-2 border-black mb-2" style={{borderBottom: '2px solid black', marginBottom: '10px', height: '60px'}}></div>
                     <p className="text-[9px] font-black uppercase" style={{fontSize: '10px', fontWeight: '900'}}>Assinatura do Colaborador</p>
                     <p className="text-[7px] text-slate-500 mt-1 uppercase" style={{fontSize: '7px', color: '#999', marginTop: '5px'}}>Ciente em: {new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-col items-center" style={{textAlign: 'center'}}>
                     <div className="w-full border-b-2 border-black mb-2" style={{borderBottom: '2px solid black', marginBottom: '10px', height: '60px'}}></div>
                     <p className="text-[9px] font-black uppercase" style={{fontSize: '10px', fontWeight: '900'}}>Responsável pela Entrega</p>
                     <p className="text-[7px] text-slate-500 mt-1 uppercase" style={{fontSize: '7px', color: '#999', marginTop: '5px'}}>Almoxarifado Central / SST</p>
                  </div>
               </div>

               {/* RODAPÉ TÉCNICO */}
               <div className="mt-12 pt-4 border-t border-slate-200 flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase" style={{marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: '#999', fontWeight: 'bold'}}>
                  <span>Documento gerado eletronicamente pelo Alicerce ERP</span>
                  <span>NR-06 • CLT Art. 158 • Portaria 3.214/78</span>
                  <span>Página 01 / 01</span>
               </div>
            </div>

            <div className="flex gap-4 pt-6 max-w-[1100px] mx-auto w-full">
               <button onClick={handleImprimir} className="flex-1 h-16 bg-black text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-105 transition-all shadow-2xl">
                  <Printer size={24} /> Imprimir em Nova Janela
               </button>
               <button onClick={() => setModalAberto(null)} className="h-16 px-10 bg-white text-slate-600 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Fechar
               </button>
            </div>
         </div>
      </AdaptiveModal>

      {/* MODAL ANÁLISE REQUISIÇÃO (AGRUPADO) */}
      <AdaptiveModal isOpen={modalAberto === "editar_req"} onClose={() => setModalAberto(null)} title="Análise Técnica de Protocolo" width="1100px">
         {reqEditando && (
           <div className="p-10 space-y-8">
              {/* Header do protocolo */}
              <div className="bg-[var(--bg-base)] p-8 rounded-[2.5rem] border border-[var(--border)] flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <p className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 tracking-[0.2em]">Protocolo sob Análise</p>
                    <h4 className="text-2xl font-black text-[var(--text-primary)] italic">{reqEditando.protocolo}</h4>
                    <p className="text-[10px] font-bold text-orange-600 uppercase mt-1">{reqEditando.solicitante} • {reqEditando.unidade_destino}</p>
                 </div>
                 <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        if(confirm("Deseja APROVAR todos os itens deste protocolo com as quantidades totais solicitadas (cota + extra)?")) {
                          reqEditando.itens.forEach((it:any) => {
                            const totalSolicitado = (it.quantidade || 0) + (it.quantidade_extra || 0);
                            onProcessarReq(it.id, 'APROVADO', totalSolicitado);
                          });
                          setModalAberto(null);
                        }
                      }}
                      className="h-12 px-6 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                    >Aprovar Todos</button>
                    <button
                      onClick={() => {
                        if(confirm("Deseja REPROVAR todos os itens deste protocolo?")) {
                          reqEditando.itens.forEach((it:any) => onProcessarReq(it.id, 'REPROVADO'));
                          setModalAberto(null);
                        }
                      }}
                      className="h-12 px-6 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >Reprovar Todos</button>
                 </div>
              </div>

              {/* Legenda de cores */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Legenda:</span>
                {[
                  { color: 'bg-green-500', label: '100% Aprovado Automaticamente (Cota)' },
                  { color: 'bg-amber-500', label: 'Possui Quantidades em Análise (Extra/Excedente)' },
                  { color: 'bg-blue-300',  label: 'Análise Manual (Emergencial / Sem Cota)' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                    <span className="text-[9px] font-black uppercase text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Lista de itens */}
              <div className="space-y-4 max-h-[540px] overflow-auto pr-2 scrollbar-thin">
                {reqEditando.itens.map((it:any) => {
                  // Cruzamento com o catálogo de suprimentos para obter coeficiente
                  const estoqueItem = estoque.find((e:any) =>
                    String(e.id) === String(it.item_id) ||
                    e.item?.toLowerCase().trim() === it.item_nome?.toLowerCase().trim()
                  );
                  const estoqueAtual = estoqueItem?.quantidade ?? 0;
                  const coeficiente  = estoqueItem?.coeficiente ?? 0;
                  
                  const solicitado   = it.quantidade || 0;
                  const extra        = it.quantidade_extra || 0;
                  const totalSolicitado = solicitado + extra;
                  const isEPI        = it.tipo_item === 'EPI';

                  const secretaria   = reqEditando.secretaria_destino || '';
                  const qtdAsg       = cotasMap[secretaria] ?? 0;
                  const cotaCalculada = (!isEPI && coeficiente > 0 && qtdAsg > 0)
                    ? Math.floor(qtdAsg * coeficiente)
                    : 0;
                  const temCota      = cotaCalculada > 0;
                  const tipoPedido   = reqEditando.tipo_pedido || 'MENSAL';

                  // Lógica de aprovação automática e análise manual
                  const isMensalComCota = tipoPedido === 'MENSAL' && temCota;
                  const cotaAutomatica = isMensalComCota ? Math.min(solicitado, cotaCalculada) : 0;
                  const quantidadeEmAnalise = isMensalComCota
                    ? Math.max(0, solicitado - cotaCalculada) + extra
                    : totalSolicitado;

                  let cardColor = 'border-slate-200 bg-white';
                  if (isMensalComCota) {
                    if (quantidadeEmAnalise > 0) {
                      cardColor = 'border-amber-300 bg-amber-50/20'; // Possui extra em análise
                    } else {
                      cardColor = 'border-green-200 bg-green-50/20'; // 100% automático
                    }
                  } else {
                    cardColor = 'border-blue-200 bg-blue-50/10'; // Emergencial ou Sem cota
                  }

                  return (
                    <div key={it.id} className={`p-6 rounded-2xl border-2 transition-all ${cardColor}`}>
                      {/* Nome + métricas + ações */}
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        {/* Nome e categoria */}
                        <div className="flex-1 min-w-[180px]">
                          <h5 className="text-xs font-black text-slate-800 uppercase">{it.item_nome}</h5>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">
                            {it.tipo_item} • {it.unidade_medida || 'UN'}
                          </p>
                        </div>

                        {/* Cards de métricas simplificados */}
                        <div className="flex items-stretch gap-2 flex-wrap">
                          {/* Total Solicitado */}
                          <div className="flex flex-col items-center justify-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 min-w-[75px]">
                            <span className="text-[7px] font-black uppercase text-slate-400 mb-1">Total Pedido</span>
                            <span className="text-xl font-black text-slate-800">{totalSolicitado}</span>
                          </div>

                          {/* Cota Limite — apenas se houver cota */}
                          {!isEPI && temCota && (
                            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-[75px]">
                              <span className="text-[7px] font-black uppercase text-slate-400 mb-1">Cota Limite</span>
                              <span className="text-xl font-black text-slate-500">{cotaCalculada}</span>
                            </div>
                          )}

                          {/* Aprovado Auto (Pré-Aprovado) — apenas se houver cota aprovada automaticamente */}
                          {isMensalComCota && cotaAutomatica > 0 && (
                            <div className="flex flex-col items-center justify-center bg-green-50 border border-green-200 rounded-xl px-4 py-3 min-w-[75px]">
                              <span className="text-[7px] font-black uppercase text-green-600 mb-1">Aprov. Auto (Cota)</span>
                              <span className="text-xl font-black text-green-700">{cotaAutomatica}</span>
                            </div>
                          )}

                          {/* A Mais / Em Análise — apenas se houver excedente/extra em análise */}
                          {quantidadeEmAnalise > 0 && (
                            <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 min-w-[75px]">
                              <span className="text-[7px] font-black uppercase text-amber-600 mb-1">A Mais (Em Análise)</span>
                              <span className="text-xl font-black text-amber-700">{quantidadeEmAnalise}</span>
                            </div>
                          )}

                          {/* Estoque Central — ocultado para suprimentos */}
                          {it.tipo_item !== 'SUPRIMENTO' && (
                            <div className="flex flex-col items-center justify-center bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 min-w-[75px]">
                              <span className="text-[7px] font-black uppercase text-slate-400 mb-1">Estoque Central</span>
                              <span className="text-xl font-black text-blue-600">{estoqueAtual}</span>
                            </div>
                          )}

                          {/* Campo de aprovação */}
                          {isMensalComCota ? (
                            quantidadeEmAnalise > 0 ? (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <label className="text-[7px] font-black uppercase text-slate-400">Aprovar Extra</label>
                                <input
                                  type="number"
                                  className="w-20 h-12 border-2 rounded-xl text-center text-sm font-black focus:border-blue-500 transition-all bg-white border-slate-200"
                                  defaultValue={0}
                                  id={`qtd-apr-extra-${it.id}`}
                                  min={0}
                                  max={quantidadeEmAnalise}
                                />
                              </div>
                            ) : null
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <label className="text-[7px] font-black uppercase text-slate-400">Aprovar Total</label>
                              <input
                                type="number"
                                className="w-20 h-12 border-2 rounded-xl text-center text-sm font-black focus:border-blue-500 transition-all bg-white border-slate-200"
                                defaultValue={totalSolicitado}
                                id={`qtd-apr-total-${it.id}`}
                                min={0}
                                max={totalSolicitado}
                              />
                            </div>
                          )}

                          {/* Botões Aprovar / Reprovar */}
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => {
                                if (isMensalComCota) {
                                  if (quantidadeEmAnalise > 0) {
                                    const valExtra = (document.getElementById(`qtd-apr-extra-${it.id}`) as HTMLInputElement).value;
                                    const totalAprovado = cotaAutomatica + Number(valExtra);
                                    onProcessarReq(it.id, 'APROVADO', totalAprovado);
                                  } else {
                                    onProcessarReq(it.id, 'APROVADO', cotaAutomatica);
                                  }
                                } else {
                                  const valTotal = (document.getElementById(`qtd-apr-total-${it.id}`) as HTMLInputElement).value;
                                  onProcessarReq(it.id, 'APROVADO', Number(valTotal));
                                }
                              }}
                              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Aprovar item"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => onProcessarReq(it.id, 'REPROVADO')}
                              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                              title="Reprovar item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Alertas contextuais */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {isMensalComCota && cotaAutomatica > 0 && (
                          <div className="flex items-center gap-1.5 bg-green-100/60 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                            <CheckCircle2 size={11} />
                            <span className="text-[9px] font-black uppercase">
                              ✓ {cotaAutomatica} {it.unidade_medida || 'UN'} aprovados automaticamente (Dentro da cota de {cotaCalculada})
                            </span>
                          </div>
                        )}
                        {isMensalComCota && quantidadeEmAnalise > 0 && (
                          <div className="flex items-center gap-1.5 bg-amber-100/60 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">
                            <AlertTriangle size={11} />
                            <span className="text-[9px] font-black uppercase">
                              {quantidadeEmAnalise} {it.unidade_medida || 'UN'} em análise (Excedente da cota: {Math.max(0, solicitado - cotaCalculada)} + Extra: {extra})
                            </span>
                          </div>
                        )}
                        {isMensalComCota && quantidadeEmAnalise === 0 && (
                          <div className="flex items-center gap-1.5 bg-green-100/60 text-green-700 px-3 py-1.5 rounded-lg border border-green-200">
                            <CheckCircle2 size={11} />
                            <span className="text-[9px] font-black uppercase">
                              ✓ Item 100% aprovado dentro da cota
                            </span>
                          </div>
                        )}
                        {!isMensalComCota && (
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
                            <AlertTriangle size={11} />
                            <span className="text-[9px] font-black uppercase">
                              {tipoPedido === 'EMERGENCIAL' ? 'Pedido Emergencial' : 'Item sem cota calculada'} — Requer análise manual do total ({totalSolicitado} {it.unidade_medida || 'UN'})
                            </span>
                          </div>
                        )}
                        {it.tipo_item !== 'SUPRIMENTO' && estoqueAtual < totalSolicitado && (
                          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span className="text-[9px] font-black uppercase">
                              Estoque central insuficiente ({estoqueAtual} disp.) — Compra sob demanda (Não bloqueia a aprovação)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL GESTÃO DE ENTREGA (AGRUPADO) */}
      <AdaptiveModal isOpen={modalAberto === "confirmar_entrega"} onClose={() => setModalAberto(null)} title="Gestão de Logística por Protocolo" width="1000px">
         {reqEditando && (
           <div className="p-10 space-y-10">
              <div className="flex items-center justify-between p-8 bg-[var(--bg-base)] rounded-[2.5rem] border border-[var(--border)]">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-100">
                       <Truck size={32} />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black italic text-[var(--text-primary)]">{reqEditando.protocolo}</h4>
                       <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                          {reqEditando.solicitante} • Destino: {reqEditando.unidade_destino}
                       </p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase text-[var(--text-muted)] block tracking-widest text-right">Recebedor Oficial</label>
                    <input 
                      className="input-field !h-12 !w-64 font-black text-right" 
                      value={entregaConfirm.recebedor} 
                      onChange={e => setEntregaConfirm({recebedor: e.target.value})} 
                      placeholder="Nome do Recebedor..." 
                    />
                 </div>
              </div>

              <div className="space-y-4 max-h-[450px] overflow-auto pr-2 scrollbar-thin">
                 {reqEditando.itens.filter((it:any) => it.status !== 'ENTREGUE').map((it:any) => (
                    <div key={it.id} className="p-6 bg-white rounded-2xl border border-[var(--border)] flex justify-between items-center hover:border-green-200 transition-all">
                       <div className="flex-1">
                          <h5 className="text-xs font-black text-slate-800 uppercase">{it.item_nome}</h5>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            Aprovado: {it.quantidade_aprovada || it.quantidade} {it.unidade_medida} • 
                            Entregue: <span className="text-green-600">{it.quantidade_entregue || 0}</span>
                          </p>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                             <label className="text-[8px] font-black text-slate-400 uppercase mb-1">Dar Baixa</label>
                             <input 
                               type="number" 
                               className="w-20 h-10 bg-slate-50 border-2 border-slate-100 rounded-lg text-center text-xs font-black focus:border-green-500 transition-all"
                               defaultValue={(it.quantidade_aprovada || it.quantidade) - (it.quantidade_entregue || 0)}
                               id={`qtd-ent-${it.id}`}
                               max={(it.quantidade_aprovada || it.quantidade) - (it.quantidade_entregue || 0)}
                               min={1}
                             />
                          </div>
                          <button 
                            onClick={async () => {
                              if (!entregaConfirm.recebedor) return alert("Informe o recebedor!");
                              const val = Number((document.getElementById(`qtd-ent-${it.id}`) as HTMLInputElement).value);
                              const totalAprovado = it.quantidade_aprovada || it.quantidade;
                              const novaQtdTotal = (it.quantidade_entregue || 0) + val;
                              const statusFinal = novaQtdTotal >= totalAprovado ? 'ENTREGUE' : 'PARCIAL';

                              await onConfirmarEntregaParcialExternal(it, val, statusFinal);
                            }}
                            className="h-10 px-6 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 size={14} /> Confirmar
                          </button>
                       </div>
                    </div>
                 ))}
                 {/* Itens já Entregues */}
                 {reqEditando.itens.filter((it:any) => it.status === 'ENTREGUE').length > 0 && (
                    <div className="mt-8 border-t border-[var(--border)] pt-8">
                       <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itens já Entregues</h5>
                       <div className="space-y-4">
                         {reqEditando.itens.filter((it:any) => it.status === 'ENTREGUE').map((it:any) => (
                           <div key={it.id} className="p-6 bg-slate-50/50 rounded-2xl border border-[var(--border)] flex justify-between items-center opacity-80 hover:opacity-100 transition-all">
                              <div className="flex-1">
                                 <h5 className="text-xs font-black text-slate-600 uppercase">{it.item_nome}</h5>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                   Entregue: <span className="text-green-600">{it.quantidade_entregue}</span> {it.unidade_medida || 'UN'} • Recebedor: {it.recebedor_nome || 'Auto'}
                                 </p>
                              </div>
                              <div className="flex items-center gap-4">
                                {onEstornarEntrega && (
                                   <button 
                                     onClick={() => onEstornarEntrega(it.id)}
                                     className="h-10 px-4 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                     title="Desfazer Entrega e Devolver ao Estoque"
                                   >
                                     Estornar
                                   </button>
                                )}
                              </div>
                           </div>
                         ))}
                       </div>
                    </div>
                 )}

                 {reqEditando.itens.filter((it:any) => it.status === 'ENTREGUE').length === reqEditando.itens.length && (
                    <div className="p-10 text-center flex flex-col items-center gap-4 mt-4">
                       <CheckCircle2 size={48} className="text-green-500" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Todos os itens deste protocolo foram entregues.</p>
                    </div>
                 )}
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
                     <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Setor Destino / Responsável</label>
                     <select className="input-field !h-14 font-black" value={ocorrenciaData.setor_destino} onChange={e => setOcorrenciaData({...ocorrenciaData, setor_destino: e.target.value})}>
                        <option value="Gerência Operacional">Gerência Operacional</option>
                        <option value="RH Recursos Humanos">RH Recursos Humanos</option>
                        <option value="Almoxarifado">Almoxarifado</option>
                        <option value="Encarregado">Encarregado</option>
                        <option value="Técnico Segurança">Técnico Segurança</option>
                        <option value="Gerência Regional">Gerência Regional</option>
                     </select>
                  </div>
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
