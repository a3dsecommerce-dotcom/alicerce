"use client";
import { useState, useEffect } from "react";
import { 
  ShoppingBag, Truck, Package, User, Send, Box, Activity, Clock, Printer
} from "lucide-react";
import { useComprasData } from "./compras/useComprasData";
import CatalogoTable from "./compras/CatalogoTable";
import TrackingTable from "./compras/TrackingTable";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";

export default function ComprasModule({ user, initialTab }: { user: any, initialTab?: string }) {
  const { loading, catalogo, requisicoesRaw, qtdAsg, enviarRequisicao } = useComprasData(user);
  const [activeTab, setActiveTab] = useState<"CATALOGO" | "TRACKING">((initialTab?.toUpperCase() as any) || "CATALOGO");
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab.toUpperCase() as any);
    }
  }, [initialTab]);

  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [volumesExtra, setVolumesExtra] = useState<Record<string, number>>({});
  const [tipoPedido, setTipoPedido] = useState<"MENSAL" | "EMERGENCIAL">("MENSAL");
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFilter, setReportFilter] = useState({ start: '', end: '', protocol: '' });

  // Guard para evitar quebra caso o usuário demore a sincronizar
  if (!user) return (
    <div className="flex items-center justify-center p-20 text-[var(--text-muted)] font-bold">
      Aguardando sincronização de perfil...
    </div>
  );

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={10} cols={5} />
    </div>
  );

  // Agrupamento para Tracking com segurança contra dados nulos
  const requisicoesAgrupadas = (requisicoesRaw || []).reduce((acc: any[], current: any) => {
    if (!current) return acc;
    const proto = current.protocolo || 'SEM-PROTOCOLO';
    let group = acc.find(g => g.protocolo === proto);
    if (!group) {
      group = { 
        protocolo: proto, 
        data: current.data_solicitacao ? new Date(current.data_solicitacao).toLocaleDateString() : '---',
        data_raw: current.data_solicitacao,
        status_geral: current.status || 'PENDENTE',
        tipo_pedido: current.tipo_pedido || 'MENSAL',
        itens: [] 
      };
      acc.push(group);
    }
    group.itens.push(current);
    return acc;
  }, []);

  const getMesReferencia = (dataStr: string) => {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const d = new Date(dataStr);
    d.setMonth(d.getMonth() + 1);
    return `${meses[d.getMonth()]}/${d.getFullYear()}`;
  };

  const getTempoAberto = (dataStr: string) => {
    const d = new Date(dataStr);
    const diff = new Date().getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dias === 0 ? "Hoje" : `${dias}d`;
  };

  const handleFinalizar = async () => {
    const todosItensId = Array.from(new Set([...Object.keys(volumes), ...Object.keys(volumesExtra)]));
    const itensParaPedir = todosItensId.filter(id => (volumes[id] || 0) > 0 || (volumesExtra[id] || 0) > 0);
    
    if (itensParaPedir.length === 0) return toast.warning("Selecione quantidades antes de enviar.");
    
    const batchProtocol = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const payload = itensParaPedir.map(id => {
      const item = catalogo.find(c => String(c.id) === id);
      return {
        item_id: id,
        solicitante: user?.nome || user?.name || 'Comprador',
        unidade_destino: user?.unidade_alocacao || 'Unidade',
        secretaria_destino: user?.secretaria || 'SEMED',
        quantidade: volumes[id] || 0,
        quantidade_extra: volumesExtra[id] || 0,
        status: 'SOLICITADO',
        item_nome: item?.item || 'Item',
        unidade_medida: item?.unidade_medida || 'UN',
        protocolo: batchProtocol,
        tipo_item: item?.categoria || 'SUPRIMENTO',
        tipo_pedido: tipoPedido,
        data_solicitacao: new Date().toISOString(),
      };
    });

    try {
      await enviarRequisicao(payload);
      setVolumes({});
      setVolumesExtra({});
      setActiveTab("TRACKING");
      toast.success("Sua requisição foi enviada com sucesso!");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in pb-32 max-w-full px-4 lg:px-20 py-10">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border)] shadow-xl">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200 shadow-inner"><User size={32} /></div>
           <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] italic tracking-tight flex items-center gap-3">
                {user.name || user.nome || 'Setor Admin'} 
                <span className="text-[10px] not-italic font-black bg-[var(--brand)] text-white px-3 py-1 rounded-full uppercase tracking-widest">
                  {user.secretaria || user.unidade_alocacao || 'Unidade'}
                </span>
              </h2>
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1 flex items-center gap-2">
                <Package size={14} className="text-[var(--brand)]" /> {requisicoesRaw.length} Requisições Visíveis
              </p>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--border)] shadow-sm"
          >
            <Activity size={16} /> Centro de Relatórios
          </button>
        </div>
      </div>

      {/* MODAL DE RELATÓRIOS */}
      <AdaptiveModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Centro de Relatórios de Compras" width="600px">
        <div className="p-10 space-y-8">
          <p className="text-[11px] font-bold text-[var(--text-muted)] leading-relaxed bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border)]">
            Selecione os filtros abaixo para gerar um relatório consolidado de requisições. O sistema agrupará todos os itens aprovados e pendentes conforme o critério escolhido.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data Inicial</label>
              <input 
                type="date" 
                className="input-field w-full h-14 font-bold bg-white/10 dark:bg-white/5 pointer-events-auto relative z-20 focus:ring-2 focus:ring-orange-500"
                value={reportFilter.start}
                onChange={e => setReportFilter({...reportFilter, start: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data Final</label>
              <input 
                type="date" 
                className="input-field w-full h-14 font-bold bg-white/10 dark:bg-white/5 pointer-events-auto relative z-20 focus:ring-2 focus:ring-orange-500"
                value={reportFilter.end}
                onChange={e => setReportFilter({...reportFilter, end: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Protocolo Específico (Opcional)</label>
            <input 
              className="input-field w-full h-14 font-bold bg-white/10 dark:bg-white/5 pointer-events-auto relative z-20 focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: REQ-123456"
              value={reportFilter.protocol}
              onChange={e => setReportFilter({...reportFilter, protocol: e.target.value.toUpperCase()})}
            />
          </div>

          <button 
            onClick={() => {
              const filtered = requisicoesAgrupadas.filter(g => {
                const data = new Date(g.data_raw);
                const start = reportFilter.start ? new Date(reportFilter.start) : null;
                const end = reportFilter.end ? new Date(reportFilter.end) : null;
                
                const matchesDate = (!start || data >= start) && (!end || data <= end);
                const matchesProtocol = !reportFilter.protocol || g.protocolo.includes(reportFilter.protocol);
                
                return matchesDate && matchesProtocol;
              });

              if (filtered.length === 0) return toast.error("Nenhuma requisição encontrada para os filtros selecionados.");

              const printWindow = window.open('', '_blank');
              if (printWindow) {
                const html = `
                  <html>
                    <head>
                      <title>Relatório Consolidado de Compras</title>
                      <style>
                        @page { size: A4 portrait; margin: 12mm; }
                        body { font-family: 'Inter', sans-serif; padding: 0; color: #1a1a1a; line-height: 1.4; }
                        .header { border-bottom: 3px solid #ea580c; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
                        .logo span { color: #ea580c; }
                        .header-info { text-align: right; font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; }
                        .report-title { text-align: center; font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; padding: 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #eee; }
                        .summary { margin-bottom: 20px; font-size: 10px; font-weight: 700; padding: 10px; border-left: 4px solid #ea580c; background: #fffaf5; }
                        .req-block { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
                        .req-header { background: #1a1a1a; color: #fff; padding: 6px 15px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; }
                        .req-meta { padding: 8px 15px; font-size: 9px; background: #fafafa; border-bottom: 1px solid #eee; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 10px; }
                        table { width: 100%; border-collapse: collapse; }
                        th { background: #f4f4f4; text-align: left; padding: 8px 12px; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #ddd; font-weight: 800; }
                        td { padding: 8px 12px; font-size: 10px; border-bottom: 1px solid #eee; }
                        .total-row { background: #fff; font-weight: 800; text-align: right; padding: 8px 12px; font-size: 9px; text-transform: uppercase; color: #666; }
                        .integrity-box { margin-top: 40px; border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #fcfcfc; }
                        .integrity-title { font-size: 9px; font-weight: 900; color: #ea580c; margin-bottom: 5px; text-transform: uppercase; }
                        .integrity-text { font-size: 8.5px; line-height: 1.5; color: #444; font-style: italic; }
                        .footer { position: fixed; bottom: 10mm; left: 12mm; right: 12mm; font-size: 8px; text-align: center; color: #aaa; border-top: 1px solid #eee; pt: 5px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="logo">ALICERCE <span>ERP</span></div>
                        <div class="header-info">EMISSÃO: ${new Date().toLocaleString()} | RELATÓRIO GERENCIAL</div>
                      </div>

                      <div class="report-title">Relatório Consolidado de Requisições</div>
                      
                      <div class="summary">
                        FILTRO: ${reportFilter.start || 'INÍCIO'} ➔ ${reportFilter.end || 'FIM'}<br>
                        TOTAL DE REQUISIÇÕES LOCALIZADAS: ${filtered.length}
                      </div>

                      ${filtered.map(g => `
                        <div class="req-block">
                          <div class="req-header">
                            <span>PROT: ${g.protocolo}</span>
                            <span>DATA: ${g.data}</span>
                          </div>
                          <div class="req-meta" style="grid-template-cols: 1fr 1fr 1fr 1fr; font-weight: bold;">
                            <div><strong>UNIDADE:</strong> ${g.itens[0]?.unidade_destino || 'N/A'}</div>
                            <div><strong>SECRETARIA:</strong> ${g.itens[0]?.secretaria_destino || 'SEMED'}</div>
                            <div><strong>SOLICITANTE:</strong> ${g.itens[0]?.solicitante || 'N/A'}</div>
                            <div><strong>REF:</strong> ${(() => {
                              const d = new Date(g.itens[0]?.data_solicitacao);
                              d.setMonth(d.getMonth() + 1);
                              return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                            })()}</div>
                          </div>
                          <table>
                            <thead>
                              <tr>
                                <th>Item / Descrição</th>
                                <th style="text-align: center; width: 60px;">Qtd</th>
                                <th style="text-align: center; width: 60px;">Und</th>
                                <th style="text-align: center; width: 100px;">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${g.itens.map((it:any) => `
                                <tr>
                                  <td style="font-weight: 700;">${it.item_nome}</td>
                                  <td style="text-align: center; font-weight: 800;">${(it.quantidade || 0) + (it.quantidade_extra || 0)}</td>
                                  <td style="text-align: center;">${it.unidade_medida || 'UN'}</td>
                                  <td style="text-align: center; color: #ea580c; font-weight: 800; font-size: 9px;">${it.status}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div class="total-row">Total de itens: ${g.itens.length} | DATA PEDIDO: ${g.data}</div>
                        </div>
                      `).join('')}

                      <div class="integrity-box">
                        <div class="integrity-title">Certificação de Integridade Alicerce ERP:</div>
                        <div class="integrity-text">
                          Este documento foi gerado e auditado automaticamente pelo ecossistema Alicerce ERP. As informações aqui contidas refletem dados oficiais consolidados em tempo real, assegurando máxima transparência, agilidade e segurança institucional. Todas as operações logísticas são protegidas por logs de auditoria contínua e rotinas de redundância com backups diários, garantindo a total rastreabilidade e integridade jurídica das informações apresentadas.
                        </div>
                      </div>

                      <div class="footer">Alicerce ERP - Módulo de Gestão de Compras | Impresso por ${user.nome || user.name}</div>

                      <script>window.onload = () => { window.print(); };</script>
                    </body>
                  </html>
                `;
                printWindow.document.write(html);
                printWindow.document.close();
              }
            }}
            className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
          >
            <Printer size={18} /> Gerar Relatório Consolidado
          </button>
        </div>
      </AdaptiveModal>

      <div className="flex flex-col gap-8">
        {activeTab === "CATALOGO" ? (
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden animate-fade-in">
              <div className="p-10 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-base)]/5">
                 <div>
                    <h3 className="text-xl font-black uppercase italic">Solicitação de Materiais</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Selecione os itens e quantidades limitados pelo coeficiente</p>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[var(--border)] shadow-sm">
                       <button onClick={() => setTipoPedido("MENSAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedido === 'MENSAL' ? 'bg-blue-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-blue-50'}`}>Mensal</button>
                       <button onClick={() => setTipoPedido("EMERGENCIAL")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoPedido === 'EMERGENCIAL' ? 'bg-red-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:bg-red-50'}`}>Emergencial</button>
                    </div>
                    <button onClick={handleFinalizar} disabled={loading} className="h-14 px-10 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30">
                       <Send size={18} /> Enviar Requisição
                    </button>
                 </div>
              </div>
              <CatalogoTable catalogo={catalogo} qtdAsg={qtdAsg} volumes={volumes} setVolumes={setVolumes} volumesExtra={volumesExtra} setVolumesExtra={setVolumesExtra} />
          </div>
        ) : (
          <TrackingTable requisicoesAgrupadas={requisicoesAgrupadas} getMesReferencia={getMesReferencia} getTempoAberto={getTempoAberto} onSelect={setSelectedProtocol} />
        )}
      </div>

      <AdaptiveModal isOpen={!!selectedProtocol} onClose={() => setSelectedProtocol(null)} title="Detalhamento da Requisição" width="1200px">
          {/* Modal content from original ComprasModule */}
          <div className="p-10 space-y-8">
             <div className="flex justify-between border-b border-[var(--border)] pb-8 items-center">
                <div>
                   <h4 className="text-2xl font-black italic">Protocolo {selectedProtocol?.protocolo}</h4>
                   <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Solicitado em: {selectedProtocol?.data}</p>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => {
                      const g = selectedProtocol;
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        const html = `
                          <html>
                            <head>
                              <title>Acompanhamento de Entrega - ${g.protocolo}</title>
                              <style>
                                @page { size: A4 portrait; margin: 12mm; }
                                body { font-family: sans-serif; padding: 0; color: #1a1a1a; line-height: 1.4; }
                                .header { border-bottom: 3px solid #ea580c; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                                .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
                                .logo span { color: #ea580c; }
                                .header-info { text-align: right; font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; }
                                .title { text-align: center; font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; padding: 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #eee; }
                                .meta-grid { display: grid; grid-template-cols: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 25px; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fafafa; }
                                .meta-item { font-size: 9px; }
                                .meta-label { font-weight: 900; text-transform: uppercase; color: #999; font-size: 8px; margin-bottom: 2px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                th { background: #f4f4f4; text-align: left; padding: 8px 12px; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #ddd; font-weight: 800; }
                                td { padding: 10px 12px; font-size: 10px; border-bottom: 1px solid #eee; }
                                .integrity-box { margin-top: 40px; border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #fcfcfc; }
                                .integrity-title { font-size: 9px; font-weight: 900; color: #ea580c; margin-bottom: 5px; text-transform: uppercase; }
                                .integrity-text { font-size: 8.5px; line-height: 1.5; color: #444; font-style: italic; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="logo">ALICERCE <span>ERP</span></div>
                                <div class="header-info">PROT: ${g.protocolo} | EVOLUÇÃO LOGÍSTICA</div>
                              </div>
                              <div class="title">Relatório de Evolução de Entrega</div>
                              <div class="meta-grid">
                                <div class="meta-item"><div class="meta-label">Unidade</div><strong>${g.itens[0]?.unidade_destino}</strong></div>
                                <div class="meta-item"><div class="meta-label">Secretaria</div><strong>${g.itens[0]?.secretaria_destino}</strong></div>
                                <div class="meta-item"><div class="meta-label">Mês Ref.</div><strong>${(() => {
                                  const d = new Date(g.itens[0]?.data_solicitacao);
                                  d.setMonth(d.getMonth() + 1);
                                  return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                                })()}</strong></div>
                                <div class="meta-item"><div class="meta-label">Solicitante</div><strong>${g.itens[0]?.solicitante}</strong></div>
                              </div>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Item / Descrição</th>
                                    <th style="text-align: center; width: 70px;">Ped</th>
                                    <th style="text-align: center; width: 70px;">Entr</th>
                                    <th style="text-align: center; width: 70px;">%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${g.itens.map((it:any) => {
                                    const total = (it.quantidade || 0) + (it.quantidade_extra || 0);
                                    const entregue = it.quantidade_entregue || 0;
                                    const perc = Math.min(100, Math.round((entregue / total) * 100));
                                    return `
                                      <tr>
                                        <td style="font-weight: 700;">${it.item_nome}</td>
                                        <td style="text-align: center; font-weight: 700;">${total}</td>
                                        <td style="text-align: center; color: #16a34a; font-weight: 800;">${entregue}</td>
                                        <td style="text-align: center; font-weight: 900;">${perc}%</td>
                                      </tr>
                                    `;
                                  }).join('')}
                                </tbody>
                              </table>

                              <div style="margin-top: 15px; font-size: 8.5px; color: #666; font-weight: bold;">DATA SOLICITAÇÃO: ${g.data}</div>

                              <div class="integrity-box">
                                <div class="integrity-title">Certificação de Integridade Alicerce ERP:</div>
                                <div class="integrity-text">
                                  Este documento foi gerado e auditado automaticamente pelo ecossistema Alicerce ERP. As informações aqui contidas refletem dados oficiais consolidados em tempo real, assegurando máxima transparência, agilidade e segurança institucional. Todas as operações logísticas são protegidas por logs de auditoria contínua e rotinas de redundância com backups diários, garantindo a total rastreabilidade e integridade jurídica das informações apresentadas.
                                </div>
                              </div>
                              <script>window.onload = () => { window.print(); };</script>
                            </body>
                          </html>
                        `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                      }
                    }}
                    className="px-6 py-3 bg-[var(--bg-base)] text-[var(--text-primary)] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[var(--brand)] hover:text-white transition-all border border-[var(--border)] shadow-sm"
                  >
                    <Printer size={16} /> Imprimir Acompanhamento
                  </button>
                  <button 
                    onClick={() => {
                      const g = selectedProtocol;
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        const html = `
                          <html>
                            <head>
                              <title>Requisição ${g.protocolo}</title>
                              <style>
                                @page { size: A4 portrait; margin: 12mm; }
                                body { font-family: sans-serif; padding: 0; color: #1a1a1a; line-height: 1.4; }
                                .header { border-bottom: 3px solid #ea580c; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
                                .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
                                .logo span { color: #ea580c; }
                                .header-info { text-align: right; font-size: 9px; font-weight: 700; color: #666; text-transform: uppercase; }
                                .title { text-align: center; font-size: 14px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; padding: 8px; background: #f8f8f8; border-radius: 4px; border: 1px solid #eee; }
                                .meta-grid { display: grid; grid-template-cols: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 25px; padding: 12px; border: 1px solid #eee; border-radius: 8px; background: #fafafa; }
                                .meta-item { font-size: 9px; }
                                .meta-label { font-weight: 900; text-transform: uppercase; color: #999; font-size: 8px; margin-bottom: 2px; }
                                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                                th { background: #f4f4f4; text-align: left; padding: 8px 12px; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #ddd; font-weight: 800; }
                                td { padding: 10px 12px; font-size: 10px; border-bottom: 1px solid #eee; }
                                .integrity-box { margin-top: 40px; border: 1px solid #ddd; padding: 15px; border-radius: 6px; background: #fcfcfc; }
                                .integrity-title { font-size: 9px; font-weight: 900; color: #ea580c; margin-bottom: 5px; text-transform: uppercase; }
                                .integrity-text { font-size: 8.5px; line-height: 1.5; color: #444; font-style: italic; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="logo">ALICERCE <span>ERP</span></div>
                                <div class="header-info">PROT: ${g.protocolo} | REQUISIÇÃO OFICIAL</div>
                              </div>

                              <div class="title">Requisição de Materiais (${g.tipo_pedido})</div>

                              <div class="meta-grid">
                                <div class="meta-item"><div class="meta-label">Unidade</div><strong>${g.itens[0]?.unidade_destino}</strong></div>
                                <div class="meta-item"><div class="meta-label">Secretaria</div><strong>${g.itens[0]?.secretaria_destino}</strong></div>
                                <div class="meta-item"><div class="meta-label">Mês Ref.</div><strong>${(() => {
                                  const d = new Date(g.itens[0]?.data_solicitacao);
                                  d.setMonth(d.getMonth() + 1);
                                  return d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
                                })()}</strong></div>
                                <div class="meta-item"><div class="meta-label">Solicitante</div><strong>${g.itens[0]?.solicitante}</strong></div>
                              </div>

                              <table>
                                <thead>
                                  <tr>
                                    <th>Item / Descrição</th>
                                    <th style="text-align: center; width: 70px;">Qtd</th>
                                    <th style="text-align: center; width: 70px;">Und</th>
                                    <th style="text-align: center; width: 100px;">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${g.itens.map((it:any) => `
                                    <tr>
                                      <td style="font-weight: 700;">${it.item_nome}</td>
                                      <td style="text-align: center; font-weight: 800;">${(it.quantidade || 0) + (it.quantidade_extra || 0)}</td>
                                      <td style="text-align: center;">${it.unidade_medida || 'UN'}</td>
                                      <td style="text-align: center; font-size: 9px; font-weight: 800; color: #ea580c;">${it.status}</td>
                                    </tr>
                                  `).join('')}
                                </tbody>
                              </table>

                              <div style="margin-top: 15px; font-size: 8.5px; color: #666; font-weight: bold;">DATA SOLICITAÇÃO: ${g.data}</div>

                              <div class="integrity-box">
                                <div class="integrity-title">Certificação de Integridade Alicerce ERP:</div>
                                <div class="integrity-text">
                                  Este documento foi gerado e auditado automaticamente pelo ecossistema Alicerce ERP. As informações aqui contidas refletem dados oficiais consolidados em tempo real, assegurando máxima transparência, agilidade e segurança institucional. Todas as operações logísticas são protegidas por logs de auditoria contínua e rotinas de redundância com backups diários, garantindo a total rastreabilidade e integridade jurídica das informações apresentadas.
                                </div>
                              </div>

                              <script>window.onload = () => { window.print(); };</script>
                            </body>
                          </html>
                        `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                      }
                    }}
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-orange-600/30"
                  >
                    <Printer size={16} /> Imprimir Requisição
                  </button>
                </div>
             </div>
             <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                   <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
                      <tr>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Produto</th>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Solicitado</th>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Entregue</th>
                         <th className="p-10 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] text-center">Evolução</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[var(--border)]">
                      {selectedProtocol?.itens.map((it: any, idx: number) => {
                         const total = (it.quantidade || 0) + (it.quantidade_extra || 0);
                         const entregue = it.quantidade_entregue || 0;
                         const percentual = Math.min(100, Math.round((entregue / total) * 100));
                         
                         return (
                          <tr key={idx} className="hover:bg-[var(--bg-base)]/30 transition-all">
                             <td className="px-10 py-8">
                                <div className="text-xs font-black">{it.item_nome}</div>
                                <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase mt-1">Status: {it.status}</div>
                             </td>
                             <td className="px-10 py-8 text-center text-xs font-black">{total} {it.unidade_medida}</td>
                             <td className="px-10 py-8 text-center text-xs font-black text-green-600">{entregue} {it.unidade_medida}</td>
                             <td className="px-10 py-8 text-center w-[250px]">
                                <div className="flex flex-col gap-2">
                                   <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                      <span>{percentual}% Concluído</span>
                                      <span className={percentual === 100 ? 'text-green-600' : 'text-orange-600'}>
                                        {entregue}/{total}
                                      </span>
                                   </div>
                                   <div className="w-full h-2.5 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)] shadow-inner">
                                      <div 
                                        className={`h-full transition-all duration-1000 ${percentual === 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                        style={{ width: `${percentual}%` }}
                                      />
                                   </div>
                                </div>
                             </td>
                          </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
      </AdaptiveModal>
    </div>
  );
}
