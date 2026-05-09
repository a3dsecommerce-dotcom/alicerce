"use client";
import { useState } from "react";
import { 
  Search, Package, Plus, FileText, ShoppingBag, AlertTriangle, Loader, UserCheck, Archive
} from "lucide-react";
import { useAlmoxData } from "./almoxarifado/useAlmoxData";
import EstoqueTable from "./almoxarifado/EstoqueTable";
import RequisicoesTable from "./almoxarifado/RequisicoesTable";
import NovaRequisicaoForm from "./almoxarifado/NovaRequisicaoForm";
import EntregasEPITable from "./almoxarifado/EntregasEPITable";
import AlmoxModals from "./almoxarifado/AlmoxModals";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type TabType = "ESTOQUE" | "REQUISICOES" | "FAZER_REQ" | "ENTREGAS_EPI";

export default function AlmoxarifadoModule({ reducao }: { reducao: number, setReducao: (v: number) => void }) {
  const { 
    loading, estoque, requisicoes, usuarios, ocorrencias, 
    updateItem, insertItem, deleteItem, processarRequisicao, processarEntregaRPC, arquivarRequisicao, arquivarProtocolo, refresh 
  } = useAlmoxData();

  const [activeTab, setActiveTab] = useState<TabType>("ESTOQUE");
  const [busca, setBusca] = useState("");
  
  // Estados Locais (UI)
  const [modalAberto, setModalAberto] = useState<null | string>(null);
  const handleCloseModal = () => {
    if (modalAberto === "recibo" || modalAberto === "entrega") {
      setEntregaData({ colaborador: "", itens: [] });
      setBuscaFuncionario("");
    }
    setModalAberto(null);
  };
  const [formData, setFormData] = useState<any>({ categoria: "EPI", quantidade: 0, estoque_minimo: 5 });
  const [entregaData, setEntregaData] = useState({ colaborador: "", itens: [] as any[] });
  const [buscaFuncionario, setBuscaFuncionario] = useState("");
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volumesExtra, setVolumesExtra] = useState<Record<string, number>>({});
  const [tipoPedidoGeral, setTipoPedidoGeral] = useState<"MENSAL" | "EMERGENCIAL">("MENSAL");
  const [reqEditando, setReqEditando] = useState<any>(null);
  const [entregaConfirm, setEntregaConfirm] = useState({ recebedor: "" });
  const [entregaParcialQtd, setEntregaParcialQtd] = useState(0);
  const [ocorrenciaData, setOcorrenciaData] = useState({ desc: "", prioridade: "ALTA", dias_solucao: 1, setor_destino: "Gerência Operacional" });
  const [resolucaoData, setResolucaoData] = useState({ id: "", solucao: "" });
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("EPI");
  const [observacao, setObservacao] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);

  // Agrupamento para Requisições
  const requisicoesAgrupadas = (requisicoes || []).reduce((acc: any[], current: any) => {
    if (!current) return acc;
    const proto = current.protocolo || 'SEM-PROTOCOLO';
    let group = acc.find(g => g.protocolo === proto);
    if (!group) {
      group = { 
        protocolo: proto, 
        data: current.data_solicitacao,
        solicitante: current.solicitante,
        unidade_destino: current.unidade_destino,
        secretaria_destino: current.secretaria_destino,
        status_geral: current.status || 'SOLICITADO',
        arquivado: current.arquivado,
        tipo_pedido: current.tipo_pedido || 'MENSAL',
        itens: [] 
      };
      acc.push(group);
    }
    group.itens.push(current);
    // Se algum item não estiver entregue, o status geral do grupo reflete isso para o almoxarife
    if (current.status !== 'ENTREGUE' && group.status_geral === 'ENTREGUE') {
      group.status_geral = current.status;
    }
    return acc;
  }, []);

  // Handlers Complexos (que envolvem lógica de UI + Banco)
  const handleSalvarItem = async () => {
    try {
      const targetTable = formData.categoria === 'EPI' ? 'almox_epi' : formData.categoria === 'SUPRIMENTO' ? 'almox_suprimentos' : 'almox_escritorio';
      if (formData.id) await updateItem(targetTable, formData.id, formData);
      else await insertItem(targetTable, formData);
      setModalAberto(null);
      toast.success("Material salvo no inventário!");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleExcluirItem = async () => {
    if (!window.confirm("Excluir item?")) return;
    try {
      const targetTable = formData.categoria === 'EPI' ? 'almox_epi' : formData.categoria === 'SUPRIMENTO' ? 'almox_suprimentos' : 'almox_escritorio';
      await deleteItem(targetTable, formData.id);
      setModalAberto(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleFinalizarPedidoInternal = async () => {
    const todosItensId = Array.from(new Set([...Object.keys(volumes), ...Object.keys(volumesExtra)]));
    const itensParaPedir = todosItensId.filter(id => (volumes[id] || 0) > 0 || (volumesExtra[id] || 0) > 0);
    
    if (itensParaPedir.length === 0) return toast.warning("Selecione quantidades antes de enviar.");
    
    try {
      const loadingToast = toast.loading("Enviando requisição interna...");
      const protocolo = `REQ-INT-${Math.floor(100000 + Math.random() * 900000)}`;
      
      const payload = itensParaPedir.map(id => {
        const item = estoque.find(c => String(c.id) === id);
        return {
          item_id: id,
          solicitante: "Almoxarifado Central (Interno)",
          unidade_destino: "Almoxarifado Central",
          secretaria_destino: "ALMOXARIFADO",
          quantidade: volumes[id] || 0,
          quantidade_extra: volumesExtra[id] || 0,
          status: 'SOLICITADO',
          item_nome: item?.item || 'Item',
          unidade_medida: item?.unidade_medida || 'UN',
          protocolo: protocolo,
          tipo_item: item?.categoria || 'SUPRIMENTO',
          tipo_pedido: tipoPedidoGeral,
          data_solicitacao: new Date().toISOString(),
          observacao: observacao,
        };
      });

      const { error } = await supabase.from('requisicoes').insert(payload);
      if (error) throw error;

      setVolumes({});
      setVolumesExtra({});
      setObservacao("");
      toast.dismiss(loadingToast);
      toast.success("Pedido interno gerado com sucesso!");
      refresh();
      setActiveTab("REQUISICOES");
    } catch (e: any) { 
      toast.error("Erro ao gerar pedido: " + e.message); 
    }
  };

  const calcularDias = (dataIso: string) => {
    const d = new Date(dataIso);
    const diff = new Date().getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dias === 0 ? "Hoje" : `${dias}d`;
  };

  if (loading) return (
    <div className="p-10">
      <TableSkeleton rows={10} cols={6} />
    </div>
  );

  const handleConfirmarEntregaEPI = async () => {
    if (!entregaData.colaborador || entregaData.itens.length === 0) return;
    try {
      const loadingToast = toast.loading("Processando entrega e baixando estoque...");
      for (const item of entregaData.itens) {
        const { data: req, error: reqErr } = await supabase.from('requisicoes').insert([{
          item_id: item.id,
          item_nome: item.item,
          quantidade: item.qtd_entrega,
          solicitante: entregaData.colaborador,
          status: 'PENDENTE',
          tipo_item: 'EPI',
          unidade_destino: 'Entrega Direta (Almoxarifado)',
          protocolo: `EPI-${Math.floor(1000 + Math.random() * 9000)}`
        }]).select().single();
        if (reqErr) throw reqErr;

        await processarEntregaRPC({
          req_id: req.id,
          item_id: item.id,
          quantidade_entregue: item.qtd_entrega,
          categoria: 'EPI',
          recebedor: entregaData.colaborador,
          status_final: 'ENTREGUE'
        });
      }
      setModalAberto("recibo");
      toast.dismiss(loadingToast);
      toast.success("EPI entregue e estoque atualizado com sucesso!");
      refresh();
    } catch (e: any) { toast.error("Erro na entrega: " + e.message); }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in px-4 md:px-10 py-6 max-w-[1600px] mx-auto overflow-y-auto">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--bg-card)] p-8 md:p-12 rounded-[3rem] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-[var(--brand)]/10 rounded-2xl flex items-center justify-center text-[var(--brand)] border border-[var(--brand)]/20"><Package size={28} /></div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic">Almoxarifado Central</h2>
              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Gestão de Estoque e Operação Logística</p>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => { setEntregaData({ colaborador: "", itens: [] }); setModalAberto("entrega"); }} className="h-12 px-6 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-orange-600/20"><UserCheck size={16} /> Entrega Direta (EPI)</button>
           <button onClick={() => { setFormData({ categoria: "EPI", quantidade: 0, estoque_minimo: 5 }); setModalAberto("cadastro"); }} className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg"><Plus size={16} /> Novo Cadastro</button>
        </div>
      </div>

      {/* ABAS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex gap-2 p-1.5 bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-md w-fit overflow-x-auto">
          {[
            { id: "ESTOQUE", label: "Cadastro Geral", icon: Package },
            { id: "REQUISICOES", label: "Requisições", icon: FileText },
            { id: "ENTREGAS_EPI", label: "Entregas EPI", icon: UserCheck },
            { id: "FAZER_REQ", label: "Fazer Requisição", icon: ShoppingBag },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
        {activeTab !== "FAZER_REQ" && (
          <div className="flex items-center gap-4 w-full md:w-auto">
            {activeTab === "REQUISICOES" && (
              <button 
                onClick={() => setMostrarArquivados(!mostrarArquivados)} 
                className={`h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${mostrarArquivados ? 'bg-amber-600 border-amber-700 text-white shadow-lg' : 'bg-white border-[var(--border)] text-slate-500 hover:bg-slate-50'}`}
              >
                <Archive size={16} /> {mostrarArquivados ? "Ver Ativas" : "Ver Arquivadas"}
              </button>
            )}
            <div className="relative flex-1 md:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input className="input-field !pl-12 !h-12 text-xs" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] shadow-xl flex flex-col flex-1 min-h-[500px]">
          {activeTab === "ESTOQUE" && (
            <div className="flex flex-col h-full">
              {/* Filtros de Categoria dentro do Estoque */}
              <div className="flex gap-4 p-6 border-b border-[var(--border)] bg-slate-50/50">
                 {["EPI", "SUPRIMENTO", "ESCRITORIO"].map(cat => (
                   <button 
                     key={cat} 
                     onClick={() => setFiltroCategoria(cat)}
                     className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${filtroCategoria === cat ? 'bg-black text-white shadow-md' : 'bg-white text-slate-500 border-[var(--border)] hover:bg-slate-100'}`}
                   >
                     {cat === 'EPI' ? 'Equipamentos (EPI)' : cat === 'SUPRIMENTO' ? 'Suprimentos / Catálogo' : 'Mat. Escritório'}
                   </button>
                 ))}
              </div>
              <EstoqueTable 
                estoque={estoque.filter(i => i.categoria === filtroCategoria)} 
                busca={busca} 
                onEdit={(item) => { setFormData(item); setModalAberto("cadastro"); }} 
              />
            </div>
          )}
          {activeTab === "REQUISICOES" && (
            <RequisicoesTable 
              requisicoes={requisicoesAgrupadas} 
              busca={busca} 
              mostrarArquivados={mostrarArquivados}
              calcularDias={calcularDias} 
              onAnalisar={(r) => { setReqEditando(r); setModalAberto("editar_req"); }} 
              onGerenciar={(r) => { setReqEditando(r); setEntregaConfirm({recebedor: r.itens?.[0]?.recebedor_nome || ""}); setModalAberto("confirmar_entrega"); }} 
              onArquivar={(proto) => {
                 if (confirm("Arquivar esta requisição concluída? Ela sairá da tela principal mas continuará disponível para auditoria.")) {
                    arquivarProtocolo(proto);
                 }
              }}
            />
          )}
          {activeTab === "FAZER_REQ" && (
            <NovaRequisicaoForm 
              estoque={estoque} 
              volumes={volumes} 
              setVolumes={setVolumes} 
              volumesExtra={volumesExtra} 
              setVolumesExtra={setVolumesExtra} 
              tipoPedidoGeral={tipoPedidoGeral} 
              setTipoPedidoGeral={setTipoPedidoGeral} 
              observacao={observacao}
              setObservacao={setObservacao}
              onFinalizar={() => setModalAberto("termo_requisicao")} 
              loading={loading} 
            />
          )}
          {activeTab === "ENTREGAS_EPI" && <EntregasEPITable requisicoes={requisicoes} busca={busca} calcularDias={calcularDias} />}
      </div>

      <AlmoxModals 
        modalAberto={modalAberto} setModalAberto={handleCloseModal}
        formData={formData} setFormData={setFormData} onSalvarItem={handleSalvarItem} onExcluirItem={handleExcluirItem}
        entregaData={entregaData} setEntregaData={setEntregaData} buscaFuncionario={buscaFuncionario} setBuscaFuncionario={setBuscaFuncionario} usuarios={usuarios} estoque={estoque} onConfirmarEntregaEPI={handleConfirmarEntregaEPI}
        reqEditando={reqEditando} setReqEditando={setReqEditando} onProcessarReq={(id, status, qtd) => {
           processarRequisicao(id, {status, quantidade_aprovada: qtd});
           toast.success(`Requisição ${status === 'APROVADO' ? 'Aprovada' : 'Reprovada'}`);
        }}
        entregaConfirm={entregaConfirm} setEntregaConfirm={setEntregaConfirm} entregaParcialQtd={entregaParcialQtd} setEntregaParcialQtd={setEntregaParcialQtd} 
        onConfirmarEntregaTotal={async () => {
          // Mantido para compatibilidade se necessário, mas agora usamos o handler individual no modal agrupado
        }} 
        onConfirmarEntregaParcialExternal={async (it: any, qtd: number, status: string) => {
          try {
            await processarEntregaRPC({
              req_id: it.id,
              item_id: it.item_id,
              quantidade_entregue: qtd,
              categoria: it.tipo_item,
              recebedor: entregaConfirm.recebedor,
              status_final: status
            });
            toast.success(`Entrega de ${it.item_nome} registrada!`);
            refresh();
          } catch (e: any) { toast.error(e.message); }
        }} 
        onConfirmarEntregaParcial={async () => {
          // Mantido para compatibilidade
        }} 
        ocorrenciaData={ocorrenciaData} setOcorrenciaData={setOcorrenciaData} onSalvarOcorrencia={() => toast.error("Ocorrência registrada e enviada para o RH.")}
        resolucaoData={resolucaoData} setResolucaoData={setResolucaoData} onFinalizarResolucao={() => toast.success("Atendimento finalizado.")}
        onFinalizarRequisicaoInternal={handleFinalizarPedidoInternal}
        loading={loading}
      />
    </div>
  );
}
