"use client";
import { useState, useEffect } from "react";
import { 
  Users, AlertCircle, Zap, UserX, FileText, 
  MessageSquare, RefreshCw, ShieldAlert, Upload, Send, CheckCircle2,
  Activity, MapPin, Hash, ShieldCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import QuickActions from "../components/QuickActions";

export default function PortalDiretorPage() {
  const [aba, setAba] = useState<"equipe" | "acoes" | "suporte">("equipe");
  const [userRole, setUserRole] = useState("DIRETOR"); 
  const [userUnidadeId, setUserUnidadeId] = useState("nabuco"); 
  const [userRotaUnidades, setUserRotaUnidades] = useState(["nabuco", "geraldo"]); 
  const [unidadeAtiva, setUnidadeAtiva] = useState({ id: "nabuco", nome: "Escola Joaquim Nabuco", secretária: "SEMED", vinculo: "(92) 98111-XXXX" });

  const canEdit = (unidadeId: string) => {
    const rolesComPoderTotal = ["ADMIN", "RH_PESSOAL", "RH_PREFEITURA", "GERENTE"];
    if (rolesComPoderTotal.includes(userRole)) return true;
    if (userRole === "DIRETOR" && userUnidadeId === unidadeId) return true;
    if (userRole === "ENCARREGADO" && userRotaUnidades.includes(unidadeId)) return true;
    return false;
  };

  const [equipe, setEquipe] = useState([
    { id: 1, unidadeId: "nabuco", nome: "Ana Paula Silva", cargo: "ASG", insalubridade: "20%", horario: "07:00 - 16:00", status: "ATIVO" },
    { id: 2, unidadeId: "nabuco", nome: "Carlos Eduardo", cargo: "Porteiro", insalubridade: "N/A", horario: "12x36 (Diurno)", status: "ATIVO" },
    { id: 3, unidadeId: "geraldo", nome: "Maria Joana", cargo: "ASG", insalubridade: "40%", horario: "07:00 - 16:00", status: "ATIVO" },
    { id: 4, unidadeId: "nabuco", nome: "Marcia Souza", cargo: "ASG", insalubridade: "20%", horario: "07:00 - 16:00", status: "ATIVO" },
    { id: 5, unidadeId: "nabuco", nome: "Roberto Lima", cargo: "Zelador", insalubridade: "20%", horario: "08:00 - 17:00", status: "AFASTADO" }
  ]);

  const [modalAjuste, setModalAjuste] = useState<{ colab: any, campo: 'insalubridade' | 'horario', valor: string } | null>(null);

  const handleAjuste = (colaborador: any, campo: 'insalubridade' | 'horario') => {
    setModalAjuste({ colab: colaborador, campo, valor: colaborador[campo] });
  };

  const confirmarAjuste = () => {
    if (modalAjuste) {
      n8n.trigger('ajuste-colaborador-diretor', {
        colaborador: modalAjuste.colab.nome,
        campo: modalAjuste.campo === 'insalubridade' ? 'Insalubridade' : 'Horário de Trabalho',
        de: modalAjuste.colab[modalAjuste.campo],
        para: modalAjuste.valor,
        solicitante: "DIRETOR UNIDADE",
        unidade: unidadeAtiva.nome,
        notificar: ["RH_GERAL", "ENCARREGADO", "GERENCIA"]
      });
      alert(`Solicitação de ajuste enviada!`);
      setModalAjuste(null);
    }
  };

  const equipeFiltrada = equipe.filter(c => c.unidadeId === unidadeAtiva.id);

  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full pb-20 px-4 md:px-10">
      <div className="no-print">
        <QuickActions user={{ role: 'DIRETOR', nivel: 2 }} />
      </div>

      {/* 1. INFO UNIDADE (GRID 100%) - AUMENTADO ESPAÇAMENTO LATERAL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 no-print">
         {[
           { label: "Unidade Ativa", value: unidadeAtiva.nome, icon: MapPin, color: "text-blue-500" },
           { label: "Código Unidade", value: `#${(unidadeAtiva.id || "").toUpperCase()}`, icon: Hash, color: "text-orange-500" },
           { label: "Secretaria", value: unidadeAtiva.secretária, icon: ShieldCheck, color: "text-purple-500" },
           { label: "Efetivo na Unidade", value: `${equipeFiltrada.length} Colaboradores`, icon: Users, color: "text-green-500" },
         ].map((stat, i) => (
           <div key={i} className="bg-[var(--bg-card)] p-10 rounded-[1.5rem] border border-[var(--border)] shadow-sm flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center ${stat.color} shrink-0 shadow-inner`}>
                 <stat.icon size={24} />
              </div>
              <div className="min-w-0 ml-2">
                 <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                 <p className="text-sm font-black truncate text-[var(--text-primary)]">{stat.value}</p>
              </div>
           </div>
         ))}
      </div>

      {/* 2. ÁREA PRINCIPAL - MOVIDA PARA A DIREITA VIA PADDING EXTRA */}
      <div className="flex flex-col gap-10 flex-1 overflow-hidden no-print">
        <div className="flex flex-col gap-10 overflow-y-auto pr-4 custom-scrollbar">
          
          {/* HEADER PORTAL - AUMENTADO PX PARA EMPURRAR O CONTEÚDO PARA DENTRO */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-10 bg-[var(--bg-card)] px-20 py-14 rounded-[1.5rem] border border-[var(--border)] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[var(--brand)] opacity-20" />
            <div className="min-w-0">
              <div className="flex items-center gap-6 mb-3">
                <h1 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter">Portal do Diretor</h1>
                <span className="px-5 py-2 bg-green-100 text-green-700 rounded-full text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shrink-0 shadow-sm">
                  <RefreshCw size={16} /> Identificado
                </span>
              </div>
              <p className="text-[12px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] whitespace-normal ml-1">
                Gestão Direta da Unidade Operacional Alicerce
              </p>
            </div>
            <div className="flex flex-wrap gap-6 shrink-0">
              {!canEdit(unidadeAtiva.id) && (
                <div className="flex items-center gap-3 px-8 py-4 bg-amber-100 text-amber-700 rounded-2xl text-[12px] font-black uppercase shadow-sm">
                  <ShieldAlert size={18} /> Somente Leitura
                </div>
              )}
              <button className="px-12 py-5 bg-[var(--brand)] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl shadow-[var(--brand)]/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4" onClick={() => setAba("acoes")}>
                <Zap size={22} /> Gerar Ocorrência
              </button>
            </div>
          </div>

          {/* CONTAINER DA TABELA - PX-20 PARA GARANTIR QUE O TEXTO FIQUE LONGE DA BORDA */}
          <div className="bg-[var(--bg-card)] rounded-[1.5rem] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap px-20 py-8 border-b border-[var(--border)] gap-12 bg-[var(--bg-base)]/10">
              {[
                { id: "equipe", label: "Minha Equipe" },
                { id: "acoes", label: "Gestão e Volante" },
                { id: "suporte", label: "Cadastro e Ajustes" },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setAba(t.id as any)} 
                  className={`px-10 py-5 text-[12px] font-black uppercase tracking-[0.25em] transition-all relative shrink-0 ${aba === t.id ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                >
                  {t.label}
                  {aba === t.id && <div className="absolute bottom-[-2px] left-0 w-full h-[4px] bg-[var(--brand)] rounded-full" />}
                </button>
              ))}
            </div>

            <div className="px-20 py-16 overflow-auto custom-scrollbar">
              {aba === "equipe" && (
                <table className="w-full text-left">
                  <thead className="border-b border-[var(--border)]">
                    <tr className="text-[12px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      <th className="p-8">Colaborador</th>
                      <th className="p-8">Cargo</th>
                      <th className="p-8 text-center">Insalubridade</th>
                      <th className="p-8 text-center">Horário</th>
                      <th className="p-8 text-center">Status</th>
                      <th className="p-8 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {equipeFiltrada.map(c => (
                      <tr key={c.id} className="hover:bg-[var(--bg-base)]/50 transition-colors group">
                        <td className="p-8 px-10">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-[var(--brand)] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-[var(--brand)]/30 shrink-0">{(c.nome || "??").substring(0,2).toUpperCase()}</div>
                              <span className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors whitespace-nowrap">{c.nome}</span>
                           </div>
                        </td>
                        <td className="p-8 text-sm font-bold text-[var(--text-secondary)]">{c.cargo}</td>
                        <td className="p-8 text-center">
                          <button 
                            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-[12px] font-black uppercase border border-red-100 hover:scale-110 transition-all shadow-sm"
                            onClick={() => handleAjuste(c, "insalubridade")}
                          >
                            {c.insalubridade}
                          </button>
                        </td>
                        <td className="p-8 text-center">
                          <button 
                            className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[12px] font-black uppercase border border-blue-100 hover:scale-110 transition-all shadow-sm"
                            onClick={() => handleAjuste(c, "horario")}
                          >
                            {c.horario}
                          </button>
                        </td>
                        <td className="p-8 text-center">
                          <span className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] ${c.status === 'ATIVO' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-red-100 text-red-700 shadow-sm'}`}>{c.status}</span>
                        </td>
                        <td className="p-8 text-right">
                          <button className="text-[12px] font-black uppercase text-[var(--brand)] hover:underline tracking-widest" onClick={() => setAba("acoes")}>Reportar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ... Outras abas com padding PX-20 garantido ... */}
              {aba === "acoes" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="bg-[var(--bg-card)] p-12 rounded-[2rem] border border-[var(--border)] shadow-xl">
                    <h3 className="text-lg font-black uppercase mb-12 flex items-center gap-5"><UserX size={24} className="text-red-500" /> Registrar Falta</h3>
                    <div className="space-y-10">
                      <div className="space-y-4">
                         <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Colaborador</label>
                         <select className="input-field w-full h-16 px-6">
                           {equipeFiltrada.map(c => <option key={c.id}>{c.nome}</option>)}
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Motivo</label>
                         <textarea className="input-field w-full min-h-[150px] p-8" placeholder="Descreva a ocorrência detalhadamente..." />
                      </div>
                      <button className="w-full h-18 bg-red-600 text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-600/30" onClick={() => { alert("Falta registrada."); }}>Confirmar Registro</button>
                    </div>
                  </div>
                  <div className="bg-[var(--bg-card)] p-12 rounded-[2rem] border border-[var(--border)] shadow-xl">
                    <h3 className="text-lg font-black uppercase mb-12 flex items-center gap-5"><Zap size={24} className="text-orange-500" /> Solicitar Volante</h3>
                    <div className="flex flex-col gap-10">
                       <p className="text-base font-medium text-[var(--text-muted)] leading-relaxed bg-[var(--bg-base)] p-8 rounded-[1.5rem] border border-[var(--border)]">Solicite apoio operacional imediato para cobertura emergencial de postos em aberto nesta unidade específica.</p>
                       <button className="w-full h-18 bg-orange-500 text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30" onClick={() => { alert("Solicitação enviada."); }}>Solicitar agora</button>
                    </div>
                  </div>
                </div>
              )}

              {aba === "suporte" && (
                <div className="max-w-4xl space-y-12">
                  <div className="p-10 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-10">
                    <MessageSquare size={48} className="text-blue-500 shrink-0" />
                    <div>
                       <h4 className="text-lg font-black uppercase text-blue-800 mb-2">Suporte Técnico Administrativo</h4>
                       <p className="text-sm font-medium text-blue-600 opacity-80 leading-relaxed">Relate erros nos dados ou solicite atualizações cadastrais diretamente ao RH Geral.</p>
                    </div>
                  </div>
                  <div className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Tipo de Ajuste</label>
                       <select className="input-field w-full h-16 px-6">
                         <option>Erro no nome</option>
                         <option>Cargo incorreto</option>
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Descrição</label>
                       <textarea className="input-field w-full min-h-[180px] p-8" placeholder="Descreva o ajuste detalhadamente para o RH..." />
                    </div>
                    <button className="px-16 h-18 bg-[var(--brand)] text-white rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[var(--brand)]/40 flex items-center gap-5"><Send size={24} /> Enviar Ticket</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ajuste de Colaborador */}
      {modalAjuste && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-[1000] p-6 animate-fade-in">
          <div className="bg-[var(--bg-card)] w-full max-w-lg p-14 rounded-[3rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-3 bg-[var(--brand)]" />
            <div className="flex items-center gap-8 mb-12">
              <div className="w-20 h-20 bg-[var(--brand)]/10 rounded-3xl flex items-center justify-center text-[var(--brand)] shadow-inner">
                <RefreshCw size={36} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter">Ajuste de Dados</h2>
                <p className="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">{modalAjuste.colab.nome}</p>
              </div>
            </div>

            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Campo em Edição</label>
                <div className="px-8 py-4 bg-[var(--bg-base)] rounded-2xl text-[12px] font-black text-[var(--brand)] border border-[var(--border)] shadow-sm uppercase tracking-widest">{modalAjuste.campo === 'insalubridade' ? 'Insalubridade' : 'Horário'}</div>
              </div>

              <div className="space-y-4">
                <label className="text-[12px] font-black uppercase text-[var(--text-muted)] tracking-widest ml-1">Novo Valor</label>
                {modalAjuste.campo === 'insalubridade' ? (
                  <select className="input-field w-full h-16 px-6" value={modalAjuste.valor} onChange={e => setModalAjuste({ ...modalAjuste, valor: e.target.value })}>
                    <option value="N/A">N/A (Isento)</option>
                    <option value="20%">20% (Grau Médio)</option>
                    <option value="40%">40% (Grau Máximo)</option>
                  </select>
                ) : (
                  <input className="input-field w-full h-16 px-6" placeholder="Ex: 07:00 - 16:00" value={modalAjuste.valor} onChange={e => setModalAjuste({ ...modalAjuste, valor: e.target.value })} />
                )}
              </div>

              <p className="text-[11px] font-bold text-[var(--text-muted)] italic leading-relaxed bg-[var(--bg-base)] p-6 rounded-2xl border border-[var(--border)]">Nota: Esta alteração será enviada para validação do RH Geral e Gerência.</p>

              <div className="flex gap-8 pt-8 border-t border-[var(--border)]">
                <button className="flex-1 h-16 text-[12px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-widest" onClick={() => setModalAjuste(null)}>Cancelar</button>
                <button className="flex-1 h-16 bg-[var(--brand)] text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[var(--brand)]/40" onClick={confirmarAjuste}>Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
