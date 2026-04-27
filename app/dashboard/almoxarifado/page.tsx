"use client";
import { useState, useEffect } from "react";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Search, Plus, Loader, Filter, Printer, History, UserCheck, ShieldCheck, ClipboardList, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import QuickActions from "../components/QuickActions";
import ColaboradoresSharedTable from "../components/ColaboradoresSharedTable";

export default function AlmoxarifadoPage() {
  const [estoque, setEstoque] = useState<any[]>([]);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<any[]>([
    { id: 1, data: new Date().toISOString(), usuario: "Encarregado Carlos", acao: "Entrega EPI", colaborador: "João Silva", itens: "Botina, Luva", status: "BAIXA REALIZADA" }
  ]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"estoque_proprio" | "catalogo_sec" | "requisicoes" | "receber" | "epi" | "auditoria">("estoque_proprio");
  const [mounted, setMounted] = useState(false);
  const [dadosCheckin, setDadosCheckin] = useState<{ secretaria: string, nf: string, data: string, itens: any[] } | null>(null);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState<null | "entrada" | "cadastro" | "analise" | "config">(null);
  
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("Selecione...");
  const [buscaColab, setBuscaColab] = useState("");
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [epiCesta, setEpiCesta] = useState<{item: string, qtd: number}[]>([]);
  const [entradasNF, setEntradasNF] = useState<Record<string, number>>({});
  const [buscaReceber, setBuscaReceber] = useState("");
  const [reqSelecionada, setReqSelecionada] = useState<any>(null);
  const [cestaEntregaUnidade, setCestaEntregaUnidade] = useState<{item: string, qtd: number, un: string}[]>([]);
  
  const [userRole, setUserRole] = useState("COLABORADOR"); 
  const [user, setUser] = useState<any>(null);
  const [economiaPercent, setEconomiaPercent] = useState(20); 
  const [formData, setFormData] = useState<any>({ item: "", categoria: "", quantidade: 0, estoque_minimo: 0, unidade_medida: "un", tipo: "PRODUTO" });
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [requisicaoReferencia, setRequisicaoReferencia] = useState("");


  useEffect(() => {
    // Recuperar usuário para controle de permissões
    const saved = localStorage.getItem("crm_user");
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      setUserRole(u.role);
    }

    async function fetchData() {
      const { data: estoqueData } = await supabase.from('estoque_atual').select('*').order('item');
      if (estoqueData) {
        setEstoque(estoqueData);
      } else {
        // Fallback mock
        setEstoque([
          { id: 1, item: "Botina Bico de Aço", quantidade: 45, estoque_minimo: 10, categoria: "EPI", unidade_medida: "par", ca: "42150", tipo_estoque: "PROPRIO" },
          { id: 2, item: "Luva de Nitrila", quantidade: 120, estoque_minimo: 50, categoria: "EPI", unidade_medida: "par", ca: "38500", tipo_estoque: "PROPRIO" },
          { id: 3, item: "Calça Operacional Azul", quantidade: 30, estoque_minimo: 15, categoria: "UNIFORME", unidade_medida: "un", tipo_estoque: "PROPRIO" },
          { id: 4, item: "Papel Toalha Interfolha", quantidade: 0, estoque_minimo: 0, categoria: "SUPRIMENTO", unidade_medida: "fardo", tipo_estoque: "CATALOGO" },
          { id: 5, item: "Desinfetante Hospitalar 5L", quantidade: 0, estoque_minimo: 0, categoria: "LIMPEZA", unidade_medida: "galão", tipo_estoque: "CATALOGO" },
          { id: 6, item: "Sabonete Líquido 5L", quantidade: 0, estoque_minimo: 0, categoria: "LIMPEZA", unidade_medida: "galão", tipo_estoque: "CATALOGO" }
        ]);
      }

      const { data: reqData } = await supabase.from('requisicoes').select('*').order('data_solicitacao', { ascending: false }).limit(20);
      if (reqData && reqData.length > 0) setRequisicoes(reqData);
      else setRequisicoes([]);

      const { data: users } = await supabase.from('usuarios').select('*').order('nome');
      if (users) setColaboradores(users);

      setLoading(false);
    }
    fetchData();
    setMounted(true);
  }, []);

  const handleBaixaEPI = () => {
    if (epiCesta.length === 0) return;

    // 1. Simular Baixa no Estoque
    const novoEstoque = [...estoque];
    epiCesta.forEach(cestaItem => {
      const idx = novoEstoque.findIndex(i => i.item === cestaItem.item);
      if (idx !== -1) {
        novoEstoque[idx].quantidade -= cestaItem.qtd;
      }
    });
    setEstoque(novoEstoque);

    // 2. Registrar Log de Auditoria
    const novoLog = {
      id: Date.now(),
      data: new Date().toISOString(),
      usuario: `Encarregado (${userRole})`,
      acao: "Entrega e Baixa de EPI",
      colaborador: colaboradorSelecionado,
      itens: epiCesta.map(i => `${i.qtd}x ${i.item}`).join(", "),
      status: "SUCESSO"
    };
    setLogsAuditoria([novoLog, ...logsAuditoria]);

    // 3. Notificar n8n
    n8n.trigger('baixa-estoque-epi', { colaborador: colaboradorSelecionado, itens: epiCesta });
    setEpiCesta([]);
    alert("Baixa realizada e Ficha NR-06 gerada!");
  };

  const handleSalvarItem = async () => {
    setLoading(true);
    const payload = {
      ...formData,
      tipo_estoque: (formData.tipo === "EPI" || formData.categoria === "UNIFORME") ? "PROPRIO" : "CATALOGO"
    };

    const { error } = await supabase.from('estoque_atual').upsert([payload]);
    
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Item salvo com sucesso!");
      const { data } = await supabase.from('estoque_atual').select('*').order('item');
      if (data) setEstoque(data);
      setModalAberto(null);
    }
    setLoading(false);
  };

  const handleAprovarRequisicao = async (qtdAprovada: number, justificativa: string) => {
    if (!itemSelecionado) return;
    
    const qtdOriginal = Number(itemSelecionado.quantidade.split(' ')[0]);
    if (qtdAprovada !== qtdOriginal && !justificativa) {
      alert("JUSTIFICATIVA OBRIGATÓRIA: Como a quantidade aprovada é diferente da solicitada, você deve justificar a mudança.");
      return;
    }

    setLoading(true);
    // 1. Atualizar Requisição no Supabase
    await supabase.from('requisicoes').update({ 
      status: 'APROVADO', 
      quantidade_aprovada: qtdAprovada,
      justificativa_ajuste: justificativa,
      analisado_por: user?.nome || "Almoxarife"
    }).eq('id', itemSelecionado.id);

    // 2. Registrar no Histórico de Gestão
    await supabase.from('historico_gestao').insert([{
      executor_tel: user?.telefone || "INTERNO",
      tipo_acao: "APROVACAO_TECNICA",
      motivo: `Requisição #${itemSelecionado.id} aprovada com ajuste (${qtdOriginal} -> ${qtdAprovada})`,
      para: justificativa
    }]);

    // 3. Notificar n8n
    n8n.trigger('pedido-real-aprovado', { 
      requisicao_id: itemSelecionado.id, 
      unidade: itemSelecionado.unidade,
      qtd_aprovada: qtdAprovada,
      justificativa
    });

    alert("Pedido Real consolidado! Comprador e Gerência notificados."); 
    setModalAberto(null);
    setLoading(false);
  };

  const handleEntradaEstoque = async (qtd: number, nf: string, fornecedor: string) => {
    if (!formData.id) {
      alert("Selecione um item válido para entrada.");
      return;
    }
    setLoading(true);
    
    try {
      if (formData.tipo_estoque === "PROPRIO") {
        const novaQtd = (formData.quantidade || 0) + qtd;
        await supabase.from('estoque_atual').update({ quantidade: novaQtd }).eq('id', formData.id);
      }

      await supabase.from('historico_gestao').insert([{
        executor_tel: user?.telefone || "ALMOXARIFE",
        tipo_acao: "ENTRADA_ESTOQUE",
        motivo: `Entrada via NF ${nf} - Fornecedor: ${fornecedor}`,
        para: `Qtd: ${qtd} de ${formData.item}`
      }]);

      n8n.trigger('entrada-estoque', { item: formData.item, nf, qtd, fornecedor });
      
      alert("Entrada registrada com sucesso!");
      const { data } = await supabase.from('estoque_atual').select('*').order('item');
      if (data) setEstoque(data);
      setModalAberto(null);
    } catch (e) {
      alert("Erro no processamento.");
    } finally {
      setLoading(false);
    }
  };

  const itensCriticos = estoque.filter(i => i.quantidade <= i.estoque_minimo);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "calc(100vh - 120px)" }}>
      {/* Command Center: Ações Rápidas & Dashboard */}
      <div className="no-print">
        <QuickActions user={user || { role: 'COLABORADOR', nivel: 1 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", flex: 1, overflow: "hidden" }} className="no-print">
        {/* Main Operational Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: "1.25rem", borderBottom: "1px solid var(--border)", marginBottom: "1rem" }}>
            <button onClick={() => setAba("estoque_proprio")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "estoque_proprio" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "estoque_proprio" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🛡️ Estoque Próprio (EPI/Uniformes)
            </button>
            <button onClick={() => setAba("catalogo_sec")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "catalogo_sec" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "catalogo_sec" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📋 Catálogo (Secretarias)
            </button>
            <button onClick={() => setAba("requisicoes")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "requisicoes" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "requisicoes" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔄 Requisições em Fluxo
            </button>
            <button onClick={() => setAba("receber")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "receber" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "receber" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🚚 Receber Carga (Cross-docking)
            </button>
            <button onClick={() => setAba("epi")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "epi" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "epi" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              👤 Entrega Individual
            </button>
            <button onClick={() => setAba("auditoria")} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 700, color: aba === "auditoria" ? "var(--brand)" : "var(--text-muted)", borderBottom: aba === "auditoria" ? "3px solid var(--brand)" : "3px solid transparent", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔍 Auditoria
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          
          {/* TABELA DE ESTOQUE PRÓPRIO (EPI / UNIFORME) */}
          {aba === "estoque_proprio" && (
            <div className="animate-fade-in" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ position: "relative", width: "300px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input className="input-field !pl-10" placeholder="Buscar EPI ou Uniforme..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button className="btn-ghost !h-10"><Printer size={16} /> Relatório Inventário</button>
                  <button className="btn-brand !h-10" onClick={() => setModalAberto("cadastro")}><Plus size={16} /> Novo Item Próprio</button>
                </div>
              </div>

              <div className="card overflow-hidden" style={{ borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                      {["Item / Descrição", "CA / Ref", "Categoria", "Saldo Atual", "Mínimo", "Status", "Ações"].map(h => (
                        <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {estoque.filter(i => (i.tipo_estoque === "PROPRIO" || !i.tipo_estoque) && i.item.toLowerCase().includes(busca.toLowerCase())).map((item, idx) => (
                      <tr key={idx} className="table-row group">
                        <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.item}</td>
                        <td style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item.ca || "-"}</td>
                        <td style={{ padding: "1rem" }}><span className="badge badge-blue">{item.categoria}</span></td>
                        <td style={{ padding: "1rem", fontSize: "1rem", fontWeight: 800, color: item.quantidade <= item.estoque_minimo ? "var(--danger)" : "var(--brand)" }}>{item.quantidade} {item.unidade_medida}</td>
                        <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{item.estoque_minimo}</td>
                        <td style={{ padding: "1rem" }}>
                          <span className={`badge ${item.quantidade <= item.estoque_minimo ? "badge-red" : "badge-green"}`}>
                            {item.quantidade <= item.estoque_minimo ? "REPOSIÇÃO URGENTE" : "ESTOQUE OK"}
                          </span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <button className="btn-ghost !p-2 opacity-0 group-hover:opacity-100"><Filter size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABELA DE CATÁLOGO (SECRETARIAS) - FLUXO DIRETO */}
          {aba === "catalogo_sec" && (
            <div className="animate-fade-in" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div style={{ position: "relative", width: "300px" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input className="input-field !pl-10" placeholder="Buscar no catálogo..." value={busca} onChange={e => setBusca(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost !h-10">Exportar Catálogo</button>
                  <button className="btn-brand !h-10" onClick={() => setModalAberto("cadastro")}><Plus size={16} /> Cadastrar Novo Suprimento</button>
                </div>
              </div>

              <div className="card overflow-hidden" style={{ borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                      {["Item / Descrição", "Categoria", "Unid. Medida", "Controle de Saldo", "Status Operacional"].map(h => (
                        <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {estoque.filter(i => i.tipo_estoque === "CATALOGO" && i.item.toLowerCase().includes(busca.toLowerCase())).map((item, idx) => (
                      <tr key={idx} className="table-row">
                        <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{item.item}</td>
                        <td style={{ padding: "1rem" }}><span className="badge badge-amber">{item.categoria}</span></td>
                        <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.unidade_medida}</td>
                        <td style={{ padding: "1rem" }}>
                          <span className="text-[10px] font-black text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-1 rounded">FLUXO DIRETO (SEM ESTOQUE FÍSICO)</span>
                        </td>
                        <td style={{ padding: "1rem" }}>
                          <span className="badge badge-blue">ATIVO PARA REQUISIÇÃO</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === "epi" && (
            <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
              <div className="card" style={{ padding: "1.25rem", background: "var(--bg-base)", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>1. Localizar Colaborador</h3>
                <input className="input-field" placeholder="Digite o nome..." value={buscaColab} onChange={(e) => { setBuscaColab(e.target.value); setShowSugestoes(true); }} onFocus={() => setShowSugestoes(true)} />
                {showSugestoes && buscaColab.length > 0 && (
                  <div className="card shadow-2xl" style={{ position: "absolute", zIndex: 50, marginTop: "4px", width: "calc(100% - 2.5rem)", borderRadius: "8px" }}>
                    {colaboradores.filter(c => c.nome.toLowerCase().includes(buscaColab.toLowerCase())).map(c => (
                      <div key={c.id} onClick={() => { setColaboradorSelecionado(c.nome); setBuscaColab(c.nome); setShowSugestoes(false); }} style={{ padding: "0.75rem", fontSize: "0.8rem", cursor: "pointer", borderBottom: "1px solid var(--border-light)" }} className="hover:bg-[var(--brand)]/10">
                        {c.nome} - {c.cargo}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--brand)", borderRadius: "8px", color: "white" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{colaboradorSelecionado}</div>
                </div>
              </div>
              <div className="card" style={{ padding: "1.25rem", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem" }}>2. Baixa de EPI Próprio</h3>
                <div className="flex gap-2 mb-4">
                  <select id="epi-sel" className="input-field" style={{ flex: 1 }}>
                    {estoque.filter(i => i.tipo_estoque === 'PROPRIO' && i.categoria === 'EPI').map(i => <option key={i.id} value={i.item}>{i.item} (Saldo: {i.quantidade})</option>)}
                  </select>
                  <button className="btn-brand" onClick={() => { const i = (document.getElementById('epi-sel') as HTMLSelectElement).value; setEpiCesta([...epiCesta, { item: i, qtd: 1 }]); }}>+</button>
                </div>
                <div style={{ minHeight: "100px", border: "1px dashed var(--border)", borderRadius: "8px", padding: "0.5rem", marginBottom: "1rem" }}>
                  {epiCesta.map((e, i) => <div key={i} className="flex justify-between p-2 border-b text-sm"><span>{e.item}</span><strong>{e.qtd} un</strong></div>)}
                  {epiCesta.length === 0 && <p className="text-center text-[var(--text-muted)] text-xs mt-8">Cesta vazia</p>}
                </div>
                <button className="btn-brand w-full !h-12" disabled={epiCesta.length === 0 || colaboradorSelecionado === "Selecione..."} onClick={handleBaixaEPI}>Gerar Ficha NR-06 & Baixar Estoque 🛡️</button>
              </div>
            </div>
          )}

          {aba === "requisicoes" && (
            <div className="animate-fade-in" style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Acompanhamento de Fluxo (Secretarias)</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Monitoramento de pedidos que transitam pelo almoxarifado sem estocagem fixa.</p>
              </div>
              <div className="card overflow-hidden" style={{ borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--bg-card)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <tr>
                      <th style={{ padding: "12px", textAlign: "left" }}>REQ #</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>UNIDADE/SECRETARIA</th>
                      <th style={{ padding: "12px", textAlign: "left" }}>STATUS LOGÍSTICO</th>
                      <th style={{ padding: "12px", textAlign: "center" }}>TIPO</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisicoes.map((r, i) => (
                      <tr key={i} className="table-row">
                        <td style={{ padding: "12px", fontWeight: 800 }}>#{r.id || '0000'}</td>
                        <td style={{ padding: "12px" }}>{r.unidade || "Não informado"}</td>
                        <td style={{ padding: "12px" }}>
                          <span className={`badge ${r.status === 'PENDENTE' ? 'badge-amber' : 'badge-green'}`}>{r.status}</span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "center" }}>
                          <span className="text-[10px] font-bold text-[var(--brand)]">FLUXO DIRETO</span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                           <button className="btn-ghost !h-8 !text-[10px]" onClick={() => { setItemSelecionado(r); setModalAberto("analise"); }}>Ver Detalhes</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {aba === "receber" && (
            <div className="animate-fade-in" style={{ padding: "2rem", textAlign: "center" }}>
              <Truck size={48} className="mx-auto text-[var(--brand)] mb-4" />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 900 }}>Check-in de Carga (Cross-docking)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 2rem" }}>
                Use esta função para registrar a chegada de mercadorias que serão enviadas diretamente para as secretarias.
              </p>
              <button className="btn-brand !h-14 !px-8" onClick={() => alert("Abrindo scanner de NF-e...")}>
                Vincular Nota Fiscal à Requisição
              </button>
            </div>
          )}

          {aba === "auditoria" && (
            <div style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>Logs de Movimentação e Auditoria</h3>
              <div className="card overflow-hidden" style={{ borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ background: "var(--bg-card)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <tr>{["Data", "Responsável", "Ação", "Destino/Colaborador", "Itens", "Status"].map(h => <th key={h} style={{ padding: "12px", textAlign: "left" }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {logsAuditoria.map(log => (
                      <tr key={log.id} className="table-row">
                        <td style={{ padding: "12px", fontSize: "0.75rem", whiteSpace: "nowrap" }}>{new Date(log.data).toLocaleString()}</td>
                        <td style={{ padding: "12px", fontSize: "0.75rem" }}>{log.usuario}</td>
                        <td style={{ padding: "12px", fontSize: "0.75rem" }}>{log.acao}</td>
                        <td style={{ padding: "12px", fontSize: "0.75rem" }}>{log.colaborador}</td>
                        <td style={{ padding: "12px", fontSize: "0.7rem", color: "var(--text-secondary)" }}>{log.itens}</td>
                        <td style={{ padding: "12px" }}><span className="badge badge-green" style={{ fontSize: "0.6rem" }}>{log.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </div>
        
        {/* Lado Direito: Resumo de Alertas Críticos */}
        <div className="flex flex-col gap-6 overflow-hidden">
           <div className="card p-6 bg-[var(--danger)]/5 border-[var(--danger)]/20">
              <h4 className="text-xs font-black text-[var(--danger)] uppercase mb-4 flex items-center gap-2">
                <AlertTriangle size={14} /> Alertas de Estoque
              </h4>
              <div className="flex flex-col gap-3">
                {itensCriticos.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/50 p-3 rounded-lg border border-[var(--danger)]/10">
                    <span className="text-[11px] font-bold">{item.item}</span>
                    <span className="badge badge-red">{item.quantidade} {item.unidade_medida}</span>
                  </div>
                ))}
                {itensCriticos.length > 3 && <p className="text-[10px] text-center font-bold text-[var(--text-muted)]">+{itensCriticos.length - 3} outros itens</p>}
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media screen { #documento-oficial { display: none; } }
        @media print {
          body * { visibility: hidden; }
          #documento-oficial, #documento-oficial * { visibility: visible !important; display: block !important; }
          #documento-oficial { position: absolute; left: 0; top: 0; width: 100%; display: block !important; background: white !important; color: black !important; padding: 1.5cm; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* DOCUMENTO OFICIAL PARA IMPRESSÃO (ESTILIZADO ANTERIORMENTE) */}
      <div id="documento-oficial" style={{ backgroundColor: "#fff", color: "#000", width: "100%", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: "15px", marginBottom: "25px" }}>
          <h1 style={{ fontSize: "1.6rem", margin: "0", fontWeight: "900" }}>ALICERCE SERVIÇOS E GESTÃO LTDA</h1>
          <p style={{ fontSize: "1rem", margin: "5px 0", fontWeight: "700", textTransform: "uppercase" }}>Ficha de Controle de Entrega de EPI (NR-06)</p>
        </div>

        <div style={{ marginBottom: "25px", fontSize: "1.05rem", border: "1px solid #000", padding: "15px" }}>
          <div><strong>COLABORADOR:</strong> <span style={{ textTransform: "uppercase" }}>{colaboradorSelecionado}</span></div>
          <div><strong>UNIDADE:</strong> ESCOLA JOAQUIM NABUCO</div>
          <div><strong>DATA:</strong> {mounted ? new Date().toLocaleDateString('pt-BR') : "--/--/----"}</div>
        </div>

        <div style={{ width: "100%", marginBottom: "30px" }}>
          <div style={{ width: "100%", backgroundColor: "#000", color: "#fff", fontWeight: "bold", fontSize: "11px", height: "38px", lineHeight: "38px" }}>
            <div style={{ float: "left", width: "60%", padding: "0 15px" }}>DESCRIÇÃO DO EQUIPAMENTO</div>
            <div style={{ float: "left", width: "20%", textAlign: "center" }}>QTD.</div>
            <div style={{ float: "left", width: "20%", textAlign: "center" }}>C.A (MTE)</div>
            <div style={{ clear: "both" }}></div>
          </div>
          {epiCesta.map((e, i) => (
            <div key={i} style={{ width: "100%", fontSize: "12px", height: "45px", lineHeight: "45px", background: i % 2 === 0 ? "#f9f9f9" : "#fff" }}>
              <div style={{ float: "left", width: "60%", padding: "0 15px" }}>{e.item.toUpperCase()}</div>
              <div style={{ float: "left", width: "20%", textAlign: "center" }}>{e.qtd}</div>
              <div style={{ float: "left", width: "20%", textAlign: "center" }}>42150</div>
              <div style={{ clear: "both" }}></div>
            </div>
          ))}
        </div>

        <div style={{ padding: "15px", fontSize: "11px", textAlign: "justify", backgroundColor: "#f6f6f6", borderRadius: "6px", lineHeight: "1.6" }}>
          <strong>DECLARAÇÃO:</strong> Declaro ter recebido os EPIs acima relacionados, estando em perfeitas condições de uso. Comprometo-me a utilizá-los apenas para o fim a que se destinam.
        </div>

        <div style={{ marginTop: "80px", display: "flex", width: "100%", justifyContent: "space-between" }}>
          <div style={{ width: "280px", textAlign: "center", borderTop: "2px solid #000", paddingTop: "10px" }}>
            <strong>ALICERCE SERVIÇOS E GESTÃO</strong><br/>Emissor Responsável
          </div>
          <div style={{ width: "280px", textAlign: "center", borderTop: "2px solid #000", paddingTop: "10px" }}>
            <strong>ASSINATURA DO COLABORADOR</strong><br/>{colaboradorSelecionado}
          </div>
        </div>

      {/* Modal: Nova Entrada de Estoque */}
      {modalAberto === "entrada" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "450px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ArrowDownToLine size={20} color="var(--brand)" /> Registrar Entrada de NF
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Selecionar Item</label>
                <select className="input-field" value={formData.id} onChange={e => {
                  const item = estoque.find(i => i.id === e.target.value);
                  if (item) setFormData(item);
                }}>
                  <option value="">-- Escolher Item --</option>
                  {estoque.map(i => <option key={i.id} value={i.id}>{i.item} ({i.categoria})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600, marginBottom: "4px" }}>Referenciar Requisição (Opcional)</label>
                <select className="input-field" value={requisicaoReferencia} onChange={e => setRequisicaoReferencia(e.target.value)}>
                  <option value="">Nenhuma (Entrada Avulsa)</option>
                  {requisicoes.filter(r => r.status === 'PENDENTE' || r.status === 'EM ROTA').map(r => (
                    <option key={r.id || r.unidade} value={r.id}>{r.unidade} - {r.item.substring(0, 30)}...</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Qtd. da Nota</label>
                  <input type="number" id="input-entrada-qtd" className="input-field" placeholder="0" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Número da NF</label>
                  <input type="text" id="input-entrada-nf" className="input-field" placeholder="Ex: 15420" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Fornecedor</label>
                <input type="text" id="input-entrada-fornecedor" className="input-field" placeholder="Nome do fornecedor..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setModalAberto(null)}>Cancelar</button>
              <button className="btn-brand" onClick={() => {
                const qtd = Number((document.getElementById('input-entrada-qtd') as HTMLInputElement).value);
                const nf = (document.getElementById('input-entrada-nf') as HTMLInputElement).value;
                const forn = (document.getElementById('input-entrada-fornecedor') as HTMLInputElement).value;
                handleEntradaEstoque(qtd, nf, forn);
              }} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : "Efetivar Entrada"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Produto ou EPI */}
      {modalAberto === "cadastro" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "550px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Plus size={20} color="var(--brand)" /> Cadastrar Item no Sistema
            </h2>
            
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", background: "var(--bg-base)", padding: "4px", borderRadius: "8px" }}>
              <button 
                onClick={() => setFormData({...formData, tipo: "PRODUTO"})}
                style={{ flex: 1, padding: "0.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, background: formData.tipo === "PRODUTO" ? "var(--bg-card)" : "transparent", color: formData.tipo === "PRODUTO" ? "var(--brand)" : "var(--text-muted)", boxShadow: formData.tipo === "PRODUTO" ? "0 2px 4px rgba(0,0,0,0.1)" : "none" }}
              >Produto (Limpeza/Escritório)</button>
              <button 
                onClick={() => setFormData({...formData, tipo: "EPI"})}
                style={{ flex: 1, padding: "0.5rem", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, background: formData.tipo === "EPI" ? "var(--bg-card)" : "transparent", color: formData.tipo === "EPI" ? "var(--brand)" : "var(--text-muted)", boxShadow: formData.tipo === "EPI" ? "0 2px 4px rgba(0,0,0,0.1)" : "none" }}
              >EPI (Equipamento de Proteção)</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Descrição do Item</label>
                <input type="text" className="input-field" placeholder="Ex: Papel Toalha Interfolha" value={formData.item} onChange={e => setFormData({...formData, item: e.target.value})} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Categoria</label>
                <input type="text" className="input-field" placeholder="Ex: Higiene" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Unidade de Medida</label>
                <select className="input-field" value={formData.unidade_medida} onChange={e => setFormData({...formData, unidade_medida: e.target.value})}>
                  <option value="un">Unidade (un)</option>
                  <option value="fardo">Fardo</option>
                  <option value="galão">Galão (5L)</option>
                  <option value="pct">Pacote</option>
                  <option value="par">Par</option>
                </select>
              </div>
              
              {formData.tipo === "EPI" ? (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600, marginBottom: "4px" }}>Número do CA</label>
                  <input type="text" className="input-field" placeholder="Ex: 42150" value={formData.ca} onChange={e => setFormData({...formData, ca: e.target.value})} style={{ borderColor: "var(--brand)" }} />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--brand)", fontWeight: 600, marginBottom: "4px" }}>Coeficiente de Consumo</label>
                  <input type="number" step="0.01" className="input-field" placeholder="Ex: 0.5" value={formData.coeficiente} onChange={e => setFormData({...formData, coeficiente: Number(e.target.value)})} style={{ borderColor: "var(--brand)" }} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Estoque Mínimo (Alerta)</label>
                <input type="number" className="input-field" value={formData.estoque_minimo} onChange={e => setFormData({...formData, estoque_minimo: Number(e.target.value)})} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setModalAberto(null)}>Cancelar</button>
              <button className="btn-brand" onClick={handleSalvarItem} disabled={loading}>
                {loading ? <Loader className="animate-spin" size={16} /> : (formData.id ? "Atualizar Cadastro" : "Salvar no Catálogo")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Análise de Requisição (Pedido Real) */}
      {modalAberto === "analise" && itemSelecionado && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "500px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--text-primary)" }}>Análise Técnica de Requisição</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Ajuste as quantidades solicitadas pelo comprador conforme a disponibilidade e o limite contratual da unidade <strong>{itemSelecionado.unidade}</strong>.
            </p>
            
            <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Item Solicitado</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>{itemSelecionado.item}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Quantidade Pedida</label>
                <input type="text" className="input-field" value={itemSelecionado.quantidade} disabled style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--brand)", fontWeight: 700, marginBottom: "4px" }}>Pedido Real (Aprovado)</label>
                <input 
                  type="number" 
                  id="input-qtd-aprovada"
                  className="input-field" 
                  defaultValue={Math.floor(Number(itemSelecionado.quantidade.split(' ')[0]) * (itemSelecionado.coeficiente || 1) * (1 - (economiaPercent / 100)))} 
                  style={{ borderColor: "var(--brand)", fontWeight: 700 }} 
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem", p: "1rem", background: "rgba(232,98,26,0.05)", borderRadius: "8px", border: "1px dashed var(--brand)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--brand)", fontWeight: 700, marginBottom: "4px" }}>CÁLCULO DE ESTRATÉGIA (INTERNO)</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Coeficiente ({itemSelecionado.coeficiente || 1.0}) × Economia ({economiaPercent}%) = 
                <strong style={{ marginLeft: "4px", color: "var(--text-primary)" }}>
                  {Math.floor(Number(itemSelecionado.quantidade.split(' ')[0]) * (itemSelecionado.coeficiente || 1) * (1 - (economiaPercent / 100)))} un sugeridos.
                </strong>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Justificativa do Ajuste (Obrigatória se alterado)</label>
              <textarea id="justificativa-ajuste" className="input-field" placeholder="Ex: Ajuste por limite de estoque ou coeficiente contratual..." style={{ minHeight: "80px", paddingTop: "0.5rem" }} />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setModalAberto(null)}>Voltar</button>
              <button className="btn-brand" onClick={() => {
                const qtd = Number((document.getElementById('input-qtd-aprovada') as HTMLInputElement).value);
                const just = (document.getElementById('justificativa-ajuste') as HTMLTextAreaElement).value;
                handleAprovarRequisicao(qtd, just);
              }} disabled={loading}>
                {loading ? <Loader className="animate-spin" /> : "Aprovar Pedido Real"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Configuração de Estratégia (Exclusivo Gerente) */}
      {modalAberto === "config" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={20} color="var(--brand)" /> Estratégia de Economia
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Defina o percentual de redução automática que o sistema deve sugerir nos pedidos para economia de insumos.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "10px" }}>Redução Automática (%)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={economiaPercent} 
                    onChange={e => setEconomiaPercent(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "var(--brand)" }}
                  />
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand)", width: "50px" }}>{economiaPercent}%</span>
                </div>
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "8px" }}>EXEMPLO DE APLICAÇÃO</div>
                <div style={{ fontSize: "0.75rem" }}>
                  Um pedido de 100 unidades será sugerido como <strong>{100 * (1 - (economiaPercent / 100))} unidades</strong>.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "flex-end" }}>
              <button className="btn-brand" style={{ width: "100%" }} onClick={() => setModalAberto(null)}>Salvar Estratégia</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } 
        .animate-spin { animation: spin 1s linear infinite; }
        
        @media screen {
          #documento-oficial, #recibo-entrega { display: none; }
        }

        @media print {
          body * { visibility: hidden; }
          #documento-oficial, #documento-oficial *, #recibo-entrega, #recibo-entrega * { visibility: visible !important; display: block !important; }
          #documento-oficial, #recibo-entrega {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 2cm;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* DOCUMENTO OFICIAL - LAYOUT FINAL HARMONIZADO */}
      <div id="documento-oficial" style={{ backgroundColor: "#fff", color: "#000", width: "100%", fontFamily: "'Inter', sans-serif", padding: "0 15px" }}>
        
        {/* Cabeçalho de Identificação */}
        <div style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: "15px", marginBottom: "25px" }}>
          <h1 style={{ fontSize: "1.6rem", margin: "0", fontWeight: "900" }}>ALICERCE SERVIÇOS E GESTÃO LTDA</h1>
          <p style={{ fontSize: "1rem", margin: "5px 0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Ficha de Controle de Entrega de EPI (NR-06)</p>
          <p style={{ fontSize: "0.8rem", margin: "0", color: "#444" }}>Sistema Integrado de Gestão de Segurança do Trabalho</p>
        </div>

        {/* Bloco de Dados do Colaborador (Legibilidade Aumentada) */}
        <div style={{ marginBottom: "25px", fontSize: "1.05rem", border: "1px solid #000", padding: "15px", background: "#fcfcfc" }}>
          <div style={{ marginBottom: "8px" }}><strong>COLABORADOR:</strong> <span style={{ textTransform: "uppercase" }}>JOÃO DA SILVA</span></div>
          <div style={{ marginBottom: "8px" }}><strong>CARGO / FUNÇÃO:</strong> <span style={{ textTransform: "uppercase" }}>AUXILIAR DE SERVIÇOS GERAIS</span></div>
          <div style={{ marginBottom: "8px" }}><strong>UNIDADE / POSTO:</strong> <span style={{ textTransform: "uppercase" }}>ESCOLA JOAQUIM NABUCO</span></div>
          <div><strong>DATA DE EMISSÃO:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
        </div>

        {/* Lista de Itens (Design Moderno - Sem Linhas Aparentes) */}
        <div style={{ width: "100%", marginBottom: "30px", boxSizing: "border-box" }}>
          
          {/* Cabeçalho Minimalista */}
          <div style={{ width: "100%", backgroundColor: "#000", color: "#fff", fontWeight: "bold", fontSize: "11px", height: "38px", lineHeight: "38px", borderRadius: "4px 4px 0 0" }}>
            <div style={{ float: "left", width: "50%", padding: "0 15px", boxSizing: "border-box" }}>DESCRIÇÃO DO EQUIPAMENTO</div>
            <div style={{ float: "left", width: "15%", textAlign: "center", boxSizing: "border-box" }}>QTD.</div>
            <div style={{ float: "left", width: "15%", textAlign: "center", boxSizing: "border-box" }}>TAM.</div>
            <div style={{ float: "left", width: "20%", textAlign: "center", boxSizing: "border-box" }}>C.A (MTE)</div>
            <div style={{ clear: "both" }}></div>
          </div>

          {/* Itens com Espaçamento Limpo (Sem Bordas) */}
          {(epiCesta.length > 0 ? epiCesta : [{ item: 'Botina Bico de Aço', qtd: 1 }, { item: 'Luva de Nitrila', qtd: 2 }]).map((e, i) => (
            <div key={i} style={{ width: "100%", fontSize: "12px", color: "#000", height: "45px", lineHeight: "45px", fontWeight: "500", background: i % 2 === 0 ? "#fcfcfc" : "#fff" }}>
              <div style={{ float: "left", width: "50%", padding: "0 15px", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap" }}>{e.item.toUpperCase()}</div>
              <div style={{ float: "left", width: "15%", textAlign: "center", boxSizing: "border-box" }}>{e.qtd}</div>
              <div style={{ float: "left", width: "15%", textAlign: "center", boxSizing: "border-box" }}>42</div>
              <div style={{ float: "left", width: "20%", textAlign: "center", boxSizing: "border-box" }}>42150</div>
              <div style={{ clear: "both" }}></div>
            </div>
          ))}

          {/* Espaço adicional para preenchimento manual (Sutil) */}
          {[...Array(2)].map((_, i) => (
            <div key={`v-${i}`} style={{ width: "100%", height: "40px" }}>
              <div style={{ float: "left", width: "50%", height: "100%" }}>&nbsp;</div>
              <div style={{ float: "left", width: "15%", height: "100%" }}>&nbsp;</div>
              <div style={{ float: "left", width: "15%", height: "100%" }}>&nbsp;</div>
              <div style={{ float: "left", width: "20%", height: "100%" }}>&nbsp;</div>
              <div style={{ clear: "both" }}></div>
            </div>
          ))}
        </div>

        {/* Termo de Compromisso Legal (Sem Bordas, apenas Fundo) */}
        <div style={{ padding: "15px", fontSize: "11px", textAlign: "justify", backgroundColor: "#f6f6f6", borderRadius: "6px", lineHeight: "1.6", color: "#333" }}>
          <strong style={{ color: "#000" }}>DECLARAÇÃO:</strong> Declaro ter recebido da empresa <strong>ALICERCE SERVIÇOS E GESTÃO LTDA</strong>, os equipamentos de proteção individual (EPI) acima relacionados, adequados ao risco de minha atividade, estando em perfeitas condições de uso. Comprometo-me a utilizá-los apenas para o fim a que se destinam, responsabilizando-me pela guarda e conservação. Estou ciente de que o uso é obrigatório e o descumprimento sujeita a sanções previstas no Art. 158 da CLT e NR-01/NR-06.
        </div>

        {/* Espaço Otimizado para Assinaturas (Lado a Lado - Máxima Amplitude) */}
        <div style={{ marginTop: "80px", display: "flex", width: "100%", justifyContent: "space-between", padding: "0 10px", boxSizing: "border-box" }}>
          
          <div style={{ width: "300px", textAlign: "center", fontSize: "11px" }}>
            <div style={{ height: "45px" }}></div> {/* Área generosa para assinatura manual */}
            <div style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>
              <strong style={{ fontSize: "12px" }}>ALICERCE SERVIÇOS E GESTÃO</strong><br />
              <span style={{ color: "#444" }}>Responsável p/ Entrega</span>
            </div>
          </div>

          <div style={{ width: "300px", textAlign: "center", fontSize: "11px" }}>
            <div style={{ height: "45px" }}></div> {/* Área generosa para assinatura manual */}
            <div style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>
              <strong style={{ fontSize: "12px" }}>ASSINATURA DO COLABORADOR</strong><br />
              <span style={{ color: "#444" }}>JOÃO DA SILVA</span>
            </div>
          </div>

        </div>
      </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "8px", color: "#666" }}>
          Documento gerado eletronicamente via Portal Alicerce ERP em {mounted ? new Date().toLocaleString('pt-BR') : "--/--/----"}
        </div>
      </div>

      {/* RECIBO DE CARGA (TERCEIRIZADO) - PADRÃO IDENTIDADE EPI */}
      {dadosCheckin && (
        <div id="recibo-entrega" style={{ backgroundColor: "#fff", color: "#000", width: "100%", fontFamily: "'Inter', sans-serif", padding: "0 15px" }}>
          
          {/* Cabeçalho de Identificação */}
          <div style={{ textAlign: "center", borderBottom: "3px solid #000", paddingBottom: "15px", marginBottom: "25px" }}>
            <h1 style={{ fontSize: "1.6rem", margin: "0", fontWeight: "900" }}>ALICERCE SERVIÇOS E GESTÃO LTDA</h1>
            <p style={{ fontSize: "1rem", margin: "5px 0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Comprovante de Entrega de Suprimentos</p>
            <p style={{ fontSize: "0.8rem", margin: "0", color: "#444" }}>Controle Logístico e Conferência de Carga Terceirizada</p>
          </div>

          {/* Bloco de Dados da Entrega */}
          <div style={{ marginBottom: "25px", fontSize: "1.05rem", border: "1px solid #000", padding: "15px", background: "#fcfcfc" }}>
            <div style={{ marginBottom: "8px" }}><strong>SECRETARIA DESTINO:</strong> <span style={{ textTransform: "uppercase" }}>{dadosCheckin.secretaria}</span></div>
            <div style={{ marginBottom: "8px" }}><strong>NOTA FISCAL / DOC:</strong> <span style={{ textTransform: "uppercase" }}>{dadosCheckin.nf || "N/A"}</span></div>
            <div style={{ marginBottom: "8px" }}><strong>DATA DA ENTREGA:</strong> {new Date(dadosCheckin.data).toLocaleDateString('pt-BR')}</div>
            <div><strong>HORA DO REGISTRO:</strong> {new Date().toLocaleTimeString('pt-BR')}</div>
          </div>

          {/* Lista de Itens */}
          <div style={{ width: "100%", marginBottom: "30px", boxSizing: "border-box" }}>
            
            {/* Cabeçalho Minimalista */}
            <div style={{ width: "100%", backgroundColor: "#000", color: "#fff", fontWeight: "bold", fontSize: "11px", height: "38px", lineHeight: "38px", borderRadius: "4px 4px 0 0" }}>
              <div style={{ float: "left", width: "70%", padding: "0 15px", boxSizing: "border-box" }}>DESCRIÇÃO DO MATERIAL / SUPRIMENTO</div>
              <div style={{ float: "left", width: "30%", textAlign: "center", boxSizing: "border-box" }}>QTD. RECEBIDA</div>
              <div style={{ clear: "both" }}></div>
            </div>

            {/* Itens com Espaçamento Limpo */}
            {dadosCheckin.itens.map((i, idx) => (
              <div key={idx} style={{ width: "100%", fontSize: "12px", color: "#000", height: "45px", lineHeight: "45px", fontWeight: "500", background: idx % 2 === 0 ? "#fcfcfc" : "#fff" }}>
                <div style={{ float: "left", width: "70%", padding: "0 15px", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap" }}>{i.item.toUpperCase()}</div>
                <div style={{ float: "left", width: "30%", textAlign: "center", boxSizing: "border-box", fontWeight: "700" }}>{i.recebido} {i.un.toUpperCase()}</div>
                <div style={{ clear: "both" }}></div>
              </div>
            ))}
          </div>

          {/* Declaração de Recebimento */}
          <div style={{ padding: "15px", fontSize: "11px", textAlign: "justify", backgroundColor: "#f6f6f6", borderRadius: "6px", lineHeight: "1.6", color: "#333" }}>
            <strong style={{ color: "#000" }}>DECLARAÇÃO DE CONFERÊNCIA:</strong> Confirmo que os materiais acima relacionados foram entregues na data de hoje, estando em conformidade com as especificações solicitadas e as quantidades descritas na respectiva nota fiscal, sem avarias aparentes no momento da descarga.
          </div>

          {/* Espaço para Assinaturas */}
          <div style={{ marginTop: "80px", display: "flex", width: "100%", justifyContent: "space-between", padding: "0 10px", boxSizing: "border-box" }}>
            
            <div style={{ width: "300px", textAlign: "center", fontSize: "11px" }}>
              <div style={{ height: "45px" }}></div>
              <div style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>
                <strong style={{ fontSize: "12px" }}>ENTREGADOR (ALICERCE)</strong><br />
                <span style={{ color: "#444" }}>Quem Forneceu / Motorista</span>
              </div>
            </div>

            <div style={{ width: "300px", textAlign: "center", fontSize: "11px" }}>
              <div style={{ height: "45px" }}></div>
              <div style={{ borderTop: "2px solid #000", paddingTop: "10px" }}>
                <strong style={{ fontSize: "12px" }}>ALMOXARIFADO ({dadosCheckin.secretaria})</strong><br />
                <span style={{ color: "#444" }}>Quem Recebeu / Conferente</span>
              </div>
            </div>

          </div>

          <div style={{ marginTop: "40px", textAlign: "center", fontSize: "8px", color: "#666" }}>
            Documento gerado eletronicamente via Portal Alicerce ERP em {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
}
