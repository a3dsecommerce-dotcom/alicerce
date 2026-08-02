"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, Package, FileText, Calendar, Activity, AlertTriangle, 
  Search, Loader, CheckCircle, TrendingUp, UserX, Clock, Printer, ChevronRight, Eye
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdaptiveModal from "@/components/ui/AdaptiveModal";

type SSTTab = "DASHBOARD" | "EPI_STOCK" | "CATS" | "ATESTADOS" | "DELIVERIES";

interface EPIItem {
  id: string;
  item: string;
  quantidade: number;
  unidade_medida?: string;
  estoque_minimo?: number;
  categoria?: string;
}

interface CATRecord {
  id: string;
  colaborador_nome: string;
  colaborador_cpf: string;
  colaborador_cargo: string;
  unidade_alocada: string;
  data_ocorrido: string;
  horario_ocorrido: string;
  tipo_acidente: string;
  descricao_ocorrido: string;
  agente_causador?: string;
  parte_corpo_atingida?: string;
  acompanhamento_medico?: string;
  dados_especificos?: any;
  created_at: string;
}

interface AtestadoRecord {
  id: string;
  colaborador_ausente_nome: string;
  unidade: string;
  data: string;
  dias_atestado: number;
  tem_atestado: boolean;
  observacoes: string;
  created_at: string;
}

interface EPIDelivery {
  id: string;
  item_nome: string;
  quantidade: number;
  solicitante: string;
  unidade_destino: string;
  protocolo: string;
  data_solicitacao: string;
  status: string;
}

