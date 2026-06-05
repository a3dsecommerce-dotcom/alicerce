"use client";
import { useState } from "react";
import { 
  Megaphone, UserX, FileSpreadsheet, Download, 
  Trash2, ShieldCheck, Zap, Users, PackageCheck, 
  BarChart3, Search, Send, AlertTriangle, Printer, Activity, Truck, FileText
} from "lucide-react";
import dynamic from "next/dynamic";

const EntregasChart = dynamic(() => import("../components/EntregasChart"), { 
  ssr: false, 
  loading: () => <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Carregando dados...</div> 
});
import VirtualizedTable from "../components/VirtualizedTable";

// Mock Data para Relatório de Entregas x Requisições
const dataEntregas = [
  { mes: "Jan", requisitado: 450, entregue: 440 },
  { mes: "Fev", requisitado: 520, entregue: 480 },
  { mes: "Mar", requisitado: 600, entregue: 595 },
  { mes: "Abr", requisitado: 480, entregue: 475 },
];

export default function IntelPage() {
  const [aba, setAba] = useState<"broadcast" | "demissao" | "auditoria" | "export" | "logs" | "logistica">("broadcast");
  const [loading, setLoading] = useState(false);
  const [masterEdit, setMasterEdit] = useState(false);
  const [auditLog, setAuditLog] = useState([
    { hora: "20:45", acao: "Alteração de Saldo", item: "Papel Toalha", quem: "Gerente Mestre", ip: "192.168.1.1" },
    { hora: "19:12", acao: "Correção de Ponto", item: "Colab: João Silva", quem: "Gerente Mestre", ip: "192.168.1.1" },
  ]);

  const [systemLogs, setSystemLogs] = useState([
    { id: "L1", hora: "20:55:12", evento: "LOGIN", usuario: "Diretor Nabuco", detalhes: "Acesso via Chrome/Windows", ip: "187.12.33.4", critico: false },
    { id: "L2", hora: "20:50:05", evento: "REQ_MATERIAL", usuario: "Comprador SEMED", detalhes: "Requisição #8821 criada", ip: "187.12.33.9", critico: false },
    { id: "L3", hora: "20:42:33", evento: "ALTERACAO_DADO", usuario: "Gerente Mestre", detalhes: "Mudança de Cargo: João Silva", ip: "192.168.1.1", critico: true },
    { id: "L4", hora: "20:30:11", evento: "UPLOAD_DOC", usuario: "Diretor Geraldo", detalhes: "Atestado_Medico_Ricardo.pdf", ip: "187.55.12.2", critico: false },
    { id: "L5", hora: "20:15:00", evento: "PONTO_WHATSAPP", usuario: "ASG Maria", detalhes: "Check-in: UBS Norte", ip: "WhatsApp-API", critico: false },
  ]);

  const handleBroadcast = () => {
    setLoading(true);
    setTimeout(() => {
      alert("Aviso disparado com sucesso para 247 colaboradores via WhatsApp e Portal.");
      setLoading(false);
    }, 1500);
  };

  const handleDemissao = (nome: string) => {
    if (confirm(`ATENÇÃO: Deseja iniciar o protocolo de DEMISSÃO INSTANTÂNEA para ${nome}? Isso bloqueará todos os acessos imediatamente.`)) {
      alert(`Protocolo Executado: ${nome} teve os acessos ao Portal e WhatsApp suspensos. Dados movidos para o Arquivo Morto.`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Intel BI & Gestão Mestre</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
            Ferramentas Administrativas de Alto Nível e Auditoria Geral
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button 
            className={masterEdit ? "btn-brand" : "btn-ghost"} 
            onClick={() => setMasterEdit(!masterEdit)}
            style={{ background: masterEdit ? "var(--danger)" : "", color: masterEdit ? "white" : "", border: masterEdit ? "none" : "" }}
          >
            {masterEdit ? <Zap size={16} /> : <ShieldCheck size={16} />} 
            {masterEdit ? "MODO EDIÇÃO MESTRE: ON" : "Ativar Edição Mestre"}
          </button>
          <button className="btn-ghost" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir Dashboard
          </button>
        </div>
      </div>

      {/* Tabs Gestor */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "1rem", borderBottom: "1px solid var(--border)", gap: "1.5rem", overflowX: "auto" }}>
          <button onClick={() => setAba("broadcast")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "broadcast" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "broadcast" ? "2px solid var(--brand)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <Megaphone size={14} style={{ marginRight: "6px" }} /> Disparo em Massa
          </button>
          <button onClick={() => setAba("demissao")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "demissao" ? "var(--danger)" : "var(--text-muted)", borderBottom: aba === "demissao" ? "2px solid var(--danger)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <UserX size={14} style={{ marginRight: "6px" }} /> Demissão Instantânea
          </button>
          <button onClick={() => setAba("auditoria")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "auditoria" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "auditoria" ? "2px solid var(--brand)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <BarChart3 size={14} style={{ marginRight: "6px" }} /> Entregas x Requisições
          </button>
          <button onClick={() => setAba("export")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "export" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "export" ? "2px solid var(--brand)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <FileSpreadsheet size={14} style={{ marginRight: "6px" }} /> Exportar Dados (Excel)
          </button>
          <button onClick={() => setAba("logs")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "logs" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "logs" ? "2px solid var(--brand)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <Activity size={14} style={{ marginRight: "6px" }} /> Forense & Logs
          </button>
          <button onClick={() => setAba("logistica")} style={{ background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: aba === "logistica" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "logistica" ? "2px solid var(--brand)" : "2px solid transparent", whiteSpace: "nowrap" }}>
            <Truck size={14} style={{ marginRight: "6px" }} /> Monitor Logístico 🚛
          </button>
        </div>

        <div style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
          {aba === "broadcast" && (
            <div style={{ maxWidth: "600px" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Disparo de Comunicado em Massa</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Público Alvo Granular</label>
                  <select className="input-field">
                    <option>Todos os Colaboradores (247)</option>
                    <option>Apenas Encarregados de Rota</option>
                    <option>Apenas Diretores PMG (Escolas/UBS)</option>
                    <option>Setor: Almoxarifado / Logística</option>
                    <option>Função: Apenas ASGs</option>
                    <option>Função: Apenas Porteiros</option>
                    <option>Unidade: Apenas Hospital Regional</option>
                    <option>Turno: Apenas Noturno</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Canal de Disparo</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}><input type="checkbox" defaultChecked /> WhatsApp Business</label>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}><input type="checkbox" defaultChecked /> Portal (Push)</label>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Mensagem</label>
                  <textarea className="input-field" style={{ minHeight: "150px", paddingTop: "0.5rem" }} placeholder="Escreva o aviso oficial aqui..." />
                </div>
                <button className="btn-brand" style={{ height: "48px" }} onClick={handleBroadcast} disabled={loading}>
                  {loading ? "Processando Disparo..." : "Enviar Aviso Agora"}
                </button>
              </div>
            </div>
          )}

          {aba === "demissao" && (
            <div style={{ maxWidth: "700px" }}>
              <div className="card" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", padding: "1rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <AlertTriangle color="#EF4444" size={20} />
                  <div style={{ fontSize: "0.85rem", color: "#EF4444", fontWeight: 600 }}>
                    Protocolo de Exclusão Imediata: O bloqueio é irreversível via sistema.
                  </div>
                </div>
              </div>
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Buscar Colaborador para Desligamento</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
                <input className="input-field" placeholder="Nome, CPF ou Matrícula..." />
                <button className="btn-brand" style={{ background: "var(--text-primary)" }}>Buscar</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { nome: "João da Silva", cargo: "ASG", unidade: "SEMED", status: "ATIVO" },
                  { nome: "Maria Oliveira", cargo: "Porteiro", unidade: "SEMSA", status: "ATIVO" }
                ].map((c, i) => (
                  <div key={i} className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{c.nome}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.cargo} | {c.unidade}</div>
                    </div>
                    <button className="btn-brand" style={{ background: "var(--danger)", border: "none", fontSize: "0.75rem", height: "32px" }} onClick={() => handleDemissao(c.nome)}>
                      <Zap size={14} /> Demissão Instantânea
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === "auditoria" && (
            <div style={{ height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>Eficiência Logística: Entregas x Requisições</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Relatório para Apresentação à Prefeitura (PMG)</p>
                </div>
                <button className="btn-ghost" style={{ fontSize: "0.75rem" }} onClick={() => alert("Gerando PDF oficial...")}>
                  <Download size={14} /> Exportar PDF Oficial
                </button>
              </div>
              <div style={{ height: "300px", marginBottom: "2rem" }}>
                  <EntregasChart data={dataEntregas} />
              </div>
              <div className="card" style={{ padding: "1.25rem", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div style={{ display: "flex", gap: "15px" }}>
                  <PackageCheck color="#10B981" size={24} />
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10B981" }}>Taxa de Atendimento: 98.2%</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>A Alicerce cumpre rigorosamente os SLAs contratuais de abastecimento.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {aba === "export" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {[
                { title: "Base de Colaboradores", icon: Users, rows: "247 registros" },
                { title: "Histórico de Ponto", icon: Clock, rows: "12,402 registros" },
                { title: "Movimentação de Estoque", icon: Package, rows: "3,110 registros" },
                { title: "Relatório de Ocorrências", icon: AlertTriangle, rows: "84 registros" }
              ].map((e, i) => (
                <div key={i} className="card" style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ padding: "0.75rem", background: "var(--bg-surface)", borderRadius: "10px" }}>
                      <e.icon size={20} color="var(--brand)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{e.title}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.rows}</div>
                    </div>
                  </div>
                  <button className="btn-ghost" style={{ padding: "8px" }} onClick={() => alert(`Exportando ${e.title} para .XLSX...`)}>
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {aba === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", margin: 0 }}>Rastro Forense do Sistema</h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Seguindo todos os passos de todos os usuários em tempo real.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                   <input className="input-field" placeholder="Filtrar por usuário ou IP..." style={{ height: "32px", fontSize: "0.75rem", width: "200px" }} />
                   <select className="input-field" style={{ height: "32px", fontSize: "0.75rem", width: "150px" }}>
                     <option>Todos os Eventos</option>
                     <option>Apenas Críticos</option>
                     <option>Apenas WhatsApp</option>
                     <option>Apenas Portal</option>
                   </select>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "10px", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "bold" }}>
                  <div style={{ width: "80px" }}>HORA</div>
                  <div style={{ width: "140px" }}>EVENTO</div>
                  <div style={{ width: "150px" }}>USUÁRIO</div>
                  <div style={{ flex: 1 }}>DETALHES DO PASSO</div>
                  <div style={{ width: "160px" }}>METADADOS (IP/DEV)</div>
                </div>
                <VirtualizedTable
                  items={systemLogs}
                  height={300}
                  itemSize={42}
                  renderRow={(log, index) => (
                    <div style={{ display: "flex", alignItems: "center", padding: "0 10px", borderBottom: "1px solid var(--border-light)", fontSize: "0.75rem", height: "100%" }}>
                      <div style={{ width: "80px", color: "var(--text-muted)" }}>{log.hora}</div>
                      <div style={{ width: "140px" }}>
                        <span className={`badge ${log.critico ? 'badge-red' : 'badge-blue'}`} style={{ fontSize: "0.6rem" }}>{log.evento}</span>
                      </div>
                      <div style={{ width: "150px", fontWeight: 600 }}>{log.usuario}</div>
                      <div style={{ flex: 1, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "10px" }}>{log.detalhes}</div>
                      <div style={{ width: "160px", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.ip}</div>
                    </div>
                  )}
                />
              </div>

              <div className="card" style={{ padding: "1rem", background: "rgba(59,130,246,0.05)", border: "1px dashed var(--brand)" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <Zap size={20} color="var(--brand)" />
                  <div style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>
                    <strong>Dica de Auditoria:</strong> Use o IP para rastrear se múltiplos usuários estão acessando o sistema do mesmo local físico ou dispositivo.
                  </div>
                </div>
              </div>
            </div>
          )}

          {aba === "logistica" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", margin: 0 }}>Acompanhamento de Entregas Terceirizadas</h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Consolidado de materiais: O que já chegou vs. O que falta chegar.</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select className="input-field" style={{ height: "34px", fontSize: "0.75rem", width: "120px" }}>
                      <option>Abril 2026</option>
                      <option>Março 2026</option>
                    </select>
                    <button className="btn-brand" style={{ height: "34px", fontSize: "0.75rem", padding: "0 1rem" }} onClick={() => alert("Gerando Relatório de Transparência Mensal...")}>
                      <FileText size={14} style={{ marginRight: "6px" }} /> Gerar Relatório Mensal
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                {[
                  { secretaria: "SEMED (Educação)", progresso: 85, itens: 1200, falta: 180, cor: "#10B981" },
                  { secretaria: "SEMSA (Saúde)", progresso: 62, itens: 850, falta: 323, cor: "#3B82F6" },
                  { secretaria: "SEMAD (Administração)", progresso: 95, itens: 400, falta: 20, cor: "#00d2ff" },
                ].map((s, i) => (
                  <div key={i} className="card" style={{ padding: "1.5rem", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.5rem" }}>{s.secretaria}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Fulfillment: {s.progresso}%</span>
                      <span style={{ fontWeight: 600, color: s.cor }}>{s.itens - s.falta} / {s.itens} itens</span>
                    </div>
                    <div style={{ background: "var(--bg-base)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "1rem" }}>
                      <div style={{ background: s.cor, width: `${s.progresso}%`, height: "100%" }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", padding: "8px", background: "rgba(245,158,11,0.1)", borderRadius: "6px", color: "#D97706", fontWeight: 600 }}>
                      <AlertTriangle size={12} style={{ marginRight: "4px" }} /> Falta Chegar: {s.falta} itens nesta remessa
                    </div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "1rem", background: "var(--bg-card)", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", fontWeight: 700 }}>
                  Detalhamento de Pendências por Requisição
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--bg-base)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <tr>
                      <th style={{ padding: "12px", textAlign: "left" }}>REQ #</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>SECRETARIA</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>ITEM PENDENTE</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>SOLICITADO</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>JÁ CHEGOU</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>FALTA CHEGAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { req: "8821", sec: "SEMED", item: "Papel Toalha Interfolha", solicitado: 200, chegou: 150, falta: 50, nf: "1420", data: "24/04" },
                      { req: "8821", sec: "SEMED", item: "Desinfetante Floral 5L", solicitado: 40, chegou: 20, falta: 20, nf: "1420", data: "24/04" },
                      { req: "8790", sec: "SEMSA", item: "Sabonete Líquido 5L", solicitado: 30, chegou: 5, falta: 25, nf: "1395", data: "22/04" },
                      { req: "8750", sec: "SEMAD", item: "Copo Descartável 200ml", solicitado: 100, chegou: 100, falta: 0, nf: "1380", data: "20/04" },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-light)", fontSize: "0.8rem", background: row.falta === 0 ? "rgba(16,185,129,0.02)" : "transparent" }}>
                        <td style={{ padding: "12px", fontWeight: 600 }}>#{row.req}</td>
                        <td style={{ padding: "12px" }}>{row.sec}</td>
                        <td style={{ padding: "12px", fontWeight: 500 }}>{row.item}</td>
                        <td style={{ padding: "12px", textAlign: "center" }}>{row.solicitado}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: "var(--brand)", fontWeight: 600 }}>{row.chegou}</td>
                        <td style={{ padding: "12px", textAlign: "center", color: row.falta > 0 ? "#EF4444" : "var(--text-muted)", fontWeight: 700 }}>{row.falta > 0 ? row.falta : "✓ OK"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log de Edição Mestre */}
      <div className="card" style={{ padding: "1.25rem", border: masterEdit ? "2px solid var(--danger)" : "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={16} color="var(--brand)" />
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>Rastro de Auditoria (Master Edits)</h3>
          </div>
          {masterEdit && <span className="badge badge-red" style={{ animation: "pulse 2s infinite" }}>SISTEMA EM MODO EDIÇÃO ELEVADA</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {auditLog.map((log, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px", background: "var(--bg-surface)", borderRadius: "6px", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", gap: "15px" }}>
                <span style={{ color: "var(--text-muted)" }}>{log.hora}</span>
                <span style={{ fontWeight: 700, color: "var(--brand)" }}>{log.acao}</span>
                <span style={{ color: "var(--text-primary)" }}>{log.item}</span>
              </div>
              <div style={{ color: "var(--text-muted)" }}>{log.quem} ({log.ip})</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Helper icons for the export section
function Clock({ size, color }: any) { return <BarChart3 size={size} color={color} />; }
function Package({ size, color }: any) { return <PackageCheck size={size} color={color} />; }
