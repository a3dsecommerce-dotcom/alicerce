"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, User, FileText, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function DisciplinaPanel({ user, myColabs }: { user: any, myColabs: any[] }) {
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscaColab, setBuscaColab] = useState("");
  const [colabsSugeridos, setColabsSugeridos] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    colaborador_id: '',
    colaborador_nome: '',
    colaborador_cpf: '',
    colaborador_cargo: '',
    unidade_alocada: '',
    categoria_motivo: 'ASSIDUIDADE',
    descricao_motivo: '',
    data_ocorrencia: new Date().toISOString().split('T')[0],
    detalhes_ocorrencia: '',
    testemunhas: '',
    nivel_sugerido_encarregado: 'VERBAL'
  });

  const [historicoColab, setHistoricoColab] = useState<any[]>([]);

  useEffect(() => {
    fetchProcessos();
  }, [user.id]);

  const fetchProcessos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('processos_disciplinares')
      .select('*')
      .eq('encarregado_solicitante_id', user.id)
      .order('created_at', { ascending: false });
    
    setProcessos(data || []);
    setLoading(false);
  };

  const handleBuscarColab = async (termo: string) => {
    setBuscaColab(termo);
    if (termo.length < 3) {
      setColabsSugeridos([]);
      return;
    }
    
    // Busca global direta no banco de dados para garantir que encontre o colaborador
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('nome', `%${termo}%`)
      .limit(10);
      
    if (error) console.error("Erro na busca de usuários:", error);
      
    if (data) {
      setColabsSugeridos(data);
    }
  };

  const selecionarColab = async (colab: any) => {
    setForm({
      ...form,
      colaborador_id: colab.id,
      colaborador_nome: colab.nome,
      colaborador_cpf: colab.cpf || "",
      colaborador_cargo: colab.cargo || colab.funcao || "",
      unidade_alocada: colab.unidade_alocacao || ""
    });
    setBuscaColab("");
    setColabsSugeridos([]);

    // Buscar histórico do colaborador para sugerir o nível
    const { data } = await supabase
      .from('processos_disciplinares')
      .select('categoria_motivo, nivel_sugerido_encarregado, nivel_aplicado_final, status')
      .eq('colaborador_id', colab.id);
      
    if (data) {
      setHistoricoColab(data);
    }
  };

  // Termômetro Inteligente
  useEffect(() => {
    if (form.colaborador_id && historicoColab.length > 0) {
      const reincidencias = historicoColab.filter(h => h.categoria_motivo === form.categoria_motivo && h.status !== 'REJEITADO').length;
      
      if (reincidencias === 0) {
        setForm(f => ({ ...f, nivel_sugerido_encarregado: 'VERBAL' }));
      } else if (reincidencias === 1) {
        setForm(f => ({ ...f, nivel_sugerido_encarregado: 'ESCRITA' }));
      } else if (reincidencias >= 2) {
        setForm(f => ({ ...f, nivel_sugerido_encarregado: 'SUSPENSAO' }));
      }
    } else {
      setForm(f => ({ ...f, nivel_sugerido_encarregado: 'VERBAL' }));
    }
  }, [form.categoria_motivo, form.colaborador_id, historicoColab]);

  const handleSubmit = async () => {
    if (!form.colaborador_id || !form.detalhes_ocorrencia || !form.descricao_motivo) {
      toast.error("Preencha o colaborador, o motivo e os detalhes.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('processos_disciplinares').insert([{
      ...form,
      encarregado_solicitante_id: user.id,
      encarregado_solicitante_nome: user.nome
    }]);

    if (!error) {
      toast.success("Processo enviado para aprovação da Gerência Operacional!");
      setForm({
        colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
        categoria_motivo: 'ASSIDUIDADE', descricao_motivo: '',
        data_ocorrencia: new Date().toISOString().split('T')[0],
        detalhes_ocorrencia: '', testemunhas: '', nivel_sugerido_encarregado: 'VERBAL'
      });
      setHistoricoColab([]);
      fetchProcessos();
    } else {
      toast.error("Erro ao registrar: " + error.message);
    }
    setSaving(false);
  };

  const reincidencias = historicoColab.filter(h => h.categoria_motivo === form.categoria_motivo && h.status !== 'REJEITADO').length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 max-w-[1200px] mx-auto w-full">
      <div className="bg-[var(--bg-card)] p-12 rounded-[3.5rem] border border-[var(--border)] shadow-2xl relative overflow-hidden">
        
        <div className="flex justify-between items-start mb-12 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase italic tracking-tighter">Gestão Disciplinar</h3>
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Abertura e Histórico de Processos Operacionais</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          
          {/* LADO ESQUERDO: FORMULÁRIO */}
          <div className="space-y-8">
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Buscar Colaborador</label>
              <input 
                type="text" 
                className="input-field w-full font-black" 
                placeholder="Nome ou CPF..."
                value={form.colaborador_nome || buscaColab}
                onChange={e => {
                  setForm({...form, colaborador_nome: '', colaborador_id: ''});
                  setHistoricoColab([]);
                  handleBuscarColab(e.target.value);
                }}
              />
              {colabsSugeridos.length > 0 && (
                <div className="absolute top-[100%] mt-2 left-0 w-full bg-white border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden">
                  {colabsSugeridos.map(c => (
                    <div key={c.id} className="p-4 border-b border-[var(--border)] hover:bg-[var(--brand)] hover:text-white cursor-pointer transition-all" onClick={() => selecionarColab(c)}>
                      <div className="text-xs font-black">{c.nome}</div>
                      <div className="text-[10px] uppercase opacity-80">{c.cargo || c.funcao} - {c.unidade_alocacao}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {form.colaborador_id && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Termômetro */}
                <div className={`p-6 rounded-2xl border ${reincidencias === 0 ? 'bg-green-50 border-green-200 text-green-800' : reincidencias === 1 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Termômetro Disciplinar</span>
                  </div>
                  <p className="text-sm font-bold">
                    {reincidencias === 0 ? "Primeiro registro nesta categoria. O sistema sugerirá Orientação Verbal." : 
                     reincidencias === 1 ? "Colaborador possui 1 reincidência. Sugestão: Advertência Escrita." : 
                     "Múltiplas reincidências. Sugestão: Suspensão ou Análise Crítica."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Categoria</label>
                    <select className="input-field w-full font-black" value={form.categoria_motivo} onChange={e => setForm({...form, categoria_motivo: e.target.value})}>
                      <option value="ASSIDUIDADE">ASSIDUIDADE (Faltas/Atrasos)</option>
                      <option value="CONDUTA_INSUBORDINACAO">CONDUTA / INSUBORDINAÇÃO</option>
                      <option value="SEGURANCA_EPI">SEGURANÇA (EPI / Normas)</option>
                      <option value="PATRIMONIO">PATRIMÔNIO (Danos/Mau uso)</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Data da Ocorrência</label>
                    <input type="date" className="input-field w-full font-black" value={form.data_ocorrencia} onChange={e => setForm({...form, data_ocorrencia: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Resumo do Motivo</label>
                  <input className="input-field w-full font-black" placeholder="Ex: Faltou sem atestado dia 10/05" value={form.descricao_motivo} onChange={e => setForm({...form, descricao_motivo: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Detalhes do Ocorrido</label>
                  <textarea className="input-field w-full h-32 p-4 font-medium" placeholder="Descreva como aconteceu..." value={form.detalhes_ocorrencia} onChange={e => setForm({...form, detalhes_ocorrencia: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Testemunhas (Opcional)</label>
                    <input className="input-field w-full font-black" placeholder="Nomes..." value={form.testemunhas} onChange={e => setForm({...form, testemunhas: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Pena Sugerida (Final: Gerência)</label>
                    <select className="input-field w-full font-black text-orange-700" value={form.nivel_sugerido_encarregado} onChange={e => setForm({...form, nivel_sugerido_encarregado: e.target.value})}>
                      <option value="VERBAL">VERBAL (Orientação)</option>
                      <option value="ESCRITA">ADVERTÊNCIA ESCRITA</option>
                      <option value="SUSPENSAO">SUSPENSÃO</option>
                      <option value="JUSTA_CAUSA">JUSTA CAUSA</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSubmit} disabled={saving}
                  className="w-full h-14 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                >
                  {saving ? 'Enviando...' : 'Enviar para Avaliação da Gerência'}
                </button>
              </div>
            )}
          </div>

          {/* LADO DIREITO: LISTA DE PROCESSOS */}
          <div className="bg-[var(--bg-base)] p-8 rounded-3xl border border-[var(--border)] overflow-hidden flex flex-col h-[700px]">
            <h4 className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-6 flex items-center gap-2 tracking-widest">
              <Clock size={14} /> Meus Processos em Andamento
            </h4>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {loading ? (
                <div className="text-[10px] text-center font-bold text-[var(--text-muted)] p-10 uppercase">Carregando...</div>
              ) : processos.length === 0 ? (
                <div className="text-[10px] text-center font-bold text-[var(--text-muted)] p-10 uppercase italic border border-dashed border-[var(--border)] rounded-xl">
                  Nenhum processo disciplinar aberto.
                </div>
              ) : processos.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-2xl border border-[var(--border)] shadow-sm hover:border-[var(--brand)] transition-all relative">
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs font-black">{p.colaborador_nome}</div>
                      <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{p.categoria_motivo} • {new Date(p.data_ocorrencia).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      p.status === 'PENDENTE_GERENCIA' ? 'bg-orange-100 text-orange-700' : 
                      p.status === 'PENDENTE_RH' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'APROVADO_RH' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-2 mb-3">
                    {p.descricao_motivo}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-1 rounded">Sugerido: {p.nivel_sugerido_encarregado}</span>
                    {p.nivel_aplicado_final && (
                      <span className="text-[9px] font-black uppercase text-white bg-green-600 px-2 py-1 rounded shadow-sm">Aplicado: {p.nivel_aplicado_final}</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