export default function SSTModule({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<SSTTab>("DASHBOARD");
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [epiStock, setEpiStock] = useState<EPIItem[]>([]);
  const [cats, setCats] = useState<CATRecord[]>([]);
  const [atestados, setAtestados] = useState<AtestadoRecord[]>([]);
  const [deliveries, setDeliveries] = useState<EPIDelivery[]>([]);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<CATRecord | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, catsRes, atestadosRes, deliveriesRes] = await Promise.all([
        supabase.from('almox_epi').select('*').order('item'),
        supabase.from('investigacao_cat').select('*').order('created_at', { ascending: false }),
        supabase.from('informativos_operacionais')
          .select('*')
          .eq('tem_atestado', true)
          .order('data', { ascending: false }),
        supabase.from('requisicoes')
          .select('*')
          .eq('tipo_item', 'EPI')
          .eq('status', 'ENTREGUE')
          .order('data_solicitacao', { ascending: false })
      ]);

      if (stockRes.error) throw stockRes.error;
      if (catsRes.error) throw catsRes.error;
      if (atestadosRes.error) throw atestadosRes.error;
      if (deliveriesRes.error) throw deliveriesRes.error;

      setEpiStock(stockRes.data || []);
      setCats(catsRes.data || []);
      setAtestados(atestadosRes.data || []);
      setDeliveries(deliveriesRes.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados do SESMT:", error);
      toast.error("Erro ao carregar os dados do painel: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const lowStockItems = epiStock.filter(item => item.quantidade <= (item.estoque_minimo || 5)).length;
    const totalAtestados = atestados.length;
    const totalCats = cats.length;
    
    // Total deliveries this month
    const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentMonthDeliveries = deliveries.filter(d => d.data_solicitacao?.startsWith(thisMonth)).length;

    return {
      lowStockItems,
      totalAtestados,
      totalCats,
      currentMonthDeliveries
    };
  }, [epiStock, atestados, cats, deliveries]);

  // Group deliveries by month for chart
  const monthlyKPIChart = useMemo(() => {
    const monthsMap: { [key: string]: number } = {};
    deliveries.forEach(d => {
      if (d.data_solicitacao) {
        const month = d.data_solicitacao.substring(0, 7); // YYYY-MM
        monthsMap[month] = (monthsMap[month] || 0) + Number(d.quantidade || 0);
      }
    });

    // Get last 6 months
    return Object.entries(monthsMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .reverse()
      .map(([month, count]) => {
        // Format to Pt-Br MM/YYYY
        const [year, m] = month.split("-");
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const formattedLabel = `${monthNames[parseInt(m) - 1]}/${year}`;
        return { label: formattedLabel, count };
      });
  }, [deliveries]);

  // Filtered Stock items
  const filteredStock = useMemo(() => {
    return epiStock.filter(item => 
      item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.categoria || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [epiStock, searchQuery]);

  // Filtered CATs
  const filteredCats = useMemo(() => {
    return cats.filter(cat => 
      cat.colaborador_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.unidade_alocada.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.agente_causador || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cats, searchQuery]);

  // Filtered Atestados
  const filteredAtestados = useMemo(() => {
    return atestados.filter(atest => 
      atest.colaborador_ausente_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atest.unidade.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [atestados, searchQuery]);

  // Filtered Deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(del => 
      del.solicitante.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.item_nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.unidade_destino.toLowerCase().includes(searchQuery.toLowerCase()) ||
      del.protocolo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [deliveries, searchQuery]);

  const handlePrintCAT = (cat: CATRecord) => {
    const printContent = `
      <html>
        <head>
          <title>Investigação de CAT - ${cat.colaborador_nome}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #ff6a00; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; color: #ff6a00; text-transform: uppercase; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 10px; }
            .label { font-weight: bold; }
            .value { margin-bottom: 5px; }
            .full-width { grid-column: span 2; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h2>ALICERCE OPS - COMUNICAÇÃO DE ACIDENTE DE TRABALHO (CAT)</h2>
            <p>SESMT - Serviço de Segurança e Medicina do Trabalho</p>
          </div>
          
          <div class="section">
            <div class="section-title">Dados do Colaborador</div>
            <div class="grid">
              <div><span class="label">Nome:</span> ${cat.colaborador_nome}</div>
              <div><span class="label">CPF:</span> ${cat.colaborador_cpf}</div>
              <div><span class="label">Cargo/Função:</span> ${cat.colaborador_cargo}</div>
              <div><span class="label">Unidade de Alocação:</span> ${cat.unidade_alocada}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalhes do Ocorrido</div>
            <div class="grid">
              <div><span class="label">Data do Acidente:</span> ${cat.data_ocorrido}</div>
              <div><span class="label">Horário:</span> ${cat.horario_ocorrido}</div>
              <div><span class="label">Tipo de Acidente:</span> ${cat.tipo_acidente}</div>
              <div><span class="label">Agente Causador:</span> ${cat.agente_causador || 'Não informado'}</div>
              <div class="full-width"><span class="label">Parte do Corpo Atingida:</span> ${cat.parte_corpo_atingida || 'Não informado'}</div>
              <div class="full-width"><span class="label">Descrição do Ocorrido:</span><br/>${cat.descricao_ocorrido}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Acompanhamento e Resolução</div>
            <div class="grid">
              <div class="full-width"><span class="label">Acompanhamento Médico:</span> ${cat.acompanhamento_medico || 'Não informado'}</div>
              <div><span class="label">Registrado em:</span> ${new Date(cat.created_at).toLocaleString('pt-BR')}</div>
            </div>
          </div>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(printContent);
      win.document.close();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border)] h-[500px]">
        <Loader className="animate-spin text-[var(--brand)] mb-4" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand)]">Sincronizando Módulo SESMT...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Estoque Baixo EPI</span>
            <span className="text-3xl font-black text-[var(--text-primary)] mt-1 block">
              {kpis.lowStockItems}
            </span>
          </div>
          <div className={`p-4 rounded-2xl ${kpis.lowStockItems > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-zinc-500/10 text-zinc-400"}`}>
            <Package size={24} />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Colaboradores Afastados</span>
            <span className="text-3xl font-black text-[var(--text-primary)] mt-1 block">
              {kpis.totalAtestados}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-orange-500/10 text-[var(--brand)]">
            <UserX size={24} />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Total CATs Registradas</span>
            <span className="text-3xl font-black text-[var(--text-primary)] mt-1 block">
              {kpis.totalCats}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest block">Entregas de EPI (Mês)</span>
            <span className="text-3xl font-black text-[var(--text-primary)] mt-1 block">
              {kpis.currentMonthDeliveries}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-green-500/10 text-green-500">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => { setActiveTab("DASHBOARD"); setSearchQuery(""); }}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-t-xl ${activeTab === "DASHBOARD" ? "border-b-2 border-[var(--brand)] text-[var(--brand)] bg-[var(--bg-card)]/50" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Painel Geral
        </button>
        <button
          onClick={() => { setActiveTab("EPI_STOCK"); setSearchQuery(""); }}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-t-xl ${activeTab === "EPI_STOCK" ? "border-b-2 border-[var(--brand)] text-[var(--brand)] bg-[var(--bg-card)]/50" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Estoque EPI
        </button>
        <button
          onClick={() => { setActiveTab("CATS"); setSearchQuery(""); }}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-t-xl ${activeTab === "CATS" ? "border-b-2 border-[var(--brand)] text-[var(--brand)] bg-[var(--bg-card)]/50" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Histórico CAT
        </button>
        <button
          onClick={() => { setActiveTab("ATESTADOS"); setSearchQuery(""); }}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-t-xl ${activeTab === "ATESTADOS" ? "border-b-2 border-[var(--brand)] text-[var(--brand)] bg-[var(--bg-card)]/50" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Colaboradores Afastados
        </button>
        <button
          onClick={() => { setActiveTab("DELIVERIES"); setSearchQuery(""); }}
          className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all rounded-t-xl ${activeTab === "DELIVERIES" ? "border-b-2 border-[var(--brand)] text-[var(--brand)] bg-[var(--bg-card)]/50" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Entregas de EPI
        </button>
      </div>

      {/* Dynamic Tab Body */}
      <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border)] p-6 md:p-8 min-h-[400px]">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === "DASHBOARD" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Low stock indicators */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] italic">EPIs com Estoque Crítico</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Materiais que necessitam de reposição imediata</p>
              </div>

              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                {epiStock.filter(item => item.quantidade <= (item.estoque_minimo || 5)).map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-[#000]/10 p-4 rounded-2xl border border-[var(--border)]">
                    <div>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{item.item}</span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-red-500 block mt-0.5">Estoque Crítico</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black block text-red-500">{item.quantidade} / {item.estoque_minimo || 5} {item.unidade_medida || 'UN'}</span>
                    </div>
                  </div>
                ))}

                {epiStock.filter(item => item.quantidade <= (item.estoque_minimo || 5)).length === 0 && (
                  <div className="text-center py-10 opacity-50">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                    <span className="text-xs font-bold uppercase tracking-widest">Estoque 100% Regularizado</span>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] italic">Consumo de EPIs (Mensal)</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Total de unidades distribuídas nos últimos meses</p>
              </div>

              <div className="flex flex-col justify-end gap-3 h-[250px] bg-[#000]/10 p-6 rounded-2xl border border-[var(--border)]">
                <div className="flex items-end justify-between h-full gap-4 pt-4">
                  {monthlyKPIChart.map((col, idx) => {
                    const maxVal = Math.max(...monthlyKPIChart.map(c => c.count), 1);
                    const pct = (col.count / maxVal) * 80 + 10; // min 10% for layout visibility
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                        <span className="text-[9px] font-black text-[var(--brand)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{col.count}</span>
                        <div 
                          style={{ height: `${pct}%` }} 
                          className="w-full bg-[var(--brand)] rounded-t-lg shadow-lg shadow-[var(--brand)]/10 hover:bg-orange-400 transition-colors"
                        />
                        <span className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider mt-2">{col.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEARCH BAR (Used in tabular views) */}
        {activeTab !== "DASHBOARD" && (
          <div className="flex items-center gap-4 bg-[#000]/10 border border-[var(--border)] px-4 py-3 rounded-2xl mb-6">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input 
              className="bg-transparent border-none outline-none font-bold text-sm w-full text-[var(--text-primary)]" 
              placeholder={`Filtrar listagem de ${activeTab === "EPI_STOCK" ? "EPIs" : activeTab === "CATS" ? "CATs" : activeTab === "ATESTADOS" ? "Atestados" : "Entregas"}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* TAB 2: EPI_STOCK */}
        {activeTab === "EPI_STOCK" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#000]/20 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="p-4">Item (EPI/EPC)</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-center">Quantidade Atual</th>
                  <th className="p-4 text-center">Mínimo de Segurança</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredStock.map(item => {
                  const isLow = item.quantidade <= (item.estoque_minimo || 5);
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors text-xs font-bold">
                      <td className="p-4 text-[var(--text-primary)] uppercase">{item.item}</td>
                      <td className="p-4 text-[var(--text-muted)] uppercase">{item.categoria || 'N/A'}</td>
                      <td className={`p-4 text-center ${isLow ? 'text-red-500 font-black' : 'text-[var(--text-primary)]'}`}>{item.quantidade} {item.unidade_medida || 'UN'}</td>
                      <td className="p-4 text-center text-[var(--text-muted)]">{item.estoque_minimo || 5} {item.unidade_medida || 'UN'}</td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isLow ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                          {isLow ? 'REPOR ESTOQUE' : 'REGULAR'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-[var(--text-muted)] uppercase tracking-widest">Nenhum item encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CATS */}
        {activeTab === "CATS" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#000]/20 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Unidade</th>
                  <th className="p-4">Data Ocorrido</th>
                  <th className="p-4">Tipo Acidente</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredCats.map(cat => (
                  <tr key={cat.id} className="hover:bg-white/5 transition-colors text-xs font-bold">
                    <td className="p-4">
                      <span className="block text-[var(--text-primary)]">{cat.colaborador_nome}</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">{cat.colaborador_cpf} · {cat.colaborador_cargo}</span>
                    </td>
                    <td className="p-4 text-[var(--text-primary)] uppercase">{cat.unidade_alocada}</td>
                    <td className="p-4 text-[var(--text-muted)]">{cat.data_ocorrido} {cat.horario_ocorrido}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] uppercase font-black">
                        {cat.tipo_acidente}
                      </span>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedCat(cat)}
                        className="p-2 text-zinc-400 hover:text-[var(--brand)] transition-colors"
                        title="Ver Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handlePrintCAT(cat)}
                        className="p-2 text-zinc-400 hover:text-[var(--brand)] transition-colors"
                        title="Imprimir CAT"
                      >
                        <Printer size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCats.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-[var(--text-muted)] uppercase tracking-widest">Nenhuma CAT registrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: ATESTADOS */}
        {activeTab === "ATESTADOS" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#000]/20 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">Unidade</th>
                  <th className="p-4">Data do Afastamento</th>
                  <th className="p-4 text-center">Dias de Atestado</th>
                  <th className="p-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredAtestados.map(atest => (
                  <tr key={atest.id} className="hover:bg-white/5 transition-colors text-xs font-bold">
                    <td className="p-4 text-[var(--text-primary)] uppercase">{atest.colaborador_ausente_nome || 'Não Informado'}</td>
                    <td className="p-4 text-[var(--text-muted)] uppercase">{atest.unidade || 'N/A'}</td>
                    <td className="p-4 text-[var(--text-primary)]">{atest.data}</td>
                    <td className="p-4 text-center text-[var(--brand)] font-black">{atest.dias_atestado || 'N/A'} Dias</td>
                    <td className="p-4 text-[var(--text-muted)] max-w-xs truncate" title={atest.observacoes}>{atest.observacoes || 'N/A'}</td>
                  </tr>
                ))}
                {filteredAtestados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-[var(--text-muted)] uppercase tracking-widest">Nenhum atestado médico registrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: DELIVERIES */}
        {activeTab === "DELIVERIES" && (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#000]/20 border-b border-[var(--border)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="p-4">Protocolo</th>
                  <th className="p-4">EPI Recebido</th>
                  <th className="p-4 text-center">Qtd Entregue</th>
                  <th className="p-4">Beneficiário</th>
                  <th className="p-4">Unidade Destino</th>
                  <th className="p-4">Data Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredDeliveries.map(del => (
                  <tr key={del.id} className="hover:bg-white/5 transition-colors text-xs font-bold">
                    <td className="p-4 text-[var(--brand)] uppercase font-black">{del.protocolo}</td>
                    <td className="p-4 text-[var(--text-primary)] uppercase">{del.item_nome}</td>
                    <td className="p-4 text-center text-[var(--text-primary)] font-black">{del.quantidade}</td>
                    <td className="p-4 text-[var(--text-primary)] uppercase">{del.solicitante}</td>
                    <td className="p-4 text-[var(--text-muted)] uppercase">{del.unidade_destino}</td>
                    <td className="p-4 text-[var(--text-muted)]">{del.data_solicitacao ? new Date(del.data_solicitacao).toLocaleDateString('pt-BR') : 'N/A'}</td>
                  </tr>
                ))}
                {filteredDeliveries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-[var(--text-muted)] uppercase tracking-widest">Nenhuma entrega de EPI localizada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Adaptive Modal for CAT View */}
      <AdaptiveModal 
        isOpen={!!selectedCat} 
        onClose={() => setSelectedCat(null)} 
        title="Dossiê Investigativo de CAT"
        width="650px"
      >
        {selectedCat && (
          <div className="flex flex-col gap-6 p-2 text-xs font-bold">
            <div className="bg-[#000]/10 p-5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-black uppercase text-[var(--text-muted)] block tracking-widest mb-3">Colaborador</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Nome Completo</span>
                  <span className="text-sm font-black text-[var(--text-primary)] uppercase">{selectedCat.colaborador_nome}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">CPF</span>
                  <span className="text-sm font-black text-[var(--text-primary)]">{selectedCat.colaborador_cpf}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Cargo</span>
                  <span className="text-sm font-black text-[var(--text-primary)] uppercase">{selectedCat.colaborador_cargo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Unidade</span>
                  <span className="text-sm font-black text-[var(--text-primary)] uppercase">{selectedCat.unidade_alocada}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#000]/10 p-5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-black uppercase text-[var(--text-muted)] block tracking-widest mb-3">Dados do Incidente</span>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Data Ocorrido</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{selectedCat.data_ocorrido}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Horário</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{selectedCat.horario_ocorrido}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Tipo do Acidente</span>
                  <span className="text-xs font-black text-[var(--brand)] uppercase">{selectedCat.tipo_acidente}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[var(--text-muted)] block">Agente Causador</span>
                  <span className="text-xs font-black text-[var(--text-primary)] uppercase">{selectedCat.agente_causador || 'Não informado'}</span>
                </div>
              </div>
              <div className="border-t border-[var(--border)] pt-4 mt-2">
                <span className="text-[10px] uppercase text-[var(--text-muted)] block mb-1">Descrição do Ocorrido</span>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-black/20 p-3 rounded-xl border border-[var(--border)]">{selectedCat.descricao_ocorrido}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setSelectedCat(null)}
                className="btn-secondary !h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest"
              >
                Fechar
              </button>
              <button 
                onClick={() => handlePrintCAT(selectedCat)}
                className="btn-primary !h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
              >
                <Printer size={14} />
                Imprimir Ficha
              </button>
            </div>
          </div>
        )}
      </AdaptiveModal>
    </div>
  );
}
