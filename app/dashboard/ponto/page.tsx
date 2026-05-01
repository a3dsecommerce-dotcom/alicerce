"use client";
import { useState, useEffect } from "react";
import { Clock, AlertTriangle, FileSpreadsheet, UserPlus, CheckCircle, Search, Calendar, MessageSquare, Send, History } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";
import FichaColaborador360 from "../components/FichaColaborador360";

export default function RHPontoPage() {
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalBulk, setModalBulk] = useState(false);
  const [listaNomes, setListaNomes] = useState("");
  const [selecionado, setSelecionado] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Carregar cobranças ativas (Ajustes de Ponto)
      const { data: a } = await supabase.from('ajustes_ponto')
        .select('*, usuarios(id, nome, telefone, cargo, unidade_alocacao)')
        .order('created_at', { ascending: false });
      
      if (a) setAjustes(a);
      
      const { data: u } = await supabase.from('usuarios').select('id, nome, telefone');
      if (u) setUsuarios(u);

      setLoading(false);
    }
    fetchData();
  }, []);

  const dispararCobrancaIndividual = async (ajuste: any) => {
    setLoading(true);
    await n8n.trigger('cobranca-ponto-individual', {
      telefone: ajuste.usuarios?.telefone,
      nome: ajuste.usuarios?.nome,
      data_referencia: ajuste.data_referencia,
      ajuste_id: ajuste.id
    });
    alert(`Cobrança reenviada para ${ajuste.usuarios?.nome} via WhatsApp.`);
    setLoading(false);
  };

  const countPendentes = ajustes.filter(a => !a.resolvido).length;
  const countResolvidos = ajustes.filter(a => a.resolvido).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%", paddingBottom: "2rem" }}>
      {/* Header Estratégico */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border)" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Célula de Regularização de Ponto</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "4px" }}>
            Orquestração de cobranças automáticas via Bot e auditoria de ajustes no Marponto
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-ghost" style={{ color: "var(--warning)", borderColor: "var(--warning)" }} onClick={() => {
            n8n.trigger('notificacao-encarregados-ponto', { acao: 'COBRAR_EQUIPE' });
            alert("Encarregados notificados para cobrar regularização imediata das equipes.");
          }}>
            <AlertTriangle size={16} /> Notificar Encarregados
          </button>
          <button className="btn-brand" style={{ background: "var(--brand)" }} onClick={() => setModalBulk(true)}>
            <UserPlus size={16} /> Lançar Cobrança em Massa
          </button>
        </div>
      </div>

      {/* Painel de Controle de Cobranças */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", flex: 1 }}>
        
        {/* Tabela de Cobranças Ativas */}
        <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-base)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Fila de Regularização (WhatsApp Bot)</h2>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "8px" }}>{ajustes.length} registros no ciclo</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <div className="badge badge-amber">{countPendentes} Cobrando</div>
              <div className="badge badge-green">{countResolvidos} Resolvidos</div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 10 }}>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Colaborador", "Data Ref.", "Motivo", "Última Cobrança", "Status", "Ação"].map(h => (
                    <th key={h} style={{ padding: "1rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Sincronizando com o Bot...</td></tr>
                ) : ajustes.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Nenhuma cobrança ativa no momento.</td></tr>
                ) : ajustes.map((a, idx) => (
                  <tr key={idx} className="table-row group">
                    <td 
                      style={{ padding: "1rem", cursor: "pointer" }} 
                      onClick={() => setSelecionado(a.usuarios)}
                    >
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--brand)" }}>{a.usuarios?.nome}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{a.usuarios?.unidade_alocacao}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8rem" }}>{a.data_referencia}</td>
                    <td style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{a.motivo || "Ajuste pendente"}</td>
                    <td style={{ padding: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <History size={12} /> {new Date(a.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`badge ${a.resolvido ? 'badge-green' : 'badge-amber'}`}>
                        {a.resolvido ? 'RESOLVIDO' : 'COBRANDO...'}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {!a.resolvido && (
                        <button 
                          className="btn-ghost" 
                          style={{ padding: "4px 8px", fontSize: "0.7rem", height: "auto" }}
                          onClick={() => dispararCobrancaIndividual(a)}
                        >
                          <Send size={12} /> Re-cobrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Status do Bot */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card" style={{ padding: "1.25rem", background: "linear-gradient(135deg, var(--bg-surface), var(--bg-base))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 10px #10B981" }}></div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>Agente de Cobrança Online</span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              O Bot está configurado para cobrar automaticamente às **08:00, 14:00 e 18:00**. 
              Cobranças manuais disparadas pelo portal ignoram esse cronograma.
            </p>
          </div>

          <div className="card" style={{ padding: "1.25rem", flex: 1 }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <MessageSquare size={16} className="text-[var(--brand)]" /> Live Feed (Bot)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {ajustes.slice(0, 4).map((a, i) => (
                <div key={i} style={{ padding: "0.75rem", background: "var(--bg-base)", borderRadius: "10px", border: "1px solid var(--border)", fontSize: "0.7rem" }}>
                  <span style={{ fontWeight: 700 }}>{a.usuarios?.nome}:</span>
                  <span style={{ color: "var(--text-muted)" }}> {a.resolvido ? "Confirmou ajuste no Marponto ✓" : "Cobrança enviada via WhatsApp..."}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ficha 360 Arrastável */}
      <FichaColaborador360 
        colabId={selecionado?.id} 
        isOpen={!!selecionado} 
        onClose={() => setSelecionado(null)} 
      />

      {/* Modal de Cobrança em Massa */}
      {modalBulk && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="card animate-fade-in" style={{ width: "100%", maxWidth: "550px", padding: "2rem" }}>
            <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} color="var(--brand)" /> Lançar Ciclo de Cobrança
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Cole a lista do Marponto abaixo. O Bot identificará os colaboradores e iniciará o fluxo de regularização.
            </p>
            <textarea 
              className="input-field" 
              style={{ width: "100%", minHeight: "180px", marginBottom: "1.5rem", padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem", resize: "none" }}
              placeholder="Exemplo:&#10;João Carlos - Falta Entrada 20/04&#10;Maria Luz - Sem Saída 21/04..."
              value={listaNomes}
              onChange={(e) => setListaNomes(e.target.value)}
            />
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={() => setModalBulk(false)}>Cancelar</button>
              <button className="btn-brand" onClick={() => {
                const itens = listaNomes.split('\n').filter(n => n.trim() !== '');
                if (itens.length === 0) return alert("Insira os dados para cobrança.");
                n8n.trigger('cobranca-massa-ponto', { dados: itens });
                alert(`${itens.length} colaboradores entraram na fila de cobrança do Bot!`);
                setModalBulk(false);
                setListaNomes("");
              }}>
                Disparar Esteira de Cobrança
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
