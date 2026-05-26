"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Search, FileText, CheckCircle, Clock, Printer, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

export default function AdvertenciasList({ user }: { user?: any }) {
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [selecionado, setSelecionado] = useState<any>(null);

  useEffect(() => {
    fetchProcessos();
  }, []);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('processos_disciplinares')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProcessos(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    const { error } = await supabase
      .from('processos_disciplinares')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      toast.success("Status atualizado!");
      fetchProcessos();
      setSelecionado(null);
    } else {
      toast.error("Erro ao atualizar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("TEM CERTEZA ABSOLUTA? Esta ação irá excluir permanentemente este registro de advertência.")) return;

    const { error } = await supabase
      .from('processos_disciplinares')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success("Registro excluído com sucesso!");
      fetchProcessos();
      setSelecionado(null);
    } else {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const filtrados = processos.filter(p => {
    if (filtro !== "TODOS" && p.status !== filtro) return false;
    if (busca && !p.colaborador_nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const handleGerarPDFIndividual = async (data: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ALICERCE", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text("REGISTRO DE MEDIDA DISCIPLINAR", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("DOCUMENTO INTERNO PARA CONTROLE DE RECURSOS HUMANOS", pageWidth / 2, 32, { align: "center" });
    doc.line(15, 38, pageWidth - 15, 38);

    // Identificação
    autoTable(doc, {
      startY: 45,
      head: [['1. IDENTIFICAÇÃO DO COLABORADOR', '']],
      body: [
        ['NOME COMPLETO:', data.colaborador_nome],
        ['CPF:', data.colaborador_cpf || 'NÃO INFORMADO'],
        ['CARGO / FUNÇÃO:', data.colaborador_cargo],
        ['UNIDADE / SETOR:', data.unidade_alocada],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Detalhes da Ocorrência
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['2. DETALHES DA OCORRÊNCIA', '']],
      body: [
        ['DATA DA OCORRÊNCIA:', new Date(data.data_ocorrencia).toLocaleDateString('pt-BR')],
        ['CATEGORIA:', data.categoria_motivo.replace('_', ' ')],
        ['MOTIVO RESUMIDO:', data.descricao_motivo],
        ['NÍVEL DE ADVERTÊNCIA:', data.nivel_sugerido_encarregado.replace('_', ' ')],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Narrativa
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['3. DESCRIÇÃO DOS FATOS']],
      body: [
        [{ content: data.detalhes_ocorrencia, styles: { halign: 'justify', minCellHeight: 40 } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    if (data.testemunhas) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [['4. TESTEMUNHAS (SE HOUVER)', '']],
        body: [
          ['NOMES:', data.testemunhas],
        ],
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 }
      });
    }

    // Assinaturas
    const finalY = (doc as any).lastAutoTable.finalY + 40;
    
    doc.line(20, finalY, 90, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.colaborador_nome.toUpperCase(), 55, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Assinatura do Colaborador", 55, finalY + 10, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Data: ____/____/________`, 55, finalY + 16, { align: "center" });
    
    doc.line(120, finalY, 190, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.encarregado_solicitante_nome?.toUpperCase() || "GESTOR RESPONSÁVEL", 155, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Encarregado / Gerente Responsável", 155, finalY + 10, { align: "center" });

    doc.setFontSize(7);
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')} pelo Alicerce ERP`, 15, 285);

    doc.save(`Advertencia_${data.colaborador_nome.replace(/\s+/g, '_')}_${data.data_ocorrencia}.pdf`);
  };

  const handleGerarRelatorioGeral = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE ADVERTÊNCIAS", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Filtros Aplicados: Busca: "${busca || 'Todas'}" | Status: ${filtro}`, 14, 30);
    doc.text(`Total de Registros: ${filtrados.length}`, 14, 36);

    const tableData = filtrados.map(p => [
      new Date(p.data_ocorrencia).toLocaleDateString('pt-BR'),
      p.colaborador_nome,
      p.unidade_alocada,
      p.categoria_motivo.replace('_', ' '),
      p.nivel_sugerido_encarregado,
      p.status.replace('_', ' ')
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Data', 'Colaborador', 'Unidade', 'Categoria', 'Punição Sugerida', 'Status Atual']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] }, // orange-600
      styles: { fontSize: 8 }
    });

    doc.save(`Relatorio_Advertencias_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in h-full">
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-2xl flex-1 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input 
              className="input-field w-full pl-12" 
              placeholder="Buscar por colaborador..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
            {["TODOS", "PENDENTE_GERENCIA", "PENDENTE_RH", "APROVADO_RH", "REJEITADO"].map(f => (
              <button 
                key={f} 
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-orange-600 text-white' : 'text-[var(--text-muted)]'}`} 
                onClick={() => setFiltro(f)}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
          <button 
            onClick={handleGerarRelatorioGeral}
            className="h-12 px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={14} /> Relatório PDF
          </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-8">
          {loading ? (
            <div className="text-center p-10 text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center p-10 text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest italic border-2 border-dashed border-[var(--border)] rounded-2xl">
              Nenhuma advertência encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtrados.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-orange-500 transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black text-[var(--text-primary)]">{p.colaborador_nome}</h4>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">
                        {p.colaborador_cargo} • {p.unidade_alocada}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      p.status === 'PENDENTE_GERENCIA' ? 'bg-orange-100 text-orange-700' : 
                      p.status === 'PENDENTE_RH' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'APROVADO_RH' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-700 uppercase tracking-widest">
                      <ShieldAlert size={14} /> {p.categoria_motivo.replace('_', ' ')}
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">{p.descricao_motivo}</p>
                    <div className="text-[9px] font-bold text-[var(--text-muted)] mt-2 uppercase flex items-center justify-between">
                      <span>Data: {new Date(p.data_ocorrencia).toLocaleDateString()}</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded">Sugerido: {p.nivel_sugerido_encarregado}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelecionado(p)}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                  >
                    Analisar Processo
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdaptiveModal isOpen={!!selecionado} onClose={() => setSelecionado(null)} title="Análise de Medida Disciplinar">
        <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {selecionado && (
            <>
              <div className="flex items-center gap-6 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h4 className="text-base font-black text-orange-900 uppercase">{selecionado.colaborador_nome}</h4>
                  <p className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">
                    {selecionado.colaborador_cargo} • {selecionado.unidade_alocada}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Categoria da Ocorrência</p>
                  <p className="text-xs font-black uppercase text-[var(--text-primary)]">{selecionado.categoria_motivo.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1">Punição Sugerida</p>
                  <p className="text-xs font-black uppercase text-orange-600">{selecionado.nivel_sugerido_encarregado.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase text-[var(--brand)] flex items-center gap-2 italic">
                  <FileText size={14} /> Narrativa da Ocorrência
                </h5>
                <div className="p-6 bg-white border border-[var(--border)] rounded-2xl">
                  <p className="text-xs font-medium text-[var(--text-primary)] leading-relaxed">{selecionado.detalhes_ocorrencia}</p>
                </div>
              </div>

              {selecionado.testemunhas && (
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase text-[var(--brand)] italic">Testemunhas</h5>
                  <div className="p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">{selecionado.testemunhas}</p>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-[var(--border)] flex flex-wrap gap-4">
                <button 
                  onClick={() => handleGerarPDFIndividual(selecionado)}
                  className="flex-1 py-4 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selecionado.id, 'APROVADO_RH')}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Aprovar / Ciente RH
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selecionado.id, 'REJEITADO')}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                >
                  Rejeitar / Cancelar
                </button>
                
                {user?.nivel >= 3 && (
                  <button 
                    onClick={() => handleDelete(selecionado.id)}
                    className="flex-none px-6 py-4 bg-red-100 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-200 transition-all flex items-center justify-center gap-2 border border-red-200"
                    title="Excluir Registro Permanentemente"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </AdaptiveModal>
    </div>
  );
}
