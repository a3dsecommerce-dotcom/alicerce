"use client";
import { useState } from "react";
import { 
  Search, FileText, Loader, Briefcase, UserPlus, CheckCircle
} from "lucide-react";
import { useRHData } from "./rh/useRHData";
import ColaboradoresTable from "./rh/ColaboradoresTable";
import TalentosGrid from "./rh/TalentosGrid";
import AdmissaoModals from "./rh/AdmissaoModals";
import FichaColaborador360 from "../FichaColaborador360";
import TableSkeleton from "@/components/ui/TableSkeleton";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

type MasterTab = "DP" | "DOCS";

export default function RHModule({ user }: { user: any }) {
  const { loading, colaboradores, candidatos, updateStatus, finalizarAdmissao, refresh } = useRHData(user);
  
  const [masterTab, setMasterTab] = useState<MasterTab>("DP");
  const [dpAba, setDpAba] = useState<"ativos" | "talentos" | "contratacao" | "arquivo">("ativos");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [selecionado, setSelecionado] = useState<any>(null);
  
  // Estados de Modais (Passados para subcomponentes)
  const [modalAdmissao, setModalAdmissao] = useState<any>(null);
  const [admissaoForm, setAdmissaoForm] = useState({ secretaria: "", unidade: "", cargo: "", data: new Date().toISOString().split('T')[0] });
  const [modalAfastamento, setModalAfastamento] = useState<any>(null);
  const [afastamentoData, setAfastamentoData] = useState({ motivo: "", tempo: "" });

  const filtradosDP = colaboradores.filter(c => {
    if (dpAba === "arquivo") return c.status === "DESLIGADO";
    if (dpAba === "ativos") return c.status !== "DESLIGADO";
    return true;
  }).filter(c =>
    (filtro === "TODOS" || c.status === filtro) &&
    (
      (c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()) || 
      (c.unidade || "").toLowerCase().includes((busca || "").toLowerCase())
    )
  );

  const handleGerarPDFHistorico = (colab: any) => {
    const doc = new jsPDF();
    doc.text("Relatório Histórico", 14, 22);
    autoTable(doc, {
      startY: 40,
      head: [['Campo', 'Informação']],
      body: [
        ['Nome', colab.nome], ['CPF', colab.cpf], ['Cargo', colab.cargo],
        ['Unidade', colab.unidade], ['Status', colab.status], ['Admissão', colab.admissao]
      ],
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }
    });
    doc.save(`historico_${colab.nome.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUpdateStatusWrapper = async (id: string, status: string) => {
    try {
      if (status === 'AFASTADO') {
        setModalAfastamento({ id, status });
      } else {
        await updateStatus(id, status);
        toast.success("Status atualizado com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAdmissaoWrapper = async () => {
    try {
      await finalizarAdmissao(modalAdmissao, admissaoForm);
      setModalAdmissao(null);
      setDpAba("ativos");
      toast.success("Colaborador admitido oficialmente!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleConfirmarAfastamento = async () => {
    const { error } = await supabase.from('usuarios').update({ 
       status: 'AFASTADO',
       metadados: { motivo_afastamento: afastamentoData.motivo, tempo_afastamento: afastamentoData.tempo, data_afastamento: new Date().toISOString() }
    }).eq('id', modalAfastamento.id);
    if (!error) {
       setModalAfastamento(null);
       refresh();
       toast.warning("Afastamento registrado no sistema.");
    }
  };

  if (loading) return (
    <div className="p-20">
      <TableSkeleton rows={8} cols={5} />
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      <div className="flex flex-col gap-6">
        <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">RH Master & Gestão Administrativa</h2>
        <div className="flex flex-wrap gap-8 border-b border-[var(--border)] pb-4">
          {[
            { id: "DP", label: "Dep. Pessoal (DP)", icon: Briefcase },
            { id: "DOCS", label: "Documentos", icon: FileText }
          ].map((t: any) => (
            <button key={t.id} onClick={() => setMasterTab(t.id as any)} className={`flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] pb-3 transition-all relative ${masterTab === t.id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
              <t.icon size={16} /> {t.label}
              {masterTab === t.id && <div className="absolute bottom-[-2px] left-0 w-full h-[3px] bg-[var(--brand)] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-8">
        {masterTab === "DP" && (
          <div className="flex flex-col gap-8 flex-1 overflow-hidden animate-fade-in">
             <div className="flex gap-6 bg-[var(--bg-base)]/30 p-1.5 rounded-2xl w-fit border border-[var(--border)]/50">
                {[
                  { id: "ativos", label: "Ativos", count: colaboradores.filter(c => c.status !== 'DESLIGADO').length },
                  { id: "talentos", label: "Talentos", count: candidatos.filter(c => c.status_candidato !== 'CONTRATADO').length },
                  { id: "contratacao", label: "Admitidos", count: candidatos.filter(c => c.status_candidato === 'CONTRATADO').length },
                  { id: "arquivo", label: "Arquivo", count: colaboradores.filter(c => c.status === 'DESLIGADO').length }
                ].map((t: any) => (
                  <button key={t.id} onClick={() => setDpAba(t.id)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dpAba === t.id ? 'bg-[var(--brand)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>{t.label} ({t.count})</button>
                ))}
             </div>

             <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] shadow-2xl flex-1 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-[var(--border)] flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="relative flex-1 w-full max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                      <input className="input-field w-full pl-12" placeholder="Buscar no DP..." value={busca} onChange={e => setBusca(e.target.value)} />
                   </div>
                   <div className="flex gap-2 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      {["TODOS", "ATIVO", "AFASTADO", "INATIVO"].map(f => (
                        <button key={f} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setFiltro(f)}>{f}</button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar p-8">
                   {(dpAba === "ativos" || dpAba === "arquivo") ? (
                      <ColaboradoresTable colaboradores={filtradosDP} dpAba={dpAba} onSelect={setSelecionado} onUpdateStatus={handleUpdateStatusWrapper} onGerarPDF={handleGerarPDFHistorico} />
                   ) : dpAba === "talentos" ? (
                      <TalentosGrid candidatos={candidatos.filter(c => c.status_candidato !== 'CONTRATADO')} onAdmitir={(c) => { setAdmissaoForm({...admissaoForm, cargo: c.cargo_pretendido || c.cargo || ""}); setModalAdmissao(c); }} />
                   ) : (
                      <div className="flex flex-col items-center justify-center p-20 opacity-50"><CheckCircle size={48} className="mb-4 text-green-500" /><p className="text-xs font-black uppercase tracking-widest">Processo Finalizado</p></div>
                   )}
                </div>
             </div>
          </div>
        )}
      </div>

      <AdmissaoModals 
        modalAdmissao={modalAdmissao} setModalAdmissao={setModalAdmissao} 
        admissaoForm={admissaoForm} setAdmissaoForm={setAdmissaoForm} onAdmissaoFinal={handleAdmissaoWrapper}
        modalAfastamento={modalAfastamento} setModalAfastamento={setModalAfastamento}
        afastamentoData={afastamentoData} setAfastamentoData={setAfastamentoData} onConfirmarAfastamento={handleConfirmarAfastamento}
      />

      <FichaColaborador360 colabId={selecionado?.id} isOpen={!!selecionado} onClose={() => setSelecionado(null)} canEdit={true} restrictLevel={user.nivel < 3} />
    </div>
  );
}
