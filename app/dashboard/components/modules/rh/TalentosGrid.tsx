"use client";
import { FileText, UserPlus, MapPin, Clock } from "lucide-react";

interface Candidato {
  id: string;
  nome: string;
  cargo_pretendido?: string;
  cargo?: string;
  status_candidato: string;
  cidade?: string;
  bairro?: string;
  created_at: string;
  link_curriculo?: string;
}

interface TalentosGridProps {
  candidatos: Candidato[];
  onAdmitir: (c: Candidato) => void;
}

export default function TalentosGrid({ candidatos, onAdmitir }: TalentosGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
      {candidatos.map(can => (
        <div key={can.id} className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--brand)]/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[var(--brand)] font-black shadow-sm">
              {can.nome.substring(0,2).toUpperCase()}
            </div>
            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${can.status_candidato === 'NOVO' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {can.status_candidato}
            </span>
          </div>
          <h4 className="text-sm font-black text-[var(--text-primary)] mb-1">{can.nome}</h4>
          <p className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest mb-4">
            {can.cargo_pretendido || can.cargo || "N/A"}
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold">
              <MapPin size={12}/> {can.cidade || 'Manaus'} - {can.bairro || 'N/A'}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold">
              <Clock size={12}/> Inscrito em {new Date(can.created_at).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-2">
            {can.link_curriculo ? (
              <button 
                onClick={() => window.open(can.link_curriculo, '_blank')} 
                className="flex-1 h-10 bg-white text-[var(--text-primary)] rounded-xl text-[9px] font-black uppercase border border-[var(--border)] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={14}/> Currículo
              </button>
            ) : (
              <div className="flex-1 h-10 flex items-center justify-center text-[8px] font-black uppercase text-slate-300 border border-dashed border-slate-200 rounded-xl">
                Sem CV Anexo
              </div>
            )}
            <button 
              onClick={() => onAdmitir(can)} 
              className="h-10 px-4 bg-[var(--brand)] text-white rounded-xl text-[9px] font-black uppercase shadow-lg shadow-[var(--brand)]/20 hover:scale-[1.02] transition-all"
            >
              <UserPlus size={14}/>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
