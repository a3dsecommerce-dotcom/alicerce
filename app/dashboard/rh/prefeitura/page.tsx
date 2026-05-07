"use client";
import { useState, useEffect } from "react";
import { Users, Briefcase, Zap, Search, Plus, MapPin, School, Building2, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function RHPrefeituraPage() {
  const [aba, setAba] = useState<"indicadores" | "lista" | "vagas" | "volante" | "compras" | "suporte">("indicadores");
  const [secSelecionada, setSecSelecionada] = useState<string>("SEMED");
  const [userRole, setUserRole] = useState("RH_PREFEITURA"); 

  const secretarias = [
    { id: "SEMED", nome: "Educação (SEMED)", ativos: 145, asgs: 110, vagas: 12, postos: 42 },
    { id: "SEMSA", nome: "Saúde (SEMSA)", ativos: 89, asgs: 65, vagas: 5, postos: 18 },
    { id: "SEMAD", nome: "Admin (SEMAD)", ativos: 34, asgs: 12, vagas: 2, postos: 4 },
    { id: "SEMOB", nome: "Obras (SEMOB)", ativos: 56, asgs: 48, vagas: 8, postos: 6 }
  ];

  const [colaboradoresPMG, setColaboradoresPMG] = useState([
    { id: 1, sec: "SEMED", unidade: "Escola Joaquim Nabuco", nome: "Ana Paula Silva", funcao: "ASG", fone: "(92) 98111-0001", status: "ATIVO", insalubridade: "20%", horario: "07:00 - 16:00" },
    { id: 2, sec: "SEMED", unidade: "Escola Joaquim Nabuco", nome: "Ricardo Melo", funcao: "Porteiro", fone: "(92) 98111-0002", status: "AFASTADO", insalubridade: "N/A", horario: "12x36 (Diurno)" },
    { id: 3, sec: "SEMSA", unidade: "UBS Norte - Geraldo", nome: "Maria Joana", funcao: "ASG", fone: "(92) 98222-0001", status: "ATIVO", insalubridade: "40%", horario: "07:00 - 16:00" },
    { id: 4, sec: "SEMAD", unidade: "Sede Administrativa", nome: "Carlos Eduardo", funcao: "Aux. Serviços", fone: "(92) 98333-0001", status: "ATIVO", insalubridade: "20%", horario: "08:00 - 17:00" },
  ]);

  const [compras, setCompras] = useState([
    { id: "REQ-001", item: "Kit Limpeza Semestral", unidade: "SEMED", status: "EM ENTREGA", data: "2024-04-20" },
    { id: "REQ-002", item: "Novos Uniformes ASG", unidade: "SEMSA", status: "APROVADO", data: "2024-04-22" }
  ]);

  const [modalAjuste, setModalAjuste] = useState<{ colab: any, campo: 'insalubridade' | 'horario', valor: string } | null>(null);

  const handleAjusteRH = (colaborador: any, campo: 'insalubridade' | 'horario') => {
    setModalAjuste({ colab: colaborador, campo, valor: colaborador[campo] });
  };

  const confirmarAjuste = () => {
    if (modalAjuste) {
      n8n.trigger('ajuste-colaborador-pmg', {
        colaborador: modalAjuste.colab.nome,
        campo: modalAjuste.campo === 'insalubridade' ? 'Insalubridade' : 'Horário de Trabalho',
        de: modalAjuste.colab[modalAjuste.campo],
        para: modalAjuste.valor,
        solicitante: "RH PREFEITURA",
        secretaria: secSelecionada,
        notificar: ["RH_GERAL", "ENCARREGADO", "GERENCIA"]
      });
      alert(`Ajuste de ${modalAjuste.campo} processado. O RH Geral e a Unidade foram notificados.`);
      setModalAjuste(null);
    }
  };

  const handleAbono = () => {
    const tipo = confirm("Deseja conceder abono GERAL para toda a secretaria (Feriado/Ponto Facultativo)?\n\nClique em OK para Geral ou Cancelar para Individual.");
    if (tipo) {
       n8n.trigger('abono-geral-pmg', { secretaria: secSelecionada, motivo: "Ponto Facultativo / Feriado" });
       alert("Abono geral processado para toda a " + secSelecionada);
    } else {
       alert("Selecione um colaborador na lista para abono individual.");
    }
  };

  const [volantes, setVolantes] = useState([
    { id: 1, unidade: "UBS Norte", cargo: "ASG", motivo: "Cobertura de Férias", status: "PENDENTE" },
    { id: 2, unidade: "Escola Municipal A", cargo: "Porteiro", motivo: "Atestado Médico", status: "EM ROTA" }
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Portal RH Prefeitura (PMG)</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
            Monitoramento de Efetivo, Compras e Gestão de Secretarias
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-brand" style={{ background: "var(--info)" }} onClick={handleAbono}>
            <Zap size={16} /> Gerar Abono
          </button>
          <button className="btn-brand" onClick={() => setAba("vagas")}>
            <Plus size={16} /> Abrir Vaga
          </button>
        </div>
      </div>

      {/* Seletor de Secretaria */}
      <div style={{ display: "flex", gap: "0.5rem", background: "var(--bg-card)", padding: "0.5rem", borderRadius: "10px", border: "1px solid var(--border)" }}>
        {secretarias.map(s => (
          <button 
            key={s.id}
            onClick={() => setSecSelecionada(s.id)}
            style={{ 
              flex: 1, padding: "0.6rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
              background: secSelecionada === s.id ? "var(--brand)" : "transparent",
              color: secSelecionada === s.id ? "white" : "var(--text-muted)",
              transition: "0.2s"
            }}
          >
            {s.id}
          </button>
        ))}
        <button 
          onClick={() => setSecSelecionada("TODAS")}
          style={{ 
            flex: 1, padding: "0.6rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 700,
            background: secSelecionada === "TODAS" ? "var(--text-primary)" : "transparent",
            color: secSelecionada === "TODAS" ? "white" : "var(--text-muted)",
          }}
        >
          CONSOLIDADO PMG
        </button>
      </div>

      {/* KPI Row Expanded */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--brand)" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Funcionários Ativos</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
            {secSelecionada === "TODAS" ? secretarias.reduce((acc, s) => acc + s.ativos, 0) : secretarias.find(s => s.id === secSelecionada)?.ativos}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>ASGs em Campo</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
            {secSelecionada === "TODAS" ? secretarias.reduce((acc, s) => acc + s.asgs, 0) : secretarias.find(s => s.id === secSelecionada)?.asgs}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #3B82F6" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Vagas em Aberto</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
            {secSelecionada === "TODAS" ? secretarias.reduce((acc, s) => acc + s.vagas, 0) : secretarias.find(s => s.id === secSelecionada)?.vagas}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid #F59E0B" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Unidades Monitoradas</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
            {secSelecionada === "TODAS" ? secretarias.reduce((acc, s) => acc + s.postos, 0) : secretarias.find(s => s.id === secSelecionada)?.postos}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", gap: "1.25rem", background: "var(--bg-card)" }}>
          {[
            { id: "indicadores", label: "Dashboard", icon: Building2 },
            { id: "lista", label: "Equipe PMG", icon: Users },
            { id: "vagas", label: "Gestão de Vagas", icon: Briefcase },
            { id: "volante", label: "Pedidos Volante", icon: Zap },
            { id: "compras", label: "Acompanhar Compras", icon: Search },
            { id: "suporte", label: "Ajustes e Suporte", icon: RefreshCw }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setAba(t.id as any)} 
              style={{ 
                background: "none", border: "none", cursor: "pointer", paddingBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 700, 
                color: aba === t.id ? "var(--brand)" : "var(--text-muted)", 
                borderBottom: aba === t.id ? "2px solid var(--brand)" : "2px solid transparent",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "1rem" }}>
          {aba === "indicadores" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {secretarias.filter(s => secSelecionada === "TODAS" || s.id === secSelecionada).map(s => (
                <div key={s.id} className="card" style={{ padding: "1.25rem", background: "var(--bg-surface)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{s.nome}</div>
                    <span className="badge badge-blue" style={{ fontSize: "0.6rem" }}>{s.postos} Postos</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "rgba(0,0,0,0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>ATIVOS</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 900 }}>{s.ativos}</div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>ASGs</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#10B981" }}>{s.asgs}</div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.1)", padding: "0.75rem", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontWeight: 700 }}>VAGAS</div>
                      <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--brand)" }}>{s.vagas}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {aba === "lista" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700 }}>Efetivo PMG: {secSelecionada === "TODAS" ? "Geral" : secSelecionada}</h3>
                <div style={{ display: "flex", gap: "10px" }}>
                   <button className="btn-ghost !h-8 !text-[10px]" onClick={() => alert("Imprimindo quadro de pessoal...")}>Imprimir Lista</button>
                   <div style={{ position: "relative", width: "200px" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input className="input-field" placeholder="Buscar..." style={{ paddingLeft: "2.25rem", height: "32px", fontSize: "0.75rem" }} />
                  </div>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    <th style={{ padding: "0.75rem" }}>Unidade</th>
                    <th style={{ padding: "0.75rem" }}>Colaborador</th>
                    <th style={{ padding: "0.75rem" }}>Função</th>
                    <th style={{ padding: "0.75rem" }}>Insal.</th>
                    <th style={{ padding: "0.75rem" }}>Horário</th>
                    <th style={{ padding: "0.75rem" }}>Status</th>
                    <th style={{ padding: "0.75rem" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {colaboradoresPMG
                    .filter(c => secSelecionada === "TODAS" || c.sec === secSelecionada)
                    .map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.75rem", fontSize: "0.75rem", fontWeight: 600 }}>{c.unidade}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem", fontWeight: 700 }}>{c.nome}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.75rem" }}>{c.funcao}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <button className="btn-ghost !h-6 !px-2 !text-[9px] !bg-red-500/5 text-red-600" onClick={() => handleAjusteRH(c, "insalubridade")}>{c.insalubridade}</button>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <button className="btn-ghost !h-6 !px-2 !text-[9px] !bg-blue-500/5 text-blue-600" onClick={() => handleAjusteRH(c, "horario")}>{c.horario}</button>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className={`badge ${c.status === 'ATIVO' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: "0.6rem" }}>{c.status}</span>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                         <button className="btn-ghost !h-7 !text-[10px]" onClick={() => alert("Abrindo perfil detalhado...")}>Ver</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === "compras" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
               <div className="badge badge-amber" style={{ width: "fit-content", fontSize: "0.65rem" }}>SOMENTE LEITURA: Acompanhamento de entregas Alicerce</div>
               <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem" }}>ID REQUISIÇÃO</th>
                    <th style={{ padding: "0.75rem" }}>ITEM / SERVIÇO</th>
                    <th style={{ padding: "0.75rem" }}>SECRETARIA</th>
                    <th style={{ padding: "0.75rem" }}>STATUS</th>
                    <th style={{ padding: "0.75rem" }}>DATA</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map(req => (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem", fontWeight: 700 }}>{req.id}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>{req.item}</td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>{req.unidade}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span className="badge badge-blue" style={{ fontSize: "0.65rem" }}>{req.status}</span>
                      </td>
                      <td style={{ padding: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>{req.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {aba === "vagas" && (
            <div style={{ maxWidth: "500px" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "1rem" }}>Abertura de Vaga por Secretaria</h3>
              <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label className="label-sm">Secretaria Beneficiada</label>
                  <select className="input-field" value={secSelecionada} onChange={e => setSecSelecionada(e.target.value)}>
                    {secretarias.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm">Unidade / Escola Registrada</label>
                  <input className="input-field" placeholder="Ex: Escola Joaquim Nabuco" />
                </div>
                <div>
                  <label className="label-sm">Cargo / Função</label>
                  <input className="input-field" placeholder="Ex: ASG (Limpeza)" />
                </div>
                <button className="btn-brand" style={{ marginTop: "1rem" }} onClick={() => { alert("Vaga publicada! O n8n iniciará o fluxo de recrutamento."); }}>Confirmar Abertura de Vaga</button>
              </div>
            </div>
          )}

          {aba === "suporte" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
               <div className="card" style={{ padding: "1.5rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Ajustes e Movimentações</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                     <button className="btn-ghost !h-10 !justify-start" onClick={() => alert("Formulário de transferência iniciado...")}><RefreshCw size={14} /> Pedir Transferência de Colaborador</button>
                     <button className="btn-ghost !h-10 !justify-start" onClick={() => alert("Formulário de ajuste de cadastro...")}><Building2 size={14} /> Pedir Ajuste no Cadastro (Nome/CPF/Dados)</button>
                     <button className="btn-ghost !h-10 !justify-start" onClick={() => alert("Iniciando fluxo de revisão de insalubridade...")}><ShieldAlert size={14} /> Pedir Ajuste de Insalubridade (Técnico)</button>
                  </div>
               </div>
               <div className="card" style={{ padding: "1.5rem", background: "var(--brand-light)" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>Comunicados Oficiais</h3>
                  <textarea className="input-field" placeholder="Escreva um comunicado para todos os diretores desta secretaria..." style={{ minHeight: "100px" }} />
                  <button className="btn-brand w-full mt-4">Disparar via WhatsApp/Portal</button>
               </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal de Ajuste de Colaborador (Padronizado PMG) */}
      {modalAjuste && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1.5rem" }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "450px", padding: "2rem", borderTop: "4px solid var(--info)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
              <div style={{ padding: "10px", background: "rgba(59,130,246,0.1)", borderRadius: "12px", color: "var(--info)" }}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Ajuste via RH Prefeitura</h2>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{modalAjuste.colab.nome} ({secSelecionada})</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label className="label-sm uppercase tracking-widest text-[10px] mb-2 block">Campo em Edição</label>
                <div className="badge badge-blue" style={{ fontSize: "0.7rem" }}>{modalAjuste.campo === 'insalubridade' ? 'Percentual de Insalubridade' : 'Horário de Trabalho'}</div>
              </div>

              <div>
                <label className="label-sm uppercase tracking-widest text-[10px] mb-2 block">Novo Valor</label>
                {modalAjuste.campo === 'insalubridade' ? (
                  <select 
                    className="input-field w-full" 
                    value={modalAjuste.valor} 
                    onChange={e => setModalAjuste({ ...modalAjuste, valor: e.target.value })}
                  >
                    <option value="N/A">N/A (Não se aplica)</option>
                    <option value="20%">20% (Grau Médio)</option>
                    <option value="40%">40% (Grau Máximo)</option>
                  </select>
                ) : (
                  <input 
                    className="input-field w-full" 
                    placeholder="Ex: 07:00 - 16:00" 
                    value={modalAjuste.valor} 
                    onChange={e => setModalAjuste({ ...modalAjuste, valor: e.target.value })}
                  />
                )}
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-base)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0, fontStyle: "italic" }}>
                  <strong>Nota:</strong> Como RH da Prefeitura, este ajuste será sincronizado com o RH Geral da Alicerce e as unidades de ponta serão notificadas.
                </p>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button className="flex-1 btn-ghost" onClick={() => setModalAjuste(null)}>Cancelar</button>
                <button className="flex-1 btn-brand" style={{ background: "var(--info)" }} onClick={confirmarAjuste}>Processar Ajuste</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
