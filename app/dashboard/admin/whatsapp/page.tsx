"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Users, ShieldCheck, Map, Zap, Phone, CheckCircle2, AlertTriangle, Cpu, Globe, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function WhatsAppCommandPage() {
  const [stats, setStats] = useState({ totalMsgs: 1420, botSuccess: 98.5, activeColabs: 247 });
  const [aba, setAba] = useState<"status" | "menus" | "ia" | "logs">("status");

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header Premium */}
      <div className="bg-[#25D366] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle size={32} fill="white" />
            <h1 className="text-2xl font-bold">WhatsApp Business: Central de Inteligência</h1>
          </div>
          <p className="opacity-90 max-w-2xl">
            Sua operação roda no WhatsApp. Monitore fluxos, edite menus de autoatendimento e treine a IA que atende seus colaboradores e encarregados em campo.
          </p>
        </div>
        <Globe className="absolute right-[-40px] bottom-[-40px] opacity-10 rotate-12" size={240} />
      </div>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Mensagens (24h)", value: stats.totalMsgs, icon: MessageSquare, color: "text-[#25D366]" },
          { label: "Taxa de Sucesso IA", value: `${stats.botSuccess}%`, icon: Cpu, color: "text-blue-500" },
          { label: "Colaboradores On", value: stats.activeColabs, icon: Users, color: "text-orange-500" },
          { label: "Alertas Críticos", value: "0", icon: ShieldCheck, color: "text-green-500" },
        ].map((k, i) => (
          <div key={i} className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border)] flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 ${k.color}`}>
              <k.icon size={20} />
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] font-medium">{k.label}</div>
              <div className="text-xl font-bold text-[var(--text-primary)]">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-[var(--bg-surface)] rounded-3xl border border-[var(--border)] overflow-hidden flex flex-col min-h-[500px]">
        <div className="flex p-2 gap-2 bg-[var(--bg-base)] border-b border-[var(--border)]">
          {[
            { id: "status", label: "Status da Operação", icon: Zap },
            { id: "menus", label: "Estrutura de Menus", icon: Map },
            { id: "ia", label: "Treinamento de IA", icon: Cpu },
            { id: "logs", label: "Logs em Tempo Real", icon: Phone },
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setAba(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${aba === t.id ? 'bg-[#25D366] text-white shadow-lg' : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-8 flex-1">
          {aba === "status" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Zap className="text-[#25D366]" /> Fluxos Ativos via n8n</h3>
                <div className="space-y-4">
                  {[
                    { name: "Registro de Ponto Biométrico (Foto)", status: "Ativo", latency: "0.4s" },
                    { name: "Abertura de Ocorrência em Campo", status: "Ativo", latency: "0.2s" },
                    { name: "Relatório de Rota do Encarregado", status: "Ativo", latency: "0.8s" },
                    { name: "Canal de Ética (Denúncia Anônima)", status: "Ativo", latency: "0.3s" },
                    { name: "Solicitação de EPI via Bot", status: "Em Manutenção", latency: "-" },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${f.status === 'Ativo' ? 'bg-[#25D366] animate-pulse' : 'bg-orange-500'}`} />
                        <span className="text-sm font-semibold">{f.name}</span>
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">Latência: {f.latency}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--bg-base)] p-6 rounded-3xl border border-[var(--border)]">
                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase mb-4">Uso por Horário (Pico)</h3>
                <div className="h-48 flex items-end gap-2 px-2">
                  {[40, 20, 15, 60, 90, 100, 80, 50, 30, 20, 10, 5].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#25D366] opacity-80 rounded-t-lg transition-all hover:opacity-100" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-[var(--text-muted)] font-bold">
                  <span>06h</span><span>12h</span><span>18h</span><span>00h</span>
                </div>
              </div>
            </div>
          )}

          {aba === "menus" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Menu Colaborador */}
              <div className="card-glass p-6 rounded-3xl border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Users size={20} /></div>
                  <h3 className="font-bold">Menu do Colaborador</h3>
                </div>
                <div className="space-y-3">
                  {["1. Bater Ponto (Entrada/Saída)", "2. Informar Ocorrência", "3. Canal de Ética (Sigiloso)", "4. Solicitar Contracheque/Férias", "5. Enviar Atestado Médico", "6. Falar com Atendente (Humano)"].map(m => (
                    <div key={m} className="p-3 bg-white dark:bg-gray-800 rounded-xl text-sm border border-[var(--border)] shadow-sm">{m}</div>
                  ))}
                </div>
              </div>
              {/* Menu Encarregado */}
              <div className="card-glass p-6 rounded-3xl border border-[var(--border)] bg-[#25D366]/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-lg"><Zap size={20} /></div>
                  <h3 className="font-bold">Menu do Encarregado (Rota)</h3>
                </div>
                <div className="space-y-3">
                  {["1. Iniciar Rota do Dia", "2. Checklist de Unidade (Audit)", "3. Reatribuir Equipe (Manejo)", "4. Solicitar Volante Urgente", "5. Reportar Problema Grave", "6. Ver Quadro de Escala Online"].map(m => (
                    <div key={m} className="p-3 bg-white dark:bg-gray-800 rounded-xl text-sm border border-[#25D366]/20 shadow-sm font-semibold">{m}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {aba === "ia" && (
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Cpu size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Alicerce AI Engine</h3>
                  <p className="text-[var(--text-muted)] text-sm">Treine a inteligência que processa as ocorrências do WhatsApp.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                  <h4 className="text-sm font-bold mb-2 flex items-center gap-2"><CheckCircle2 size={16} className="text-blue-500" /> Compreensão de Contexto</h4>
                  <p className="text-xs text-[var(--text-muted)] mb-4">A IA identifica automaticamente se uma mensagem é uma reclamação, elogio ou solicitação de material.</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-blue">Reclamação: 99% acerto</span>
                    <span className="badge badge-green">Ponto: 100% acerto</span>
                    <span className="badge badge-amber">Atestado: 92% acerto</span>
                  </div>
                </div>

                <div className="p-6 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)]">
                  <h4 className="text-sm font-bold mb-4">Novo Treinamento de Regra</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input className="input-field" placeholder="Se o colaborador disser..." />
                    <input className="input-field" placeholder="A IA deve responder..." />
                  </div>
                  <button className="btn-brand bg-blue-600 hover:bg-blue-700 w-full">Adicionar Regra ao n8n Brain</button>
                </div>
              </div>
            </div>
          )}

          {aba === "logs" && (
             <div className="space-y-4">
               {[
                 { time: "11:45:02", user: "Encarregado Paulo", action: "Checklist Unidade Nabucco Enviado", type: "SUCCESS" },
                 { time: "11:44:50", user: "ASG Maria", action: "Foto do Ponto Processada (IA)", type: "SUCCESS" },
                 { time: "11:40:12", user: "Candidato #882", action: "Documento RG Enviado", type: "INFO" },
                 { time: "11:38:05", user: "Bot", action: "Aviso de Baixo Estoque disparado p/ WhatsApp", type: "WARNING" },
                 { time: "11:35:22", user: "Anônimo", action: "Denúncia Ética iniciada", type: "SECURITY" },
               ].map((l, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 hover:bg-[var(--bg-base)] rounded-xl transition-all border-b border-transparent hover:border-[var(--border)]">
                   <span className="text-[10px] font-mono text-[var(--text-muted)] w-16">{l.time}</span>
                   <div className="flex-1">
                     <span className="text-sm font-bold">{l.user}</span>
                     <span className="text-sm text-[var(--text-muted)] ml-3">{l.action}</span>
                   </div>
                   <span className={`badge ${l.type === 'SUCCESS' ? 'badge-green' : l.type === 'WARNING' ? 'badge-amber' : l.type === 'SECURITY' ? 'badge-red' : 'badge-blue'}`}>{l.type}</span>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
