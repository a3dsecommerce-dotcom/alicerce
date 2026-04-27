"use client";
import { useState, useEffect } from "react";
import { ClipboardCheck, MapPin, CheckCircle2, AlertTriangle, Send, Camera, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { n8n } from "@/lib/n8n";

export default function ChecklistUnidadePage() {
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [checklist, setChecklist] = useState({
    unidade_id: "",
    limpeza_ok: true,
    postura_ok: true,
    materiais_ok: true,
    epis_ok: true,
    observacoes: ""
  });

  useEffect(() => {
    async function loadUnidades() {
      const { data } = await supabase.from('unidades').select('id, nome');
      setUnidades(data || []);
    }
    loadUnidades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const unidade = unidades.find(u => u.id === checklist.unidade_id);
    
    try {
      // Disparar gatilho n8n (Espelhamento do WhatsApp do Encarregado)
      await n8n.trigger('checklist-unidade-portal', {
        ...checklist,
        unidade_nome: unidade?.nome,
        enviado_por: "Portal (Modo Fixo/Visual)"
      });

      setSuccess(true);
      setChecklist({
        unidade_id: "",
        limpeza_ok: true,
        postura_ok: true,
        materiais_ok: true,
        epis_ok: true,
        observacoes: ""
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert("Erro ao processar checklist via n8n.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <ClipboardCheck className="text-[var(--brand)]" /> Auditoria e Checklist de Unidade
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-2 max-w-2xl">
            Este formulário espelha o menu "Checklist de Rota" do WhatsApp. Use-o para realizar auditorias visuais detalhadas durante visitas presenciais às unidades.
          </p>
        </div>
        <ClipboardCheck className="absolute right-[-20px] bottom-[-20px] opacity-5 rotate-12" size={200} />
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-[var(--bg-surface)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Seleção de Unidade */}
            <div>
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 block">Unidade Auditada</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-4 text-[var(--text-muted)]" />
                <select 
                  required
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl px-12 py-4 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all appearance-none"
                  value={checklist.unidade_id}
                  onChange={e => setChecklist({...checklist, unidade_id: e.target.value})}
                >
                  <option value="">Selecione a Unidade...</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </div>

            {/* Itens do Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: "limpeza_ok", label: "Limpeza e Organização", desc: "Ambiente limpo e materiais guardados" },
                { id: "postura_ok", label: "Postura e Uniforme", desc: "Colaboradores uniformizados e alertas" },
                { id: "materiais_ok", label: "Nível de Materiais", desc: "Estoque condizente com a necessidade" },
                { id: "epis_ok", label: "Uso de EPIs", desc: "Equipamentos de segurança em uso" },
              ].map((item) => (
                <div key={item.id} className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border)] flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{item.label}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{item.desc}</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={(checklist as any)[item.id]}
                      onChange={e => setChecklist({...checklist, [item.id]: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--brand)]"></div>
                  </label>
                </div>
              ))}
            </div>

            {/* Observações e Fotos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 block">Observações Gerais</label>
                <textarea 
                  rows={5}
                  placeholder="Descreva detalhes importantes da auditoria..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl px-4 py-4 text-[var(--text-primary)] focus:border-[var(--brand)] outline-none transition-all resize-none"
                  value={checklist.observacoes}
                  onChange={e => setChecklist({...checklist, observacoes: e.target.value})}
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 block">Evidência Fotográfica</label>
                <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 hover:border-[var(--brand)] transition-all cursor-pointer bg-[var(--bg-base)]/50">
                  <Camera size={32} className="text-[var(--text-muted)]" />
                  <div>
                    <div className="text-xs font-bold text-[var(--text-primary)]">Clique para anexar fotos</div>
                    <div className="text-[10px] text-[var(--text-muted)]">O WhatsApp pede foto em tempo real, aqui você pode subir o arquivo.</div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || !checklist.unidade_id}
              className="btn-brand py-5 rounded-2xl font-bold flex items-center justify-center gap-3 text-lg shadow-xl shadow-[var(--brand)]/20 disabled:opacity-50"
            >
              {loading ? "Processando Auditoria..." : <><Send size={20} /> Finalizar Checklist e Enviar ao RH</>}
            </button>

            {success && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center gap-3 text-green-500 animate-bounce text-sm">
                <CheckCircle2 size={20} /> Auditoria enviada! O n8n gerou o relatório e notificou a Gerência.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
