"use client";
import { useState, useEffect } from "react";
import { 
  User, Phone, MapPin, Calendar, Clock, 
  ShieldCheck, AlertTriangle, FileText, 
  ChevronRight, Edit3, Save, X, History,
  CheckCircle2, Loader2, UploadCloud
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

interface Ficha360Props {
  colabId: string;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  restrictLevel?: boolean;
  onUpdate?: () => void;
}

export default function FichaColaborador360({ colabId, isOpen, onClose, canEdit = false, restrictLevel = false, onUpdate }: Ficha360Props) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"perfil" | "pessoal" | "financeiro" | "ponto" | "ocorrencias" | "audit">("perfil");
  const [data, setData] = useState<any>(null);
  const [historicoPonto, setHistoricoPonto] = useState<any[]>([]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [editForm, setEditForm] = useState<any>({});
  const [motivoAlt, setMotivoAlt] = useState("");

  useEffect(() => {
    if (isOpen && colabId) {
      loadFullData();
    }
  }, [isOpen, colabId]);

  async function loadFullData() {
    setLoading(true);
    // 1. Dados Básicos
    const { data: user } = await supabase.from('usuarios').select('*').eq('id', colabId).single();
    if (user) {
      setData(user);
      setEditForm(user);
    }

    // 2. Histórico de Ponto
    const { data: ponto } = await supabase.from('ponto_digital')
      .select('*')
      .eq('telefone', user?.telefone)
      .order('data', { ascending: false })
      .limit(20);
    setHistoricoPonto(ponto || []);

    // 3. Ocorrências (Advertências, Faltas, Atestados)
    const { data: tickets } = await supabase.from('tickets_sla')
      .select('*')
      .or(`atribuido_a.ilike.%${user?.nome}%,descricao.ilike.%${user?.nome}%`)
      .order('data_abertura', { ascending: false });
    setOcorrencias(tickets || []);

    // 4. Logs de Auditoria
    const { data: audit } = await supabase.from('historico_gestao')
      .select('*')
      .eq('alvo_tel', user?.telefone)
      .order('created_at', { ascending: false });
    setLogs(audit || []);

    setLoading(false);
  }

  const handleSave = async () => {
    if (!motivoAlt) return alert("Por favor, informe o motivo da alteração para fins de auditoria.");
    
    setLoading(true);
    const changes = Object.keys(editForm).filter(key => editForm[key] !== data[key] && key !== 'updated_at');
    
    if (changes.length > 0) {
      await supabase.from('historico_gestao').insert([{
        executor_tel: "ADMIN_PORTAL", 
        alvo_tel: data.telefone,
        tipo_acao: "EDICAO_DADOS",
        de: JSON.stringify(changes.reduce((acc, k) => ({...acc, [k]: data[k]}), {})),
        para: JSON.stringify(changes.reduce((acc, k) => ({...acc, [k]: editForm[k]}), {})),
        motivo: motivoAlt
      }]);

      const payload = { ...editForm };
      
      // Sanitização de campos numéricos para evitar erro de sintaxe "" no PostgreSQL
      const numericFields = ['salario_base', 'valor_alimentacao', 'valor_vale_transporte', 'dependentes_qtd', 'nivel_acesso'];
      numericFields.forEach(field => {
        if (payload[field] === "" || payload[field] === undefined) {
          payload[field] = null;
        } else if (typeof payload[field] === 'string') {
          // Converte string para número se necessário
          const num = parseFloat(payload[field]);
          payload[field] = isNaN(num) ? null : num;
        }
      });

      if (payload.insalubridade) {
        payload.insalubridade = parseInt(String(payload.insalubridade).replace(/\D/g, "")) || 0;
      }
      
      // Padronização para 'cargo' conforme migração do banco
      if (payload.funcao) {
        payload.cargo = payload.funcao;
        delete payload.funcao;
      }
      
      const { error } = await supabase.from('usuarios').update(payload).eq('id', colabId);
      
      if (!error) {
        if (restrictLevel) {
          await supabase.from('tickets_sla').insert([{
            assunto: "ALTERAÇÃO CADASTRO RH",
            unidade: data.unidade_alocacao || "DP",
            descricao: `O RH alterou dados do colaborador ${data.nome}. Motivo: ${motivoAlt}. Campos: ${changes.join(', ')}`,
            prioridade: "NORMAL",
            status: "PENDENTE",
            criado_por: "DP_PORTAL"
          }]);
        }

        alert("Dados atualizados e auditados com sucesso! Uma ocorrência de notificação foi gerada para a gerência.");
        setEditing(false);
        setMotivoAlt("");
        loadFullData();
        if (onUpdate) onUpdate();
      } else {
        alert("Erro ao salvar: " + error.message);
      }
    } else {
      setEditing(false);
    }
    setLoading(false);
  };

  return (
    <AdaptiveModal 
      title={`Ficha 360°: ${data?.nome || 'Carregando...'}`} 
      isOpen={isOpen} 
      onClose={onClose} 
      width="1000px"
    >
      {loading && !data ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <Loader2 className="animate-spin text-[var(--brand)]" size={40} />
          <p className="text-[var(--text-muted)] font-bold">Consolidando vida funcional...</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 md:h-[650px]">
          {/* Sidebar de Navegação Interna */}
          <div className="w-full md:w-56 flex flex-row md:flex-col gap-2 border-b md:border-b-0 md:border-r border-[var(--border)] pb-4 md:pb-0 md:pr-4 overflow-x-auto custom-scrollbar shrink-0">
            {[
              { id: "perfil", label: "Contrato / Cargo", icon: User },
              { id: "pessoal", label: "Vida Pessoal / Docs", icon: FileText },
              { id: "financeiro", label: "Financeiro / Logística", icon: ShieldCheck },
              { id: "ponto", label: "Frequência / Ponto", icon: Clock },
              { id: "ocorrencias", label: "Ocorrências / Histórico", icon: AlertTriangle },
              { id: "audit", label: "Rastro de Auditoria", icon: History },
            ].map(t => (
              <button 
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${tab === t.id ? 'bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20' : 'text-[var(--text-muted)] hover:bg-[var(--bg-base)]'}`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
            
            <div className="mt-2 md:mt-auto p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 text-center shrink-0">
              <div className="text-[10px] font-bold text-orange-600 uppercase mb-1">Status Atual</div>
              <div className={`badge ${data?.status === 'ATIVO' ? 'badge-green' : 'badge-amber'} w-full justify-center`}>{data?.status || 'OFFLINE'}</div>
            </div>
          </div>

          {/* Conteúdo da Tab */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* TAB 1: PERFIL CONTRATUAL */}
            {tab === "perfil" && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[var(--text-primary)]">Informações do Contrato</h4>
                  {canEdit && (
                    <button className="btn-ghost text-xs" onClick={() => setEditing(!editing)}>
                      {editing ? <X size={14} /> : <Edit3 size={14} />} {editing ? "Cancelar" : "Editar Dados"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { key: "funcao", label: "Função Operacional", type: "text" },
                    { key: "unidade_alocacao", label: "Unidade de Trabalho", type: "text" },
                    ...(restrictLevel ? [] : [{ key: "nivel_acesso", label: "Nível de Privilégio", type: "select", options: [1, 2, 3, 4] }]),
                    { key: "insalubridade", label: "Insalubridade", type: "select", options: ["N/A", "20%", "40%"] },
                    { key: "carga_horaria", label: "Carga Horária", type: "select", options: ["12X36", "44H", "20H"] },
                    { key: "periodo", label: "Período", type: "select", options: ["DIURNO", "NOTURNO"] },
                    { key: "escala_tipo", label: "Tipo de Escala", type: "select", options: ["PAR", "IMPAR", "DIARIO"] },
                    { key: "horario_entrada", label: "Entrada", type: "time" },
                    { key: "horario_saida", label: "Saída", type: "time" },
                    { key: "data_referencia_escala", label: "Referência Escala", type: "date" },
                    { key: "data_admissao", label: "Data de Admissão", type: "date" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">{f.label}</label>
                      {editing ? (
                        f.type === "select" ? (
                          <select 
                            value={editForm[f.key]} 
                            disabled={(f.key === "nivel_acesso" && restrictLevel) || (f.key === "escala_tipo" && editForm.carga_horaria === "44H")}
                            onChange={e => {
                              const val = e.target.value;
                              const updates: any = { [f.key]: val };
                              if (f.key === "carga_horaria" && val === "44H") {
                                updates.escala_tipo = "DIARIO";
                              }
                              setEditForm({...editForm, ...updates});
                            }}
                          >
                            {f.key === "nivel_acesso" ? (
                              <>
                                <option value="1">1 - Sem Acesso ao Portal</option>
                                <option value="2">2 - Acesso Operacional</option>
                                <option value="3">3 - Gestor / Encarregado</option>
                                <option value="4">4 - Diretoria / RH Master</option>
                              </>
                            ) : f.key === "escala_tipo" && editForm.carga_horaria === "44H" ? (
                              <option value="DIARIO">DIARIO / FIXO</option>
                            ) : (
                              f.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)
                            )}
                          </select>
                        ) : (
                          <input type={f.type} className="input-field" value={editForm[f.key] || ""} onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} />
                        )
                      ) : (
                        <div className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-sm font-semibold">
                          {(f.key === 'funcao' ? (data?.funcao || data?.cargo) : data?.[f.key]) || "—"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: VIDA PESSOAL / DOCUMENTAÇÃO */}
            {tab === "pessoal" && (
              <div className="flex flex-col gap-8 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[var(--text-primary)]">Prontuário Civil e Localização</h4>
                  {canEdit && !editing && (
                    <button className="btn-ghost text-[10px] uppercase font-black" onClick={() => setEditing(true)}>
                      <Edit3 size={12} className="mr-1" /> Editar Prontuário
                    </button>
                  )}
                </div>

                {/* Sub-seção: Identificação */}
                <div className="space-y-4">
                  <h5 className="text-[9px] font-black text-[var(--brand)] uppercase tracking-[2px]">Identificação Civil</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: "email", label: "E-mail Pessoal" },
                      { key: "data_nascimento", label: "Data de Nascimento" },
                      { key: "sexo", label: "Sexo" },
                      { key: "rg", label: "Registro Geral (RG)" },
                      { key: "pis", label: "Número PIS" },
                      { key: "etnia", label: "Etnia / Cor" },
                      { key: "nacionalidade", label: "Nacionalidade" },
                      { key: "dependentes_qtd", label: "Dependentes (Menores de 18)" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1 block">{f.label}</label>
                        {editing ? (
                          <input 
                            className="input-field w-full text-xs" 
                            value={editForm[f.key] || ""} 
                            onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} 
                          />
                        ) : (
                          <div className="p-2.5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]">
                            {data?.[f.key] || "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-seção: Filiação */}
                <div className="space-y-4">
                  <h5 className="text-[9px] font-black text-[var(--brand)] uppercase tracking-[2px]">Filiação e Escolaridade</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "nome_pai", label: "Nome do Pai" },
                      { key: "nome_mae", label: "Nome da Mãe" },
                      { key: "escolaridade", label: "Escolaridade" },
                    ].map(f => (
                      <div key={f.key} className={f.key === "escolaridade" ? "col-span-2" : ""}>
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1 block">{f.label}</label>
                        {editing ? (
                          <input 
                            className="input-field w-full text-xs" 
                            value={editForm[f.key] || ""} 
                            onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} 
                          />
                        ) : (
                          <div className="p-2.5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]">
                            {data?.[f.key] || "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sub-seção: Localização */}
                <div className="space-y-4">
                  <h5 className="text-[9px] font-black text-[var(--brand)] uppercase tracking-[2px]">Endereço e Residência</h5>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: "cep", label: "CEP" },
                      { key: "rua", label: "Logradouro (Rua/Av)" },
                      { key: "bairro", label: "Bairro" },
                      { key: "endereco_completo", label: "Endereço Completo (Sintético)" },
                    ].map(f => (
                      <div key={f.key} className={f.key === "endereco_completo" ? "col-span-3" : ""}>
                        <label className="text-[9px] font-black text-[var(--text-muted)] uppercase mb-1 block">{f.label}</label>
                        {editing ? (
                          <input 
                            className="input-field w-full text-xs" 
                            value={editForm[f.key] || ""} 
                            onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} 
                          />
                        ) : (
                          <div className="p-2.5 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]">
                            {data?.[f.key] || "—"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FINANCEIRO E LOGÍSTICA */}
            {tab === "financeiro" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[var(--text-primary)]">Remuneração e Logística (Uniformes)</h4>
                  {canEdit && (
                    <button className="btn-ghost text-xs" onClick={() => setEditing(!editing)}>
                      {editing ? <X size={14} /> : <Edit3 size={14} />} {editing ? "Cancelar" : "Editar Dados"}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { key: "salario_base", label: "Salário Base (R$)", type: "number" },
                    { key: "valor_alimentacao", label: "V.A (R$)", type: "number" },
                    { key: "valor_vale_transporte", label: "V.T (R$)", type: "number" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1.5 block">{f.label}</label>
                      {editing ? (
                        <input type="number" className="input-field" value={editForm[f.key] || ""} onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} />
                      ) : (
                        <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-sm font-bold text-green-700">R$ {data?.[f.key] || "0,00"}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 grid grid-cols-3 gap-6">
                  {[
                    { key: "tamanho_camisa", label: "Tamanho Camisa", placeholder: "Ex: M, G, GG" },
                    { key: "tamanho_calca", label: "Número Calça", placeholder: "Ex: 40, 42" },
                    { key: "tamanho_sapato", label: "Número Sapato", placeholder: "Ex: 41, 42" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[9px] font-bold text-blue-600 uppercase mb-1 block">{f.label}</label>
                      {editing ? (
                        <input 
                          className="input-field w-full text-xs !bg-white/20 !border-blue-200 focus:!border-blue-500 !text-blue-900 placeholder:text-blue-900/30" 
                          placeholder={f.placeholder}
                          value={editForm[f.key] || ""} 
                          onChange={e => setEditForm({...editForm, [f.key]: e.target.value})} 
                        />
                      ) : (
                        <div className="text-lg font-black text-blue-900">{data?.[f.key] || "—"}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: OCORRÊNCIAS (HISTÓRICO) */}
            {tab === "ocorrencias" && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-[var(--text-primary)]">Histórico de Eventos Funcionais</h4>
                  <div className="flex gap-2">
                    <span className="badge badge-red text-[8px]">ADVERTÊNCIAS: {ocorrencias.filter(o => o.assunto?.includes("ADVERTENCIA")).length}</span>
                    <span className="badge badge-amber text-[8px]">FALTAS: {ocorrencias.filter(o => o.assunto?.includes("FALTA")).length}</span>
                  </div>
                </div>
                {ocorrencias.length === 0 ? (
                  <div className="text-center p-10 text-[var(--text-muted)]">Nenhum evento registrado.</div>
                ) : (
                  <div className="space-y-4">
                    {ocorrencias.map((oc, i) => (
                      <div key={i} className={`p-4 rounded-xl border transition-all hover:shadow-md ${oc.assunto?.includes("ADVERTENCIA") ? 'bg-red-50 border-red-100' : oc.assunto?.includes("ATESTADO") ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${oc.assunto?.includes("ADVERTENCIA") ? 'bg-red-500' : oc.assunto?.includes("ATESTADO") ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                            <span className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-primary)]">{oc.assunto}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)]">{new Date(oc.data_abertura).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[0.75rem] font-medium text-[var(--text-secondary)] leading-relaxed">{oc.descricao}</div>
                        <div className="mt-3 pt-2 border-t border-black/5 flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Status: {oc.status}</span>
                          <span className="text-[9px] font-bold text-[var(--brand)] uppercase">Ref: {oc.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB PONTO E AUDITORIA (MANTIDOS) */}
            {tab === "ponto" && <div className="p-4">Visualização de Ponto Ativa...</div>}
            {tab === "audit" && (
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-[var(--text-primary)] mb-2">Rastro de Auditoria (Logs do Sistema)</h4>
                {logs.length === 0 ? (
                  <div className="text-center p-10 text-[var(--text-muted)]">Nenhuma alteração registrada.</div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] text-[0.7rem]">
                        <div className="flex justify-between font-bold mb-1">
                          <span className="text-[var(--brand)]">{log.tipo_acao}</span>
                          <span className="text-[var(--text-muted)]">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-[var(--text-secondary)] mb-1 italic">"{log.motivo}"</div>
                        <div className="text-[var(--text-muted)] text-[10px]">Executor: {log.executor_tel}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editing && (
              <div className="mt-8 p-6 bg-[var(--bg-card)] rounded-2xl border-2 border-dashed border-[var(--brand)] animate-pulse">
                <label className="text-xs font-bold text-orange-600 mb-2 block">MOTIVO DA ALTERAÇÃO (AUDITORIA)</label>
                <textarea className="input-field bg-white" placeholder="Descreva o motivo da mudança..." value={motivoAlt} onChange={e => setMotivoAlt(e.target.value)} />
                <button className="btn-brand w-full mt-4 h-12" onClick={handleSave} disabled={loading}><Save size={18} /> Salvar Alterações Auditadas</button>
              </div>
            )}
          </div>
        </div>
      )}
    </AdaptiveModal>
  );
}
