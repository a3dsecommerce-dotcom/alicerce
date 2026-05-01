"use client";
import { useState, useEffect } from "react";
import { 
  Search, Package, ShieldCheck, Plus, Filter, 
  TrendingDown, CheckCircle2, History, XCircle, Edit3, 
  FileText, Send, X, Ruler, ClipboardList, Info,
  UserCheck, AlertCircle, Save, Clock, AlertTriangle, MessageSquare,
  Truck, User, ShoppingBag, Printer
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AlmoxarifadoModule({ reducao, setReducao }: { reducao: number, setReducao: (v: number) => void }) {
  // --- Estados Principais ---
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [user, setUser] = useState<any>({});
  
  // --- Tabs ---
  type TabType = "ESTOQUE" | "REQUISICOES" | "FAZER_REQ" | "OCORRENCIAS";
  const [activeTab, setActiveTab] = useState<TabType>("ESTOQUE");
  
  // --- Estados de Nova Requisição ---
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volumesExtra, setVolumesExtra] = useState<Record<string, number>>({});

  // --- Modais ---
  const [modalAberto, setModalAberto] = useState<null | "cadastro" | "entrega" | "editar_req" | "ocorrencia" | "confirmar_entrega">(null);
  
  // --- Formulários ---
  const [formData, setFormData] = useState<any>({ 
    id: "", item: "", codigo_registro: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", 
    quantidade: 0, estoque_minimo: 5, tipo_estoque: "PROPRIO",
    valor_unitario: 0, coeficiente: 1.0
  });

  const [entregaData, setEntregaData] = useState({ colaborador: "", itens: [] as any[] });
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  
  const [reqEditando, setReqEditando] = useState<any>(null);
  const [ocorrenciaData, setOcorrenciaData] = useState({ reqId: "", desc: "", prioridade: "ALTA", dias_solucao: 1 });
  const [entregaConfirm, setEntregaConfirm] = useState({ recebedor: "" });

  // --- Fetch ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_user");
      if (saved) setUser(JSON.parse(saved));
    } catch (err) {}
    fetchTudo();
  }, [activeTab]);

  async function fetchTudo() {
    setLoading(true);
    
    const [epiRes, supRes, escRes] = await Promise.all([
      supabase.from('almox_epi').select('*'),
      supabase.from('almox_suprimentos').select('*'),
      supabase.from('almox_escritorio').select('*')
    ]);

    const combined = [
      ...(epiRes.data || []),
      ...(supRes.data || []),
      ...(escRes.data || [])
    ].sort((a, b) => a.item.localeCompare(b.item));

    setEstoque(combined);

    const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false });
    if (reqData) setRequisicoes(reqData);

    const { data: usrData } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
    if (usrData) setUsuarios(usrData);
    setLoading(false);
  }

  // --- Funções Auxiliares ---
  const calcularDias = (dataIso: string) => {
    const inicio = new Date(dataIso);
    const hoje = new Date();
    const diff = hoje.getTime() - inicio.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) === 0 ? "Hoje" : `${Math.floor(diff / (1000 * 60 * 60 * 24))} dias`;
  };

  // --- Handlers ---
  const handleSalvarItem = async () => {
    if (!formData.item) return alert("A descrição é obrigatória.");
    setLoading(true);

    let targetTable = "";
    if (formData.categoria === 'EPI') targetTable = 'almox_epi';
    else if (formData.categoria === 'SUPRIMENTO') targetTable = 'almox_suprimentos';
    else if (formData.categoria === 'ESCRITORIO') targetTable = 'almox_escritorio';

    if (!targetTable) return alert("Categoria inválida.");
    
    const { id: _, created_at: __, tipo_estoque: ___, ...raw } = formData;
    let cleanPayload: any = {
      codigo_registro: raw.codigo_registro,
      item: raw.item,
      categoria: raw.categoria,
      unidade_medida: raw.unidade_medida,
      tamanho: raw.tamanho
    };

    if (formData.categoria === 'EPI') {
      cleanPayload.ca = raw.ca;
      cleanPayload.quantidade = raw.quantidade;
      cleanPayload.estoque_minimo = raw.estoque_minimo;
    } else if (formData.categoria === 'SUPRIMENTO') {
      cleanPayload.valor_unitario = raw.valor_unitario;
      cleanPayload.coeficiente = raw.coeficiente;
    } else if (formData.categoria === 'ESCRITORIO') {
      cleanPayload.quantidade = raw.quantidade;
      cleanPayload.estoque_minimo = raw.estoque_minimo;
    }

    let error;
    if (formData.id) {
      const res = await supabase.from(targetTable).update(cleanPayload).eq('id', formData.id);
      error = res.error;
    } else {
      const res = await supabase.from(targetTable).insert([cleanPayload]);
      error = res.error;
    }
    
    if (error) alert("Erro: " + error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleConfirmarEntregaEPI = async () => {
    if (!entregaData.colaborador) return alert("Selecione um colaborador.");
    if (entregaData.itens.length === 0) return alert("Adicione ao menos um item.");
    
    setLoading(true);
    try {
      // 1. Atualizar estoque
      for (const item of entregaData.itens) {
        const novaQtd = Math.max(0, item.quantidade - item.qtd_entrega);
        await supabase.from('almox_epi').update({ quantidade: novaQtd }).eq('id', item.id);
      }
      
      // 2. Gerar PDF de Impressão (NR-06)
      const colaborador = usuarios.find(u => u.nome === entregaData.colaborador);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Ficha EPI - ${entregaData.colaborador}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a1a1a; line-height: 1.3; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; }
                .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
                .header p { margin: 2px 0; font-size: 10px; font-weight: bold; color: #555; }
                .info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; background: #fdfdfd; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
                .info-item { border-bottom: 1px solid #eee; padding-bottom: 2px; }
                .label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #888; display: block; }
                .value { font-size: 11px; font-weight: bold; color: #000; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                th { background: #000; color: #fff; font-size: 8px; text-transform: uppercase; padding: 8px; border: 1px solid #000; }
                td { border: 1px solid #ccc; padding: 6px; font-size: 10px; text-align: center; }
                .desc-td { text-align: left; font-weight: bold; }
                .termo { font-size: 9px; text-align: justify; border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-top: 10px; line-height: 1.5; background: #fafafa; }
                .assinaturas { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
                .ass-box { border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 9px; font-weight: bold; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Ficha de Controle de Entrega de EPI</h1>
                <p>Em conformidade com a Norma Regulamentadora NR-06 do Ministério do Trabalho</p>
              </div>

              <div class="info-box">
                <div class="info-item"><span class="label">Funcionário</span><span class="value">${entregaData.colaborador}</span></div>
                <div class="info-item"><span class="label">Cargo/Função</span><span class="value">${colaborador?.cargo || '---'}</span></div>
                <div class="info-item"><span class="label">Data da Entrega</span><span class="value">${new Date().toLocaleDateString('pt-BR')}</span></div>
                <div class="info-item"><span class="label">Unidade / Obra</span><span class="value">Alicerce ERP - Central</span></div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th style="width: 50%;">Descrição do EPI</th>
                    <th>UND</th>
                    <th>TAM</th>
                    <th>C.A.</th>
                    <th>QTD</th>
                  </tr>
                </thead>
                <tbody>
                  ${entregaData.itens.map(it => `
                    <tr>
                      <td class="desc-td">${it.item}</td>
                      <td>${it.unidade_medida}</td>
                      <td>${it.tamanho || 'UN'}</td>
                      <td>${it.ca || '---'}</td>
                      <td>${it.qtd_entrega}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="termo">
                <strong>TERMO DE RESPONSABILIDADE:</strong><br>
                Recebi da empresa os Equipamentos de Proteção Individual (EPI) acima relacionados, novos e em perfeitas condições de uso, adequados ao risco da minha atividade. Comprometo-me a:
                1. Usar o EPI apenas para a finalidade a que se destina; 
                2. Responsabilizar-me pela guarda e conservação; 
                3. Comunicar à empresa qualquer alteração que o torne impróprio para uso; 
                4. Cumprir as determinações da empresa sobre o uso adequado. 
                Declaro estar ciente de que o não uso dos mesmos constitui ato de insubordinação, sujeito às penalidades previstas na CLT e regulamentos internos.
              </div>

              <div class="assinaturas">
                <div class="ass-box">ASSINATURA DO COLABORADOR</div>
                <div class="ass-box">RESPONSÁVEL PELA ENTREGA</div>
              </div>
              
              <script>window.onload = () => { window.print(); window.onafterprint = () => { window.close(); }; }</script>
            </body>
          </html>
        `);
        win.document.close();
      }

      setModalAberto(null);
      setEntregaData({ colaborador: "", itens: [] });
      setBuscaFuncionario("");
      fetchTudo();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarPedido = async () => {
    const todosItensId = Array.from(new Set([...Object.keys(volumes), ...Object.keys(volumesExtra)]));
    const itensParaPedir = todosItensId.filter(id => (volumes[id] || 0) > 0 || (volumesExtra[id] || 0) > 0);
    
    if (itensParaPedir.length === 0) return alert("Selecione quantidades antes de finalizar.");
    setLoading(true);

    try {
      const protocoloUnico = `REQ-ALMOX-${Math.floor(100000 + Math.random() * 900000)}`;
      const payload = itensParaPedir.map(id => {
        const item = estoque.find(c => String(c.id) === id);
        return {
          item_id: id,
          solicitante: `ALMOXARIFADO (${user?.name || 'Central'})`,
          unidade_destino: 'ALMOXARIFADO CENTRAL',
          quantidade: volumes[id] || 0,
          quantidade_extra: volumesExtra[id] || 0,
          status: 'SOLICITADO',
          item_nome: item?.item || 'Item',
          unidade_medida: item?.unidade_medida || 'UN',
          protocolo: protocoloUnico,
          tipo_item: item?.categoria || 'GERAL',
          data_solicitacao: new Date().toISOString(),
        };
      });

      const { error } = await supabase.from('requisicoes').insert(payload);
      if (error) throw error;

      setVolumes({});
      setVolumesExtra({});
      setActiveTab("REQUISICOES");
      fetchTudo();
      alert(`✅ Requisição Interna ${protocoloUnico} gerada com sucesso.`);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessarReq = async (id: string, status: 'APROVADO' | 'REPROVADO', qtdAprovada?: number) => {
    setLoading(true);
    const updates: any = { status };
    if (qtdAprovada !== undefined) updates.quantidade_aprovada = qtdAprovada;
    
    const { error } = await supabase.from('requisicoes').update(updates).eq('id', id);
    if (error) alert(error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleConfirmarEntregaTotal = async () => {
    if (!entregaConfirm.recebedor) return alert("Informe quem recebeu.");
    setLoading(true);
    const { error } = await supabase.from('requisicoes').update({ 
      status: 'ENTREGUE', 
      data_entrega: new Date().toISOString(),
      recebedor_nome: entregaConfirm.recebedor
    }).eq('id', reqEditando.id);
    
    if (error) alert(error.message);
    else { setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  const handleSalvarOcorrencia = async () => {
    if (!ocorrenciaData.desc) return alert("Descreva a ocorrência.");
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').insert([{
      assunto: `Ocorrência na Req #${reqEditando?.protocolo || 'N/A'}`,
      descricao: ocorrenciaData.desc,
      prioridade: ocorrenciaData.prioridade,
      prazo_estipulado_dias: ocorrenciaData.dias_solucao,
      unidade: reqEditando?.unidade_destino,
      criado_por: user.name || 'Almoxarifado',
      status: 'PENDENTE'
    }]);
    if (error) alert(error.message);
    else { alert("Ocorrência registrada."); setModalAberto(null); fetchTudo(); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full no-print px-4 md:px-10 py-6 max-w-[1600px] mx-auto overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-8 md:p-12 rounded-[3rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-[var(--brand)]/10 rounded-2xl flex items-center justify-center text-[var(--brand)] border border-[var(--brand)]/20">
              <Package size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Almoxarifado Central</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Gestão de Estoque e Operação Logística</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => { setEntregaData({ colaborador: "", itens: [] }); setBuscaFuncionario(""); setModalAberto("entrega"); }} className="h-12 px-6 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-600/20">
             <UserCheck size={16} /> Entrega Direta (EPI)
           </button>
            <button onClick={() => { 
              setFormData({ 
                id: "", item: "", codigo_registro: "", categoria: "EPI", unidade_medida: "UN", tamanho: "", ca: "", 
                quantidade: 0, estoque_minimo: 5, valor_unitario: 0, coeficiente: 1.0 
              }); 
              setModalAberto("cadastro"); 
            }} className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg">
             <Plus size={16} /> Novo Cadastro
           </button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md w-fit overflow-x-auto">
          {[
            { id: "ESTOQUE", label: "Estoque Geral", icon: Package },
            { id: "REQUISICOES", label: "Análise de Pedidos", icon: FileText },
            { id: "FAZER_REQ", label: "Fazer Requisição", icon: ShoppingBag },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "FAZER_REQ" && (
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input-field !pl-12 !h-12 text-xs" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] overflow-hidden shadow-xl flex flex-col flex-1 min-h-[500px]">
          
          {activeTab === "REQUISICOES" && (
            <div className="overflow-x-auto flex-1 scrollbar-thin">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-base)]/90 border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px]">Nº Req.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-left">Descrição do Produto</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Pedido</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Aprovado</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center">Dias</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-muted tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {requisicoes.filter(r => r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || r.item_nome?.toLowerCase().includes(busca.toLowerCase())).map(r => (
                    <tr key={r.id} className="hover:bg-[var(--bg-base)]/30 transition-all group">
                      <td className="px-6 py-6 text-center font-black text-[var(--brand)]">{r.protocolo || '---'}</td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-black whitespace-normal max-w-[250px]">{r.item_nome || r.item}</div>
                        <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{r.unidade_destino} | {new Date(r.data_solicitacao).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-6 text-center text-sm font-bold text-[var(--text-muted)]">{r.quantidade} {r.unidade_medida}</td>
                      <td className="px-6 py-6 text-center text-base font-black text-blue-600">{r.quantidade_aprovada ?? '---'}</td>
                      <td className="px-6 py-6 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <Clock size={12} className="text-orange-500" />
                            <span className="text-[10px] font-black uppercase text-orange-600">{calcularDias(r.data_solicitacao)}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.status === 'SOLICITADO' ? 'bg-orange-100 text-orange-700' : r.status === 'APROVADO' ? 'bg-blue-100 text-blue-700' : r.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setReqEditando(r); setModalAberto("ocorrencia"); }} title="Ocorrência" className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><AlertTriangle size={14}/></button>
                          {r.status === 'SOLICITADO' && (
                            <button onClick={() => { setReqEditando({...r, quantidade_aprovada: r.quantidade + (r.quantidade_extra || 0)}); setModalAberto("editar_req"); }} className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all">Analisar</button>
                          )}
                          {r.status === 'APROVADO' && (
                             <button onClick={() => { setReqEditando(r); setModalAberto("confirmar_entrega"); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase hover:scale-105 transition-all flex items-center gap-2"><Truck size={12}/> Entregar</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "ESTOQUE" && (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[100px]">Reg.</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-left">Descrição do Material</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[100px]">Unidade</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[150px]">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {estoque.filter(i => i.item?.toLowerCase().includes(busca.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-[var(--bg-base)]/30 transition-all cursor-pointer" onClick={() => { setFormData(item); setModalAberto("cadastro"); }}>
                      <td className="px-6 py-6 text-center font-mono text-[var(--text-muted)] text-[11px]">{item.codigo_registro || '---'}</td>
                      <td className="px-6 py-6">
                        <span className="text-[13px] font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors">{item.item}</span>
                      </td>
                      <td className="px-6 py-6 text-center"><span className="text-[11px] font-black text-[var(--text-muted)]">{item.unidade_medida || 'UN'}</span></td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block min-w-[100px] ${
                          item.categoria === 'EPI' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' :
                          item.categoria === 'SUPRIMENTO' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                          'bg-purple-500/10 text-purple-600 border-purple-500/20'
                        }`}>
                          {item.categoria}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "FAZER_REQ" && (
            <div className="flex flex-col flex-1">
               <div className="p-8 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
                  <div>
                    <h3 className="text-lg font-black uppercase">Gerador de Pedidos Almoxarifado</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">Crie requisições internas de qualquer material para reposição ou uso</p>
                  </div>
                  <button onClick={handleFinalizarPedido} disabled={loading || (Object.values(volumes).every(v => v === 0) && Object.values(volumesExtra).every(v => v === 0))} className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30 disabled:opacity-30">
                    <Send size={18} /> Finalizar Pedido
                  </button>
               </div>
               
               <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Reg.</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Descrição do Material</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Estoque</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Qtd. Pedir</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Extra/Obs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {estoque.map(item => (
                        <tr key={item.id} className="hover:bg-[var(--bg-base)]/10">
                          <td className="px-6 py-4 text-center font-mono text-[var(--text-muted)] text-[10px]">{item.codigo_registro || '---'}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-[var(--text-primary)]">{item.item}</p>
                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{item.categoria}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[11px] font-black ${item.quantidade <= (item.estoque_minimo || 0) ? 'text-red-600' : 'text-blue-600'}`}>{item.quantidade || 0} {item.unidade_medida}</span>
                          </td>
                          <td className="px-6 py-4">
                            <input type="number" min="0" value={volumes[item.id] || ''} onChange={e => setVolumes({...volumes, [item.id]: Number(e.target.value)})} className="w-24 h-10 px-2 mx-auto rounded-lg border-2 border-transparent bg-[var(--bg-base)] text-center text-xs font-black outline-none focus:border-blue-500 block" placeholder="0" />
                          </td>
                          <td className="px-6 py-4">
                            <input type="number" min="0" value={volumesExtra[item.id] || ''} onChange={e => setVolumesExtra({...volumesExtra, [item.id]: Number(e.target.value)})} className="w-24 h-10 px-2 mx-auto rounded-lg border-2 border-orange-100 bg-orange-50/20 text-orange-600 text-center text-xs font-black outline-none focus:border-orange-500 block" placeholder="0" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
      </div>

      {/* MODAL ANALISE/APROVAÇÃO */}
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
                    <input type="number" className="input-field !h-16 text-2xl font-black text-center border-blue-200 text-blue-600" value={reqEditando.quantidade_aprovada} onChange={e => setReqEditando({...reqEditando, { quantidade_aprovada: Number(e.target.value) }})} />
                 </div>
                 <div className="flex flex-col gap-3 justify-center">
                    <button onClick={() => handleProcessarReq(reqEditando.id, 'APROVADO', reqEditando.quantidade_aprovada)} className="h-16 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all">Aprovar com Ajustes</button>
                    <button onClick={() => handleProcessarReq(reqEditando.id, 'REPROVADO')} className="h-12 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all">Reprovar Totalmente</button>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL CONFIRMAR ENTREGA */}
      <AdaptiveModal isOpen={modalAberto === "confirmar_entrega"} onClose={() => setModalAberto(null)} title="Finalizar Entrega Logística">
         {reqEditando && (
           <div className="p-10 space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                 <Truck size={40} />
              </div>
              <h3 className="text-lg font-black uppercase">Confirmar Recebimento</h3>
              
              <div className="text-left mt-6">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Nome de Quem Recebeu *</label>
                 <input className="input-field !h-14 font-black" value={entregaConfirm.recebedor} onChange={e => setEntregaConfirm({recebedor: e.target.value})} placeholder="Ex: Maria Silva (Secretária)" />
              </div>

              <button onClick={handleConfirmarEntregaTotal} className="w-full h-16 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl mt-4 hover:scale-[1.02] transition-all">Finalizar e Registrar Data</button>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL OCORRENCIA */}
      <AdaptiveModal isOpen={modalAberto === "ocorrencia"} onClose={() => setModalAberto(null)} title="Registrar Falha / Ocorrência Administrativa">
         {reqEditando && (
           <div className="p-10 space-y-6">
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-start gap-4">
                 <AlertTriangle className="text-red-600 shrink-0" size={24}/>
                 <div>
                    <p className="text-xs font-black text-red-900 uppercase">Gestão de SLA e Prazos</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Descrição da Demanda / Problema</label>
                    <textarea className="input-field !h-32 p-4 text-xs font-bold" value={ocorrenciaData.desc} onChange={e => setOcorrenciaData({...ocorrenciaData, desc: e.target.value})} placeholder="O que precisa ser resolvido?" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Prazo de Solução (Dias)</label>
                    <select className="input-field !h-14 font-black" value={ocorrenciaData.dias_solucao} onChange={e => setOcorrenciaData({...ocorrenciaData, dias_solucao: Number(e.target.value)})}>
                       <option value={1}>24 Horas (1 dia)</option>
                       <option value={2}>2 Dias</option>
                       <option value={3}>3 Dias</option>
                       <option value={5}>5 Dias</option>
                       <option value={10}>10 Dias</option>
                    </select>
                 </div>
                 <div className="flex items-end">
                    <button onClick={handleSalvarOcorrencia} className="w-full h-14 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all">Abrir Ticket</button>
                 </div>
              </div>
           </div>
         )}
      </AdaptiveModal>

      {/* MODAL NOVO/EDITAR ITEM */}
      <AdaptiveModal isOpen={modalAberto === "cadastro"} onClose={() => setModalAberto(null)} title={formData.id ? "Editar Material" : "Cadastrar Material"}>
         <div className="p-8 space-y-6">
            <div>
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Categoria do Material *</label>
               <select className="input-field w-full font-black text-blue-600" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}>
                  <option value="EPI">Equipamento de Proteção (EPI)</option>
                  <option value="SUPRIMENTO">Suprimentos (Limpeza, Copa, etc)</option>
                  <option value="ESCRITORIO">Materiais de Escritório</option>
               </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Cód. Registro</label>
                 <input type="text" className="input-field uppercase font-mono" value={formData.codigo_registro} onChange={e => setFormData({...formData, codigo_registro: e.target.value})} placeholder="Ex: COD-123" />
               </div>
               <div className="col-span-2">
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Descrição *</label>
                 <input type="text" className="input-field" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
               </div>
               
               <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Und. Medida *</label>
                 <input type="text" className="input-field uppercase" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})} />
               </div>
               
               <div>
                 <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Tamanho</label>
                 <input type="text" className="input-field uppercase" value={formData.tamanho} onChange={e => setFormData({...formData, tamanho: e.target.value})} />
               </div>

               {formData.categoria !== 'SUPRIMENTO' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Saldo em Estoque</label>
                      <input type="number" className="input-field font-black text-blue-600" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Estoque Mínimo</label>
                      <input type="number" className="input-field" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} />
                    </div>
                  </>
                )}

                {formData.categoria === 'EPI' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">CA (Certificado)</label>
                    <input type="text" className="input-field" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} />
                  </div>
                )}

               {formData.categoria !== 'EPI' && (
                  <>
                    <div className={formData.categoria === 'ESCRITORIO' ? 'col-span-2' : ''}>
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Valor Unitário Ref.</label>
                      <input type="number" step="0.01" className="input-field" value={formData.valor_unitario} onChange={e => setFormData({...formData, valor_unitario: Number(e.target.value)})} />
                    </div>
                    {formData.categoria === 'SUPRIMENTO' && (
                      <div>
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Coeficiente</label>
                        <input type="number" step="0.1" className="input-field text-blue-600" value={formData.coeficiente} onChange={e => setFormData({...formData, coeficiente: Number(e.target.value)})} />
                      </div>
                    )}
                  </>
                )}
            </div>

            <button onClick={handleSalvarItem} className="h-14 w-full bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] transition-all mt-4">
              {formData.id ? "Atualizar Material" : "Salvar Material"}
            </button>
         </div>
      </AdaptiveModal>

      {/* MODAL ENTREGA DIRETA DE EPI */}
      <AdaptiveModal isOpen={modalAberto === "entrega"} onClose={() => setModalAberto(null)} title="Entrega de EPI (Ficha NR-06)">
         <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto overflow-x-hidden">
            {/* Seção 1: Colaborador com Busca Rápida */}
            <div className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)] relative">
               <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-3 block">Pesquisar Colaborador (800+ cadastrados)</label>
               <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input className="input-field !pl-12 !h-14 font-black text-orange-600" placeholder="Digite o nome do funcionário..." value={buscaFuncionario} onChange={e => setBuscaFuncionario(e.target.value)} />
               </div>
               
               {buscaFuncionario.length > 2 && (
                 <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[var(--border)] shadow-2xl z-50 max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {usuarios.filter(u => u.nome.toLowerCase().includes(buscaFuncionario.toLowerCase())).map(u => (
                       <div key={u.id} className="p-4 hover:bg-orange-50 cursor-pointer border-b border-[var(--border)] last:border-0 transition-colors" onClick={() => { setEntregaData({...entregaData, colaborador: u.nome}); setBuscaFuncionario(""); }}>
                          <p className="text-sm font-black text-[var(--text-primary)]">{u.nome}</p>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{u.cargo}</p>
                       </div>
                    ))}
                 </div>
               )}

               {entregaData.colaborador && (
                 <div className="mt-4 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                          <User size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-orange-900">{entregaData.colaborador}</p>
                          <p className="text-[9px] font-bold text-orange-700/60 uppercase">Selecionado para Entrega</p>
                       </div>
                    </div>
                    <button onClick={() => setEntregaData({...entregaData, colaborador: ""})} className="p-2 text-orange-600 hover:bg-white rounded-lg transition-all"><X size={16}/></button>
                 </div>
               )}
            </div>
            
            {/* Seção 2: Seleção de Itens */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Catálogo de EPIs Disponíveis</h4>
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">Apenas Categoria EPI</span>
               </div>
               
               <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-1 scrollbar-thin">
                  {estoque.filter(i => i.categoria === 'EPI' && i.quantidade > 0).map(i => (
                     <div key={i.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-[var(--border)] cursor-pointer hover:border-orange-500 hover:shadow-md transition-all group" onClick={() => { if(!entregaData.itens.find(it => it.id === i.id)) setEntregaData({...entregaData, itens: [...entregaData.itens, {...i, qtd_entrega: 1}]}); }}>
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-[var(--text-primary)] group-hover:text-orange-600 transition-colors">{i.item}</span>
                           <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{i.tamanho || 'UN'} | CA: {i.ca || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-blue-600">Disp: {i.quantidade}</span>
                           <Plus size={14} className="text-orange-500"/>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Seção 3: Itens Selecionados para Entrega */}
            {entregaData.itens.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-[var(--border)] animate-fade-in">
                 <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Itens na Ficha de Entrega</h4>
                 <div className="space-y-3">
                    {entregaData.itens.map((it, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                <ShieldCheck size={20} />
                             </div>
                             <div>
                                <p className="text-xs font-black text-orange-900">{it.item}</p>
                                <p className="text-[9px] font-bold text-orange-700/60 uppercase">C.A. {it.ca}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center bg-white rounded-xl border border-orange-200 overflow-hidden shadow-sm">
                                <button className="px-3 py-1 hover:bg-orange-50 text-orange-600 font-bold border-r border-orange-100" onClick={() => {
                                   const newItens = [...entregaData.itens];
                                   newItens[idx].qtd_entrega = Math.max(1, newItens[idx].qtd_entrega - 1);
                                   setEntregaData({...entregaData, itens: newItens});
                                }}>-</button>
                                <div className="w-10 h-10 flex items-center justify-center text-xs font-black text-orange-900 bg-transparent">
                                  {it.qtd_entrega}
                                </div>
                                <button className="px-3 py-1 hover:bg-orange-50 text-orange-600 font-bold border-l border-orange-100" onClick={() => {
                                   const newItens = [...entregaData.itens];
                                   newItens[idx].qtd_entrega = Math.min(it.quantidade, newItens[idx].qtd_entrega + 1);
                                   setEntregaData({...entregaData, itens: newItens});
                                }}>+</button>
                             </div>
                             <button onClick={() => setEntregaData({...entregaData, itens: entregaData.itens.filter((_, i) => i !== idx)})} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><X size={18}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 <button onClick={handleConfirmarEntregaEPI} className="h-16 w-full bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 mt-6">
                    <Printer size={20}/> Confirmar e Gerar Ficha (PDF)
                 </button>
              </div>
            )}
         </div>
      </AdaptiveModal>
    </div>
  );
}
