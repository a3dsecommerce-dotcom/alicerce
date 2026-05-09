"use client";
import { useState } from "react";
import { ArrowUpRight, CheckCircle, XCircle, Archive, MessageSquare, MapPin, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface TransferenciasListProps {
  transferencias: any[];
  onAction: (id: string, decisao: 'ACEITO' | 'RECUSADO' | 'ARQUIVADO', justificativa: string) => void;
}

export default function TransferenciasList({ transferencias, onAction }: TransferenciasListProps) {
  const [modalAnalise, setModalAnalise] = useState<any>(null);
  const [justificativa, setJustificativa] = useState("");
  const [decisao, setDecisao] = useState<'ACEITO' | 'RECUSADO' | 'ARQUIVADO'>('ACEITO');

  const handleConfirmar = () => {
    if (!justificativa && decisao !== 'ARQUIVADO') {
      alert("A justificativa é obrigatória!");
      return;
    }
    onAction(modalAnalise.id, decisao, justificativa);
    setModalAnalise(null);
    setJustificativa("");
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-3xl border border-[var(--border)]">
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)] uppercase italic">Solicitações de Transferência</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Análise de movimentação de pessoal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {transferencias.map((t) => (
          <div key={t.id} className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border)] p-8 flex flex-col gap-6 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)] uppercase">{t.colaborador_nome}</p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Solicitado em {format(new Date(t.created_at), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Pendente</span>
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">Trajeto Pretendido</p>
                  <div className="flex items-center gap-3">
                     <div className="text-[10px] font-black text-[var(--text-secondary)]">{t.unidade_origem}</div>
                     <ArrowUpRight size={14} className="text-[var(--brand)]" />
                     <div className="text-[10px] font-black text-[var(--text-primary)]">{t.unidade_destino_pretendida}</div>
                  </div>
               </div>

               <div className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                  <p className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-2">Motivo da Solicitação</p>
                  <p className="text-xs font-medium text-[var(--text-primary)] italic leading-relaxed">"{t.motivo_solicitacao}"</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <button 
                 onClick={() => { setDecisao('ACEITO'); setModalAnalise(t); }}
                 className="flex flex-col items-center gap-2 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 hover:bg-green-100 transition-all"
               >
                  <CheckCircle size={20} />
                  <span className="text-[8px] font-black uppercase">Aceitar</span>
               </button>
               <button 
                 onClick={() => { setDecisao('RECUSADO'); setModalAnalise(t); }}
                 className="flex flex-col items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 hover:bg-red-100 transition-all"
               >
                  <XCircle size={20} />
                  <span className="text-[8px] font-black uppercase">Recusar</span>
               </button>
               <button 
                 onClick={() => { setDecisao('ARQUIVADO'); setModalAnalise(t); }}
                 className="flex flex-col items-center gap-2 p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all"
               >
                  <Archive size={20} />
                  <span className="text-[8px] font-black uppercase">Arquivar</span>
               </button>
            </div>
          </div>
        ))}

        {transferencias.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
             <ArrowUpRight size={48} className="mx-auto mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">Nenhuma solicitação de transferência pendente.</p>
          </div>
        )}
      </div>

      {modalAnalise && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
              <div className={`p-8 ${decisao === 'ACEITO' ? 'bg-green-600' : decisao === 'RECUSADO' ? 'bg-red-600' : 'bg-slate-800'} text-white`}>
                 <h4 className="text-xl font-black uppercase italic tracking-tighter">
                   {decisao === 'ACEITO' ? 'Aceitar Transferência' : decisao === 'RECUSADO' ? 'Recusar Transferência' : 'Arquivar Solicitação'}
                 </h4>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Colaborador: {modalAnalise.colaborador_nome}</p>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-2">
                       <MessageSquare size={14} /> Justificativa da Decisão
                    </label>
                    <textarea 
                      className="input-field w-full min-h-[120px] p-4 text-sm" 
                      placeholder="Descreva o motivo desta decisão para auditoria..."
                      value={justificativa}
                      onChange={e => setJustificativa(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setModalAnalise(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                    <button onClick={handleConfirmar} className={`flex-1 py-4 ${decisao === 'ACEITO' ? 'bg-green-600' : decisao === 'RECUSADO' ? 'bg-red-600' : 'bg-slate-800'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all`}>
                       Confirmar Decisão
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
