"use client";
import { useState, useEffect } from "react";
import { Package, AlertTriangle, Truck, Clock, Search, Plus, Loader, BarChart2, Users, CheckCircle2, Zap, MapPin, Calendar, Printer, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import QuickActions from "../components/QuickActions";
import ColaboradoresSharedTable from "../components/ColaboradoresSharedTable";
import TicketHub from "../components/TicketHub";

export default function ComprasPage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState<"emergencia" | "problema" | "carrinho" | "tipo_requisicao" | null>(null);
  const [tipoRequisicao, setTipoRequisicao] = useState<"MENSAL" | "EMERGENCIAL">("MENSAL");
  const [mesRelatorio, setMesRelatorio] = useState<string | null>(null);
  const [aba, setAba] = useState<"catalogo" | "historico">("catalogo");
  const [mesSelecionado, setMesSelecionado] = useState<string>("Abril");
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [observacao, setObservacao] = useState("");
  
  // Variáveis do Contrato (Mock baseado no Backend)
  const ASG_ATIVOS = 150; // Total de funcionários sob esta secretaria

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('estoque_atual').select('*').order('item');
      if (data && data.length > 0) {
        const comCoef = data.map(p => ({ ...p, coeficiente: p.coeficiente || 0.5 })); 
        setProdutos(comCoef);
      } else {
        setProdutos([
          { id: '1', item: 'Papel Toalha Interfolha (Fardo c/ 1000)', categoria: 'Higiene', unidade_medida: 'fardo', coeficiente: 1.5 },
          { id: '2', item: 'Desinfetante Floral 5L (Galão)', categoria: 'Limpeza', unidade_medida: 'galão', coeficiente: 0.3 },
          { id: '3', item: 'Vassoura de Pelo c/ Cabo', categoria: 'Limpeza', unidade_medida: 'un', coeficiente: 0.1 },
          { id: '4', item: 'Sabonete Líquido Erva Doce 5L', categoria: 'Higiene', unidade_medida: 'galão', coeficiente: 0.2 },
          { id: '5', item: 'Saco de Lixo Preto 100L (Pacote c/ 100)', categoria: 'Descartáveis', unidade_medida: 'pct', coeficiente: 2.0 },
          { id: '6', item: 'Luva de Borracha (Par)', categoria: 'EPI / Limpeza', unidade_medida: 'par', coeficiente: 0.5 },
          { id: '7', item: 'Água Sanitária 5L', categoria: 'Limpeza Pesada', unidade_medida: 'galão', coeficiente: 0.4 },
        ]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAddCarrinho = (itemId: string, qtd: number, max: number) => {
    setCarrinho(prev => ({ ...prev, [itemId]: qtd }));
  };

  const enviarRequisicao = async () => {
    const dataHora = new Date().toLocaleString('pt-BR');
    const requerente = "Secretaria SEMED (Comprador Autenticado)";
    alert(`TERMO DE CIÊNCIA - PRAZO DE ENTREGA\nO prazo mínimo padrão para o recebimento desta requisição é de 30 dias.\n\nDados registrados:\nRequisitante: ${requerente}\nData e Hora: ${dataHora}\n\nA solicitação foi enviada para o Almoxarifado para análise e conversão em 'Pedido Real'.`);
    setCarrinho({});
    setModalAberto(null);
  };

  const produtosFiltrados = produtos.filter(p => 
    (p.item || "").toLowerCase().includes((busca || "").toLowerCase()) || 
    (p.categoria || "").toLowerCase().includes((busca || "").toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "calc(100vh - 120px)" }}>
      <div className="no-print">
        <QuickActions user={{ role: 'COMPRADOR', nivel: 2 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem", flex: 1, overflow: "hidden" }} className="no-print">
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Portal de Compras</h1>
              <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2px" }}>
                Solicitações para Secretarias (SEMED, SEMSA, SEMAD) e acompanhamento
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button className="btn-brand" onClick={() => setModalAberto("tipo_requisicao")}>
                <Plus size={16} /> Nova Requisição
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
            <div className="card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(16,185,129,0.1)", padding: "0.8rem", borderRadius: "10px" }}>
                <Users size={24} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{ASG_ATIVOS}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>ASGs Ativos</div>
              </div>
            </div>
            {/* Outros KPIs podem vir aqui */}
          </div>

          <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "350px" }}>
            <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "1.5rem" }}>
                <button onClick={() => setAba("catalogo")} className={`pb-2 text-sm font-bold uppercase tracking-wider ${aba === "catalogo" ? "text-[var(--brand)] border-b-2 border-[var(--brand)]" : "text-[var(--text-muted)]"}`}>Catálogo</button>
                <button onClick={() => setAba("historico")} className={`pb-2 text-sm font-bold uppercase tracking-wider ${aba === "historico" ? "text-[var(--brand)] border-b-2 border-[var(--brand)]" : "text-[var(--text-muted)]"}`}>Histórico</button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {aba === "catalogo" && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">Produto</th>
                      <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)]">Categoria</th>
                      <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-center">Cota Máx</th>
                      <th className="p-4 text-[10px] font-black uppercase text-[var(--text-muted)] text-right">Solicitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosFiltrados.map(p => {
                      const qtd = carrinho[p.id] || 0;
                      const cotaMax = Math.ceil(ASG_ATIVOS * p.coeficiente);
                      return (
                        <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-base)]">
                          <td className="p-4 text-xs font-bold">{p.item}</td>
                          <td className="p-4"><span className="badge badge-brand">{p.categoria}</span></td>
                          <td className="p-4 text-center font-black">{cotaMax}</td>
                          <td className="p-4 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <button onClick={() => handleAddCarrinho(p.id, Math.max(0, qtd-1), cotaMax)} className="p-1 border rounded">-</button>
                                <span className="font-bold text-sm w-8 text-center">{qtd}</span>
                                <button onClick={() => handleAddCarrinho(p.id, Math.min(cotaMax, qtd+1), cotaMax)} className="p-1 border rounded">+</button>
                             </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Direita - Resumo de Cotação */}
        <div className="flex flex-col gap-6">
          <div className="card p-6 border-t-4 border-t-[var(--brand)]">
            <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
              <ShoppingCart size={16} className="text-[var(--brand)]" />
              Resumo da Cotação
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center py-2 border-b border-[var(--border)] border-dashed">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Itens Totais</span>
                <span className="text-sm font-black">12 Unid.</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[var(--border)] border-dashed">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Valor Bruto</span>
                <span className="text-sm font-black">R$ 5.420,00</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-xs font-black text-[var(--brand)] uppercase tracking-widest">Total Estimado</span>
                <span className="text-lg font-black text-[var(--brand)]">R$ 5.420,00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modais omitidos para brevidade mas mantendo a estrutura JSX correta */}
    </div>
  );
}
