"use client";
import { Trophy, CheckCircle } from "lucide-react";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface MyMissionsTabProps {
  missoesAtivas: any[];
  selectedMissao: any;
  respostasMissao: Record<string, boolean>;
  submittingMissao: boolean;
  onSelectMissao: (missao: any) => void;
  onCloseMissao: () => void;
  onRespostaChange: (task: string, value: boolean) => void;
  onAnswer: () => void;
}

export default function MyMissionsTab({
  missoesAtivas,
  selectedMissao,
  respostasMissao,
  submittingMissao,
  onSelectMissao,
  onCloseMissao,
  onRespostaChange,
  onAnswer,
}: MyMissionsTabProps) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] shadow-xl text-white relative overflow-hidden">
        <Trophy className="absolute top-0 right-0 p-10 opacity-10" size={140} />
        <div className="relative z-10">
          <h3 className="text-3xl font-black italic tracking-tighter">Radar de Missões Operacionais</h3>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mt-2">Complete os desafios semanais para garantir a excelência da sua rota</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {missoesAtivas.map(m => (
          <div
            key={m.id}
            className={`bg-[var(--bg-card)] p-8 rounded-[2.5rem] border ${m.concluida ? 'border-green-500/20' : 'border-[var(--border)]'} shadow-xl flex flex-col justify-between group`}
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${m.frequencia === 'SEMANAL' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  {m.frequencia}
                </div>
                {m.concluida && <CheckCircle className="text-green-500" size={20} />}
              </div>
              <h4 className="text-lg font-black text-[var(--text-primary)] italic leading-tight">{m.titulo}</h4>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-2 line-clamp-2">{m.descricao}</p>
            </div>

            <button
              disabled={m.concluida}
              onClick={() => onSelectMissao(m)}
              className={`w-full mt-8 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${m.concluida ? 'bg-green-500/10 text-green-600 cursor-default' : 'bg-orange-600 text-white shadow-xl shadow-orange-600/20 hover:scale-[1.02]'}`}
            >
              {m.concluida ? "Missão Cumprida" : <><Trophy size={16} /> Aceitar Missão</>}
            </button>
          </div>
        ))}
      </div>

      {selectedMissao && (
        <AdaptiveModal isOpen={!!selectedMissao} onClose={onCloseMissao} title={selectedMissao.titulo}>
          <div className="p-10 space-y-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Objetivo da Missão</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedMissao.descricao}</p>
            </div>

            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase text-[var(--brand)]">Checklist de Campo</p>
              {selectedMissao.checklist?.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                  <span className="text-xs font-black uppercase">{item.task}</span>
                  <button
                    onClick={() => onRespostaChange(item.task, !respostasMissao[item.task])}
                    className={`w-14 h-8 rounded-lg flex items-center justify-center transition-all ${respostasMissao[item.task] ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {respostasMissao[item.task] ? 'OK' : 'Pendente'}
                  </button>
                </div>
              ))}
            </div>

            <button
              disabled={submittingMissao}
              onClick={onAnswer}
              className="w-full h-16 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {submittingMissao ? "Sincronizando..." : "Concluir Missão e Enviar Evidências"}
            </button>
          </div>
        </AdaptiveModal>
      )}
    </div>
  );
}
