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
  onFinalizarRequisicaoInternal: () => void;
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
  onFinalizarRequisicaoInternal,
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
        <head>
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
