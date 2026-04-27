"use client";

import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  FileText, 
  Send, 
  Download, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  BrainCircuit,
  Zap
} from "lucide-react";

export default function IAReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<null | string>(null);
  const [step, setStep] = useState(0);

  const steps = [
    "Coletando dados do Almoxarifado...",
    "Analisando tendências de consumo por secretaria...",
    "Calculando KPIs de fulfillment de carga...",
    "Cruzando dados com logs de auditoria...",
    "Redigindo resumo executivo (GPT-4o)..."
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setStep(0);
    setReport(null);
  };

  useEffect(() => {
    if (isGenerating && progress < 100) {
      const timer = setTimeout(() => {
        setProgress(prev => prev + 1);
        if (progress % 20 === 0 && progress > 0) {
          setStep(prev => Math.min(prev + 1, steps.length - 1));
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (progress === 100) {
      setIsGenerating(false);
      setReport(`
# 📊 Relatório Executivo de Suprimentos - Abril 2026
**Gerado por Alicerce IA v2.5**

## 🎯 Sumário Executivo
Este mês registramos um aumento de **14% na eficiência de entrega** em comparação ao mês anterior. A integração do sistema de check-in reduziu erros de digitação em **98%**, garantindo uma auditoria impecável para a prefeitura.

## 🚚 Performance Logística (Fulfillment)
- **SEMED**: 92% de fulfillment. Destaque para o recebimento antecipado de itens de higiene.
- **SEMSA**: 78% de fulfillment. Identificamos um gargalo na entrega de luvas descartáveis (pendência de 22% do pedido total).
- **SEMAD**: 100% concluído.

## ⚠️ Pontos de Atenção (Insights IA)
1. **Consumo Atípico**: A secretaria SEMED consumiu 30% mais papel toalha do que a média histórica. Sugerimos revisão do controle de distribuição nas unidades escolares.
2. **Estoque Crítico**: O estoque de botas de segurança (Tamanho 40-42) atingiu o nível mínimo. Recomenda-se compra imediata para evitar paralisação de campo.
3. **Eficiência Terceirizada**: A transportadora "TransNorte" entregou com 2 dias de atraso na última semana. Recomenda-se advertência ou revisão de contrato.

## 💡 Recomendação Estratégica
Otimizar a logística de entrega da SEMSA unificando os pedidos de EPI com os de consumo para reduzir custos de frete em aproximadamente **12%**.

---
*Este relatório é confidencial e destinado exclusivamente à gerência da Alicerce Serviços.*
      `);
    }
  }, [isGenerating, progress]);

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <BrainCircuit size={32} color="var(--brand)" /> 
            Relatórios de IA <span style={{ fontSize: "0.7rem", padding: "4px 8px", background: "var(--brand-light)", color: "var(--brand)", borderRadius: "20px", verticalAlign: "middle" }}>PREMIUM</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Análise estratégica autônoma baseada em dados reais da operação.</p>
        </div>
        
        {!isGenerating && !report && (
          <button className="btn-brand" onClick={handleGenerate} style={{ height: "48px", padding: "0 1.5rem", borderRadius: "12px", gap: "0.75rem" }}>
            <Zap size={18} /> Gerar Relatório Executivo do Mês
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: report ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        
        {/* State: Initial */}
        {!isGenerating && !report && (
          <>
            <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-base) 100%)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(124, 58, 237, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <BarChart3 size={30} color="var(--brand)" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Insights de Almoxarifado</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                A IA analisa todas as entradas de carga e saídas de EPI para identificar padrões de desperdício ou gargalos.
              </p>
            </div>

            <div className="card" style={{ padding: "2rem", textAlign: "center", background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-base) 100%)" }}>
              <div style={{ width: "60px", height: "60px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <Sparkles size={30} color="#10B981" />
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: "1rem" }}>Análise de Compliance</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                Monitoramento de auditoria para garantir que 100% das entregas possuam recibos físicos assinados.
              </p>
            </div>
          </>
        )}

        {/* State: Generating */}
        {isGenerating && (
          <div className="card" style={{ padding: "4rem 2rem", textAlign: "center", gridColumn: "1 / -1" }}>
            <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 2rem" }}>
               <div style={{ 
                 position: "absolute", 
                 inset: 0, 
                 borderRadius: "50%", 
                 border: "4px solid var(--bg-base)",
                 borderTopColor: "var(--brand)",
                 animation: "spin 1.5s linear infinite"
               }} />
               <div style={{ 
                 position: "absolute", 
                 inset: "15px", 
                 borderRadius: "50%", 
                 background: "rgba(124, 58, 237, 0.05)",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center"
               }}>
                 <Bot size={40} color="var(--brand)" />
               </div>
            </div>
            
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{steps[step]}</h2>
            <div style={{ width: "300px", height: "8px", background: "var(--bg-base)", borderRadius: "4px", margin: "0 auto 1.5rem", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--brand)", transition: "width 0.1s" }} />
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{progress}% Concluído</p>
          </div>
        )}

        {/* State: Report Result */}
        {report && (
          <div style={{ animation: "fadeIn 0.5s ease-out" }}>
            <div className="card" style={{ padding: "3rem", background: "var(--bg-card)", position: "relative", marginBottom: "2rem" }}>
              <div style={{ position: "absolute", top: "2rem", right: "2rem", display: "flex", gap: "1rem" }}>
                <button className="btn-base" style={{ height: "40px", padding: "0 1rem", fontSize: "0.8rem", gap: "0.5rem" }}>
                  <Download size={14} /> PDF
                </button>
                <button className="btn-base" style={{ height: "40px", padding: "0 1rem", fontSize: "0.8rem", gap: "0.5rem" }}>
                  <Send size={14} /> Enviar p/ WhatsApp
                </button>
              </div>
              
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.8", color: "var(--text-primary)" }}>
                {report}
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button className="btn-base" onClick={() => setReport(null)} style={{ border: "none", color: "var(--text-muted)" }}>
                Gerar novo relatório
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
