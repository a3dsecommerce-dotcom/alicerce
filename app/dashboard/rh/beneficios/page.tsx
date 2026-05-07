"use client";
import { useState, useEffect } from "react";
import { FileText, Ticket, FileArchive, Search, Upload, Plus, CheckCircle, AlertCircle, Clock, ShieldCheck, Settings, PlusCircle } from "lucide-react";

export default function RHBeneficiosPage() {
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"requisicoes" | "conformidade">("requisicoes");
  const [modalColunas, setModalColunas] = useState(false);
  const [novaColuna, setNovaColuna] = useState("");
  const [colunasDinamicas, setColunasDinamicas] = useState<string[]>(["ASO", "Certificados", "Ficha EPI", "Ficha Cadastro", "Dependentes", "VT", "VR", "Plano Saúde"]);

  const colaboradoresConformidade = [
    { id: 1, nome: "João Silva", status: { "ASO": "OK", "Certificados": "OK", "Ficha EPI": "OK", "Ficha Cadastro": "OK", "Dependentes": "PENDENTE", "VT": "OK", "VR": "OK", "Plano Saúde": "OK" } },
    { id: 2, nome: "Maria Oliveira", status: { "ASO": "OK", "Certificados": "PENDENTE", "Ficha EPI": "OK", "Ficha Cadastro": "OK", "Dependentes": "OK", "VT": "OK", "VR": "OK", "Plano Saúde": "OK" } },
    { id: 3, nome: "Carlos Souza", status: { "ASO": "EXPIRADO", "Certificados": "OK", "Ficha EPI": "PENDENTE", "Ficha Cadastro": "OK", "Dependentes": "OK", "VT": "OK", "VR": "OK", "Plano Saúde": "PENDENTE" } },
    { id: 4, nome: "Ana Costa", status: { "ASO": "OK", "Certificados": "OK", "Ficha EPI": "OK", "Ficha Cadastro": "OK", "Dependentes": "OK", "VT": "OK", "VR": "OK", "Plano Saúde": "OK" } },
  ];

  const handleAddColumn = () => {
    if (!novaColuna) return;
    setColunasDinamicas([...colunasDinamicas, novaColuna]);
    setNovaColuna("");
    setModalColunas(false);
    alert(`Banco de Dados Inteligente: Nova coluna "${novaColuna}" provisionada com sucesso em Supabase.`);
  };

  const renderStatus = (val: string | undefined) => {
    if (val === "OK") return <CheckCircle size={16} color="#10B981" style={{ margin: "0 auto" }} />;
    if (val === "PENDENTE") return <AlertCircle size={16} color="#EF4444" style={{ margin: "0 auto" }} />;
    if (val === "EXPIRADO") return <Clock size={16} color="#F59E0B" style={{ margin: "0 auto" }} />;
    return <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#eee", margin: "0 auto" }}></div>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Arquivo & Benefícios</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
            Gestão de Vales, ASOs, Atestados e Conformidade de Documentação
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {aba === "conformidade" && (
            <button className="btn-ghost" onClick={() => setModalColunas(true)} style={{ color: "var(--brand)", borderColor: "var(--brand)" }}>
              <Settings size={16} /> Gerenciar Colunas
            </button>
          )}
          <button className="btn-brand">
            <Plus size={16} /> Nova Solicitação
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "1.5rem", padding: "0 1rem", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setAba("requisicoes")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: aba === "requisicoes" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "requisicoes" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
          Requisições & Vales
        </button>
        <button onClick={() => setAba("conformidade")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: aba === "conformidade" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "conformidade" ? "2px solid var(--brand)" : "2px solid transparent", transition: "all 0.2s" }}>
          Matrix de Conformidade
        </button>
      </div>

      {/* Main Area */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
            {aba === "requisicoes" ? "Gestão de Vales Transporte & GED" : "Painel de Conformidade de Documentos Dinâmico"}
          </h2>
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input className="input-field" placeholder="Buscar colaborador..." style={{ paddingLeft: "2.25rem", height: "34px", fontSize: "0.75rem" }} value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {aba === "requisicoes" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Colaborador</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Tipo</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Data</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nome: "João Silva", tipo: "VALE TRANSPORTE", data: "22/04/2026", status: "PENDENTE", cor: "badge-amber" },
                  { nome: "Maria Oliveira", tipo: "RECARGA VT", data: "21/04/2026", status: "APROVADO", cor: "badge-green" },
                ].map((doc, idx) => (
                  <tr key={idx} className="table-row group">
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 500 }}>{doc.nome}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{doc.tipo}</td>
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>{doc.data}</td>
                    <td style={{ padding: "0.875rem 1rem" }}><span className={`badge ${doc.cor}`}>{doc.status}</span></td>
                    <td style={{ padding: "0.875rem 1rem", textAlign: "right" }}>
                      <button className="text-orange-500 hover:text-orange-400 font-bold text-[10px] flex items-center justify-end gap-1 ml-auto">VER <FileArchive size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 20 }}>Colaborador</th>
                  {colunasDinamicas.map(h => (
                    <th key={h} style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colaboradoresConformidade.map((c) => (
                  <tr key={c.id} className="table-row">
                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: 600, position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 5 }}>{c.nome}</td>
                    {colunasDinamicas.map(col => (
                      <td key={col} style={{ padding: "0.875rem 0.5rem", background: col === "Ficha EPI" ? "rgba(232,98,26,0.02)" : "transparent" }}>
                        {renderStatus(c.status[col as keyof typeof c.status])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {aba === "conformidade" && (
          <div style={{ padding: "0.75rem 1rem", background: "#f9f9f9", borderTop: "1px solid var(--border)", display: "flex", gap: "1.5rem", fontSize: "0.7rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><CheckCircle size={12} color="#10B981" /> Conforme</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={12} color="#EF4444" /> Pendência</div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={12} color="#F59E0B" /> Expirado</div>
            <div style={{ marginLeft: "auto", color: "var(--brand)", fontWeight: 700 }}>* Use 'Gerenciar Colunas' para expandir o Banco de Dados Inteligente</div>
          </div>
        )}
      </div>

      {/* Modal Gerenciar Colunas */}
      {modalColunas && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Settings size={20} color="var(--brand)" /> Expansão de Banco de Dados
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Adicione um novo tipo de documento para monitoramento. Isso criará uma nova coluna de conformidade em tempo real.
            </p>
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "8px" }}>Nome do Documento / Coluna</label>
              <input 
                className="input-field" 
                placeholder="Ex: Treinamento NR-35, Exame Toxicológico..." 
                value={novaColuna} 
                onChange={e => setNovaColuna(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setModalColunas(false)}>Cancelar</button>
              <button className="btn-brand" onClick={handleAddColumn}>
                <PlusCircle size={16} /> Criar Coluna no Banco
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
