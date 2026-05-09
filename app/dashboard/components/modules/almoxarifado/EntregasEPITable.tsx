"use client";
import { Clock, User, Package, Printer, Calendar, Filter } from "lucide-react";

interface EntregasEPITableProps {
  requisicoes: any[];
  busca: string;
  calcularDias: (d: string) => string;
  filtroData: "MES" | "ANO" | "SEMESTRE" | "TUDO" | "CUSTOM";
  setFiltroData: (v: "MES" | "ANO" | "SEMESTRE" | "TUDO" | "CUSTOM") => void;
  dataInicio: string;
  setDataInicio: (v: string) => void;
  dataFim: string;
  setDataFim: (v: string) => void;
}

export default function EntregasEPITable({ 
  requisicoes, busca, calcularDias, filtroData, setFiltroData, dataInicio, setDataInicio, dataFim, setDataFim 
}: EntregasEPITableProps) {
  
  const filtrarPorData = (data: string) => {
    const d = new Date(data);
    const hoje = new Date();
    
    if (filtroData === "MES") {
      return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    }
    if (filtroData === "ANO") {
      return d.getFullYear() === hoje.getFullYear();
    }
    if (filtroData === "SEMESTRE") {
      const isPrimeiroSemestre = hoje.getMonth() < 6;
      const dMes = d.getMonth();
      return d.getFullYear() === hoje.getFullYear() && (isPrimeiroSemestre ? dMes < 6 : dMes >= 6);
    }
    if (filtroData === "CUSTOM") {
      if (!dataInicio || !dataFim) return true;
      const start = new Date(dataInicio);
      const end = new Date(dataFim);
      end.setHours(23, 59, 59);
      return d >= start && d <= end;
    }
    return true;
  };

  // Filtra apenas entregas de EPI que já foram concluídas e obedecem ao período
  const entregas = requisicoes.filter(r => 
    r.tipo_item === 'EPI' && 
    r.status === 'ENTREGUE' &&
    filtrarPorData(r.data_entrega || r.data_solicitacao) &&
    (r.protocolo?.toLowerCase().includes(busca.toLowerCase()) || 
     r.item_nome?.toLowerCase().includes(busca.toLowerCase()) ||
     r.solicitante?.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleGerarRelatorio = () => {
    const win = window.open('', '_blank');
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Relatório de Movimentação de EPI</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: sans-serif; color: #333; line-height: 1.4; padding: 20px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .logo { font-size: 24px; font-weight: 900; }
            .logo span { color: #ea580c; }
            .title { text-align: center; font-size: 18px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; background: #f4f4f4; padding: 10px; border: 1px solid #ddd; }
            .periodo { font-size: 10px; font-weight: bold; color: #666; margin-bottom: 15px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #000; color: #fff; text-align: left; padding: 8px 12px; font-size: 10px; text-transform: uppercase; }
            td { padding: 10px 12px; font-size: 10px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 40px; font-size: 8px; color: #999; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ALICERCE <span>ERP</span></div>
            <div>SISTEMA DE GESTÃO DE EPI - NR-06</div>
          </div>
          <div class="title">Relatório Consolidado de Entregas de EPI</div>
          <div class="periodo">Filtro Aplicado: ${filtroData} ${filtroData === 'CUSTOM' ? `(${dataInicio} até ${dataFim})` : ''} | Total de Registros: ${entregas.length}</div>
          <table>
            <thead>
              <tr>
                <th>Data Entrega</th>
                <th>Colaborador</th>
                <th>Material / Descrição</th>
                <th>Quantidade</th>
                <th>Protocolo</th>
                <th>Recebedor</th>
              </tr>
            </thead>
            <tbody>
              ${entregas.map(e => `
                <tr>
                  <td>${new Date(e.data_entrega || e.data_solicitacao).toLocaleDateString('pt-BR')}</td>
                  <td><strong>${e.solicitante}</strong></td>
                  <td>${e.item_nome}</td>
                  <td>${e.quantidade_entregue || e.quantidade} ${e.unidade_medida || 'UN'}</td>
                  <td>${e.protocolo}</td>
                  <td>${e.recebedor_nome || 'AUTO-ASSINADO'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <span>Alicerce ERP v5.0 - Módulo Almoxarifado Central</span>
            <span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span>
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* FILTROS DE PERÍODO */}
      <div className="p-6 border-b border-[var(--border)] bg-slate-50/50 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border border-[var(--border)] text-slate-400">
            <Filter size={16} />
          </div>
          <div className="flex gap-2 p-1 bg-white rounded-xl border border-[var(--border)] shadow-sm">
            {[
              { id: "TUDO", label: "Tudo" },
              { id: "MES", label: "Este Mês" },
              { id: "SEMESTRE", label: "Semestre" },
              { id: "ANO", label: "Este Ano" },
              { id: "CUSTOM", label: "Personalizado" },
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setFiltroData(f.id as any)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filtroData === f.id ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtroData === "CUSTOM" && (
          <div className="flex items-center gap-2 animate-fade-in">
             <input type="date" className="input-field !h-10 !text-[10px] !w-36" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
             <span className="text-[10px] font-black text-slate-400">ATÉ</span>
             <input type="date" className="input-field !h-10 !text-[10px] !w-36" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          </div>
        )}

        <button 
          onClick={handleGerarRelatorio}
          disabled={entregas.length === 0}
          className="h-12 px-6 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg disabled:opacity-30 disabled:hover:scale-100"
        >
          <Printer size={16} /> Gerar Relatório PDF
        </button>
      </div>

      <div className="overflow-x-auto flex-1 scrollbar-thin">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-base)]/50 border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center w-[120px]">Data</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-left">Colaborador / Item</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[100px]">Qtd</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[150px]">Protocolo</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center w-[120px]">Recebedor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {entregas.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic">
                  Nenhum registro encontrado para este período
                </td>
              </tr>
            ) : (
              entregas.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-600">{new Date(e.data_entrega || e.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={10} className="text-orange-500" />
                        <span className="text-[8px] font-bold text-orange-500 uppercase">{calcularDias(e.data_solicitacao)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:scale-110 transition-all">
                        <User size={18}/>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{e.solicitante}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-[8px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{e.item_nome}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-black text-blue-600">{e.quantidade_entregue || e.quantidade} {e.unidade_medida || 'UN'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{e.protocolo}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-green-600">{e.recebedor_nome || 'AUTO-ASSINADO'}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase">Confirmado</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
