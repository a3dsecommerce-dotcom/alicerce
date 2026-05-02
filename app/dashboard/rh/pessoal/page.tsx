"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Filter, MoreVertical, User, Phone, MapPin, Calendar, ChevronRight, Upload, FileText, Package, ShieldCheck, Loader } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import FichaColaborador360 from "../../components/FichaColaborador360";
import AdaptiveModal from "@/components/ui/AdaptiveModal";
import QuickActions from "../../components/QuickActions";
import ColaboradoresSharedTable from "../../components/ColaboradoresSharedTable";
import TicketHub from "../../components/TicketHub";

const cargoCores: Record<string, string> = { Porteiro: "badge-blue", ASG: "badge-green", Encarregado: "badge-brand", Recepcionista: "badge-amber", Zelador: "badge-blue", Limpeza: "badge-green" };

export default function RHPessoalPage() {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [aba, setAba] = useState<"ativos" | "talentos" | "extras" | "volantes">("ativos");
  const [horasExtras, setHorasExtras] = useState<any[]>([]);
  const [volantesReqs, setVolantesReqs] = useState<any[]>([]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [candidatos, setCandidatos] = useState<any[]>([]);

  useEffect(() => {
    // Recuperar usuário para controle de permissões
    const saved = localStorage.getItem("crm_user");
    if (saved) setUser(JSON.parse(saved));

    async function fetchUsuarios() {
      const { data, error } = await supabase.from('usuarios').select('*').order('nome');
      if (data) {
        setColaboradores(data.map(u => ({
          id: u.id,
          nome: u.nome,
          cargo: u.cargo || "ASG",
          unidade: u.unidade_alocacao || "Não alocado",
          telefone: u.telefone,
          status: u.status,
          admissao: u.data_admissao || "Desconhecida",
          nivel: u.nivel_acesso || 1,
          cpf: u.cpf || "000.000.000-00",
          avatar: (u.nome || "??").substring(0, 2).toUpperCase()
        })));
      }

      // Fetch candidates (Banco de Talentos)
      const { data: talentos } = await supabase.from('candidatos').select('*').order('created_at', { ascending: false });
      if (talentos) {
        setCandidatos(talentos);
      }

      // Fetch Horas Extras
      const { data: extras } = await supabase.from('horas_extras')
        .select('*, usuarios(nome, cargo)')
        .order('created_at', { ascending: false });
      if (extras) setHorasExtras(extras);

      // Fetch Volantes
      const { data: vreqs } = await supabase.from('requisicoes_volantes')
        .select('*, usuarios!requisicoes_volantes_solicitante_id_fkey(nome)')
        .order('created_at', { ascending: false });
      if (vreqs) setVolantesReqs(vreqs);
      
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  const filtrados = colaboradores.filter(c =>
    (filtro === "TODOS" || c.status === filtro) &&
    ((c.nome || "").toLowerCase().includes((busca || "").toLowerCase()) || 
     (c.cargo || "").toLowerCase().includes((busca || "").toLowerCase()) || 
     (c.unidade || "").toLowerCase().includes((busca || "").toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "calc(100vh - 120px)" }}>
      {/* Command Center: Ações Rápidas */}
      <div className="no-print">
        <QuickActions user={user || { role: 'COLABORADOR', nivel: 1 }} />
      </div>

      <div style={{ display: "flex", gap: "1.5rem", flex: 1, overflow: "hidden" }}>
        {/* Lista */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
          {/* Header e Abas */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Departamento Pessoal (DP)</h1>
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                <button onClick={() => setAba("ativos")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: aba === "ativos" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "ativos" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
                  Colaboradores ({colaboradores.length})
                </button>
                <button onClick={() => setAba("talentos")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: aba === "talentos" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "talentos" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
                  Banco de Talentos ({candidatos.length})
                </button>

                <button onClick={() => setAba("extras")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: aba === "extras" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "extras" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
                  Horas Extras ({horasExtras.length})
                </button>
                <button onClick={() => setAba("volantes")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: aba === "volantes" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "volantes" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
                  Equipe Volante ({volantesReqs.length})
                </button>
              </div>
            </div>

          </div>

          {/* Filtros */}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ flex: 1, maxWidth: "360px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="input-field !pl-10" placeholder="Buscar por nome, cargo, unidade..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "4px", background: "var(--bg-card)", borderRadius: "8px", padding: "4px", border: "1px solid var(--border)" }}>
              {["TODOS", "ATIVO", "AFASTADO", "INATIVO"].map(f => (
                <button key={f} className={`period-btn ${filtro === f ? "active" : ""}`} onClick={() => setFiltro(f)} style={{ fontSize: "0.75rem" }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Tabela Condicional */}
          <div className="card" style={{ flex: 1, overflow: "auto" }}>
            {aba === "ativos" ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Colaborador / Cargo", "CPF / Telefone", "Unidade", "Admissão", ...(user?.role === "RH_DP" || user?.role === "RH_PESSOAL" ? [] : ["Nível"]), "Status", "Ações"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: h === "Ações" ? "right" : "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Carregando dados...</td></tr>
                  ) : filtrados.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Nenhum colaborador encontrado.</td></tr>
                  ) : filtrados.map(c => (
                    <tr key={c.id} className="table-row" onClick={() => { setSelecionado(c); setNovoStatus(c.status); }} style={{ cursor: "pointer" }}>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--brand), var(--brand-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "white", flexShrink: 0 }}>{c.avatar}</div>
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{c.nome}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--brand)", fontWeight: 600 }}>{c.cargo}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>{c.cpf}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--info)" }}>{c.telefone}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.unidade}</td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.admissao}</td>
                      {!(user?.role === "RH_DP" || user?.role === "RH_PESSOAL") && (
                        <td style={{ padding: "0.875rem 1rem" }}>
                          <div className={`px-2 py-1 rounded text-[9px] font-black inline-block ${c.nivel === 1 ? "bg-gray-100 text-gray-500" : "bg-[var(--brand-alpha)] text-[var(--brand)]"}`}>
                            NÍVEL {c.nivel}
                          </div>
                        </td>
                      )}
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span className={`badge ${c.status === "ATIVO" ? "badge-green" : "badge-amber"}`}>
                          <span>● </span>{c.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                        <div className="flex gap-2 justify-end">
                          <button className="btn-ghost" style={{ padding: "4px 12px", height: "30px", fontSize: "0.7rem" }} onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/relatorios?id=ficha-epi&colab=${c.id}`; }}>
                            Imprimir EPI
                          </button>
                          <button className="btn-brand" style={{ padding: "4px 12px", height: "30px", fontSize: "0.7rem" }} onClick={(e) => { e.stopPropagation(); setSelecionado(c); }}>
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : aba === "talentos" ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Candidato / Vaga", "Data Inscrição", "Telefone", "Status", "Ação"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidatos.map(c => (
                    <tr key={c.id} className="table-row">
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>{c.nome}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>Vaga: {c.cargo}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.telefone}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span className="badge badge-amber">{c.status}</span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", display: "flex", gap: "0.5rem" }}>
                        <button className="btn-brand" onClick={() => alert("Recurso Desativado")} style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}>Ver Detalhes</button>
                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}>Descartar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : aba === "extras" ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Colaborador", "Unidade / Motivo", "Data / Horário", "Total", "Status"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {horasExtras.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Nenhum registro de extra informado.</td></tr>
                  ) : horasExtras.map(e => (
                    <tr key={e.id} className="table-row">
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{e.usuarios?.nome}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.usuarios?.cargo}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--brand)" }}>{e.unidade_alocacao}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.motivo}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{new Date(e.data_referencia).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--info)" }}>{e.hora_inicio} - {e.hora_fim}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--text-primary)" }}>{e.total_horas}h</span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span className={`badge ${e.status === 'PENDENTE' ? 'badge-amber' : 'badge-green'}`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Unidade / Motivo", "Solicitante", "Período", "Status", "Alocação"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {volantesReqs.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Nenhuma requisição de volante ativa.</td></tr>
                  ) : volantesReqs.map(v => (
                    <tr key={v.id} className="table-row">
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--brand)" }}>{v.unidade_destino}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{v.motivo}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>{v.usuarios?.nome || "Diretoria/RH PMG"}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600 }}>{new Date(v.data_inicio).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{v.data_fim ? `até ${new Date(v.data_fim).toLocaleDateString()}` : "Sem data fim"}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span className={`badge ${v.status === 'PENDENTE' ? 'badge-amber' : v.status === 'URGENTE' ? 'badge-red' : 'badge-green'}`}>{v.status}</span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div className="flex flex-wrap gap-1">
                          {v.colaboradores_alocados?.length > 0 ? (
                            <span className="text-[10px] font-black text-[var(--brand)]">{v.colaboradores_alocados.length} Colab. Alocados</span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">Aguardando Alocação</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


      </div>

      {/* Ficha 360 Arrastável */}
      <FichaColaborador360 
        colabId={selecionado?.id} 
        isOpen={!!selecionado} 
        onClose={() => setSelecionado(null)} 
        canEdit={user?.role === "GERENTE" || user?.role === "RH_DP" || user?.role === "RH_PESSOAL" || user?.role === "ADMIN"}
        restrictLevel={user?.role === "RH_DP" || user?.role === "RH_PESSOAL"}
      />
    </div>
  );
}
