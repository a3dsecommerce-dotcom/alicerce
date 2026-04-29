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
  const [aba, setAba] = useState<"ativos" | "talentos" | "vagas">("ativos");
  const [vagas, setVagas] = useState<any[]>([
    { id: '1', unidade: 'SEMED', cargo: 'ASG', quantidade: 5, status: 'ABERTA' },
    { id: '2', unidade: 'SEMSA', cargo: 'Porteiro', quantidade: 2, status: 'ABERTA' },
    { id: '3', unidade: 'UBS Norte', cargo: 'Recepcionista', quantidade: 1, status: 'URGENTE' },
    { id: '4', unidade: 'Hospital A', cargo: 'Zelador', quantidade: 3, status: 'ABERTA' }
  ]);
  const [selecionado, setSelecionado] = useState<any>(null);
  const [novoStatus, setNovoStatus] = useState("");
  const [showAdmitir, setShowAdmitir] = useState(false);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [formMaster, setFormMaster] = useState({
    nome: "", email: "", data_nascimento: "", sexo: "MASCULINO", etnia: "PARDO", nacionalidade: "BRASILEIRA", dependentes_qtd: 0,
    rg: "", cpf: "", pis: "", cargo: "ASG", unidade_alocacao: "", data_admissao: new Date().toISOString().split('T')[0], nivel_acesso: 1, insalubridade: 20,
    cep: "", rua: "", bairro: "", endereco_completo: "",
    tamanho_camisa: "G", tamanho_calca: "42", tamanho_sapato: "40",
    salario_base: 1412.00, valor_alimentacao: 600.00, valor_vale_transporte: 0
  });

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
                <button onClick={() => setAba("vagas")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600, color: aba === "vagas" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "vagas" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
                  Quadro de Vagas ({vagas.reduce((acc, v) => acc + v.quantidade, 0)})
                </button>
              </div>
            </div>
            {(user?.role === "GERENTE" || user?.role === "RH_PESSOAL" || user?.role === "ADMIN") && (
              <button className="btn-brand" onClick={() => setShowAdmitir(true)}>
                <Plus size={16} /> Admitir Direto
              </button>
            )}
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
                    {["Colaborador / Cargo", "CPF / Telefone", "Unidade", "Admissão", "Nível", "Status", "Ações"].map(h => (
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
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div className={`px-2 py-1 rounded text-[9px] font-black inline-block ${c.nivel === 1 ? "bg-gray-100 text-gray-500" : "bg-[var(--brand-alpha)] text-[var(--brand)]"}`}>
                          NÍVEL {c.nivel}
                        </div>
                      </td>
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
                        <button className="btn-brand" onClick={() => setShowAdmitir(true)} style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}>Aprovar (Admitir)</button>
                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}>Descartar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Unidade", "Cargo", "Vagas Abertas", "Prioridade", "Ações"].map(h => (
                      <th key={h} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vagas.map(v => (
                    <tr key={v.id} className="table-row">
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{v.unidade}</td>
                      <td style={{ padding: "0.875rem 1rem" }}><span className={`badge ${cargoCores[v.cargo] || "badge-blue"}`}>{v.cargo}</span></td>
                      <td style={{ padding: "0.875rem 1rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--brand)" }}>{v.quantidade}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span className={`badge ${v.status === 'URGENTE' ? 'badge-red' : 'badge-amber'}`}>{v.status}</span>
                      </td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <button className="btn-ghost" onClick={() => alert("Gerenciar Vaga...")}>Gerenciar Vaga</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Lado Direito: Inteligência Operacional & Efetivo */}
        <div className="flex flex-col gap-6 w-[350px] overflow-y-auto pr-2 custom-scrollbar no-print">
          <TicketHub />
          <ColaboradoresSharedTable />
          <div className="card p-6 bg-orange-500/5 border-orange-500/20">
            <h4 className="text-xs font-black text-orange-500 uppercase mb-4">Meta de Contratação</h4>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Filtre por cargo acima para ver o déficit por unidade.</p>
          </div>
        </div>
      </div>

      {/* Ficha 360 Arrastável */}
      <FichaColaborador360 
        colabId={selecionado?.id} 
        isOpen={!!selecionado} 
        onClose={() => setSelecionado(null)} 
        canEdit={user?.role === "GERENTE" || user?.role === "RH_PESSOAL" || user?.role === "ADMIN"}
      />

      {/* Modal Admitir Master - RESTAURADO COMPLETO */}
      <AdaptiveModal
        title="Cadastro Master de Colaborador (Unificado)"
        isOpen={showAdmitir}
        onClose={() => setShowAdmitir(false)}
        width="1000px"
      >
        <div className="flex flex-col gap-8 max-h-[80vh] overflow-y-auto pr-4 custom-scrollbar">
          <div className="flex items-center justify-between bg-[var(--brand)]/5 p-4 rounded-2xl border border-[var(--brand)]/20 -mt-2">
            <div>
              <h4 className="text-[var(--brand)] font-black text-sm uppercase tracking-widest">Admissão Master Digital</h4>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">Este cadastro alimenta simultaneamente o DP, Almoxarifado e Ponto.</p>
            </div>
            <ShieldCheck size={24} className="text-[var(--brand)] opacity-50" />
          </div>

          <div className="flex flex-col gap-10">
            {/* 1. IDENTIFICAÇÃO CIVIL */}
            <section className="animate-fade-in">
              <h3 className="text-[var(--brand)] text-[0.85rem] font-black uppercase tracking-wider mb-5 border-b-2 border-[var(--brand)]/20 pb-2 flex items-center gap-2">
                <User size={16} /> 1. Identificação Civil e Filiação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label className="label-sm">Nome Completo</label>
                  <input className="input-field w-full" value={formMaster.nome} onChange={e => setFormMaster({...formMaster, nome: e.target.value})} placeholder="Nome Completo" />
                </div>
                <div>
                  <label className="label-sm">E-mail Pessoal</label>
                  <input className="input-field w-full" value={formMaster.email} onChange={e => setFormMaster({...formMaster, email: e.target.value})} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="label-sm">Data de Nascimento</label>
                  <input type="date" className="input-field w-full" value={formMaster.data_nascimento} onChange={e => setFormMaster({...formMaster, data_nascimento: e.target.value})} />
                </div>
                <div>
                  <label className="label-sm">Sexo</label>
                  <select className="input-field w-full" value={formMaster.sexo} onChange={e => setFormMaster({...formMaster, sexo: e.target.value})}>
                    <option>MASCULINO</option>
                    <option>FEMININO</option>
                    <option>OUTRO</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Dependentes</label>
                  <input type="number" className="input-field w-full" value={formMaster.dependentes_qtd} onChange={e => setFormMaster({...formMaster, dependentes_qtd: parseInt(e.target.value)})} />
                </div>
              </div>
            </section>

            {/* 2. DOCUMENTAÇÃO E CONTRATO */}
            <section className="animate-fade-in">
              <h3 className="text-[var(--brand)] text-[0.85rem] font-black uppercase tracking-wider mb-5 border-b-2 border-[var(--brand)]/20 pb-2 flex items-center gap-2">
                <FileText size={16} /> 2. Documentação e Vínculo Contratual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="label-sm">CPF</label>
                  <input className="input-field w-full" value={formMaster.cpf} onChange={e => setFormMaster({...formMaster, cpf: e.target.value})} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="label-sm">RG</label>
                  <input className="input-field w-full" value={formMaster.rg} onChange={e => setFormMaster({...formMaster, rg: e.target.value})} placeholder="00.000.000-0" />
                </div>
                <div>
                  <label className="label-sm">PIS / PASEP</label>
                  <input className="input-field w-full" value={formMaster.pis} onChange={e => setFormMaster({...formMaster, pis: e.target.value})} placeholder="000.00000.00-0" />
                </div>
                <div>
                  <label className="label-sm">Cargo</label>
                  <select className="input-field w-full" value={formMaster.cargo} onChange={e => setFormMaster({...formMaster, cargo: e.target.value})}>
                    <option>ASG</option>
                    <option>Porteiro</option>
                    <option>Zelador</option>
                    <option>Encarregado</option>
                    <option>Recepcionista</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Data de Admissão</label>
                  <input type="date" className="input-field w-full" value={formMaster.data_admissao} onChange={e => setFormMaster({...formMaster, data_admissao: e.target.value})} />
                </div>
                <div>
                  <label className="label-sm">Unidade de Alocação</label>
                  <input className="input-field w-full" value={formMaster.unidade_alocacao} onChange={e => setFormMaster({...formMaster, unidade_alocacao: e.target.value})} placeholder="Ex: SEMED" />
                </div>
                <div>
                  <label className="label-sm">Insalubridade (%)</label>
                  <select className="input-field w-full" value={formMaster.insalubridade} onChange={e => setFormMaster({...formMaster, insalubridade: parseInt(e.target.value)})}>
                    <option value="0">0%</option>
                    <option value="20">20%</option>
                    <option value="40">40%</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Nível de Acesso</label>
                  <select className="input-field w-full" value={formMaster.nivel_acesso} onChange={e => setFormMaster({...formMaster, nivel_acesso: parseInt(e.target.value)})}>
                    <option value="1">NÍVEL 1 (Campo)</option>
                    <option value="2">NÍVEL 2 (Operacional)</option>
                    <option value="3">NÍVEL 3 (Gestor)</option>
                    <option value="4">NÍVEL 4 (Master)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 3. RESIDÊNCIA E LOCALIZAÇÃO */}
            <section className="animate-fade-in">
              <h3 className="text-[var(--brand)] text-[0.85rem] font-black uppercase tracking-wider mb-5 border-b-2 border-[var(--brand)]/20 pb-2 flex items-center gap-2">
                <MapPin size={16} /> 3. Residência e Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="label-sm">CEP</label>
                  <input className="input-field w-full" value={formMaster.cep} onChange={e => setFormMaster({...formMaster, cep: e.target.value})} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="label-sm">Rua / Avenida</label>
                  <input className="input-field w-full" value={formMaster.rua} onChange={e => setFormMaster({...formMaster, rua: e.target.value})} placeholder="Nome da via..." />
                </div>
                <div>
                  <label className="label-sm">Bairro</label>
                  <input className="input-field w-full" value={formMaster.bairro} onChange={e => setFormMaster({...formMaster, bairro: e.target.value})} placeholder="Bairro" />
                </div>
                <div className="md:col-span-2">
                  <label className="label-sm">Cidade</label>
                  <input className="input-field w-full" value="Manaus / AM" disabled />
                </div>
              </div>
            </section>

            {/* 4. LOGÍSTICA E FINANCEIRO */}
            <section className="animate-fade-in">
              <h3 className="text-[var(--brand)] text-[0.85rem] font-black uppercase tracking-wider mb-5 border-b-2 border-[var(--brand)]/20 pb-2 flex items-center gap-2">
                <Package size={16} /> 4. Logística de Uniformes e Salário
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-[var(--bg-base)] rounded-3xl border border-[var(--border)]">
                <div>
                  <label className="label-sm">Tamanho Camisa</label>
                  <select className="input-field w-full" value={formMaster.tamanho_camisa} onChange={e => setFormMaster({...formMaster, tamanho_camisa: e.target.value})}>
                    <option>P</option><option>M</option><option>G</option><option>GG</option><option>EXG</option>
                  </select>
                </div>
                <div>
                  <label className="label-sm">Número Calça</label>
                  <input type="number" className="input-field w-full" value={formMaster.tamanho_calca} onChange={e => setFormMaster({...formMaster, tamanho_calca: e.target.value})} />
                </div>
                <div>
                  <label className="label-sm">Número Sapato</label>
                  <input type="number" className="input-field w-full" value={formMaster.tamanho_sapato} onChange={e => setFormMaster({...formMaster, tamanho_sapato: e.target.value})} />
                </div>
                <div>
                  <label className="label-sm">Salário Base (R$)</label>
                  <input type="number" className="input-field w-full text-green-600 font-bold" value={formMaster.salario_base} onChange={e => setFormMaster({...formMaster, salario_base: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="label-sm">Vale Alimentação (R$)</label>
                  <input type="number" className="input-field w-full" value={formMaster.valor_alimentacao} onChange={e => setFormMaster({...formMaster, valor_alimentacao: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="label-sm">Vale Transporte (Opcional)</label>
                  <input type="number" className="input-field w-full" value={formMaster.valor_vale_transporte} onChange={e => setFormMaster({...formMaster, valor_vale_transporte: parseFloat(e.target.value)})} />
                </div>
              </div>
            </section>

            <div className="flex gap-4 pt-8 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-card)] pb-4">
              <button className="flex-1 btn-ghost !h-14" onClick={() => setShowAdmitir(false)}>Cancelar</button>
              <button 
                className="flex-[2] btn-brand !h-14 !text-[1rem] shadow-xl shadow-[var(--brand)]/20" 
                onClick={() => { 
                  setLoading(true);
                  // Simulação de disparo n8n
                  n8n.trigger('admissao-master-central', formMaster);
                  setTimeout(() => {
                    setLoading(false);
                    alert("Colaborador Admitido com Sucesso! Cadastro Master consolidado."); 
                    setShowAdmitir(false); 
                  }, 1500);
                }}
                disabled={loading || !formMaster.nome || !formMaster.cpf}
              >
                {loading ? <Loader className="animate-spin" /> : "Efetivar Admissão Master"}
              </button>
            </div>
          </div>
        </div>
      </AdaptiveModal>
    </div>
  );
}
