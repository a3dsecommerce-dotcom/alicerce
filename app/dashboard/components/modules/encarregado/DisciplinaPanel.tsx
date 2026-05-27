"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, User, FileText, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function DisciplinaPanel({ user, myColabs }: { user: any, myColabs: any[] }) {
  const [processos, setProcessos] = useState<any[]>([]);
  const [padroes, setPadroes] = useState<any[]>([]);
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
    categoria_motivo: '',
    descricao_motivo: '',
    data_ocorrencia: new Date().toISOString().split('T')[0],
    detalhes_ocorrencia: '',
    testemunhas: '',
    variaveis_adicionais: {} as Record<string, string>
  });

  const [historicoColab, setHistoricoColab] = useState<any[]>([]);

  useEffect(() => {
    fetchProcessos();
    fetchPadroes();
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

  const fetchPadroes = async () => {
    const { data } = await supabase.from('padroes_advertencia').select('*').order('categoria');
    if (data && data.length > 0) {
      setPadroes(data);
      const cat = data[0].categoria;
      const mot = data.find(p => p.categoria === cat)?.motivo_especifico || '';
      setForm(f => ({ ...f, categoria_motivo: cat, descricao_motivo: mot }));
    }
  };

  const handleBuscarColab = async (termo: string) => {
    setBuscaColab(termo);
    if (termo.length < 3) {
      setColabsSugeridos([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('nome', `%${termo}%`)
      .limit(10);
      
    if (error) console.error("Erro na busca de usuários:", error);
    if (data) setColabsSugeridos(data);
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

    const { data } = await supabase
      .from('processos_disciplinares')
      .select('categoria_motivo, nivel_sugerido_encarregado, nivel_aplicado_final, status')
      .eq('colaborador_id', colab.id);
      
    if (data) setHistoricoColab(data);
  };

  const categoriasUnicas = useMemo(() => Array.from(new Set(padroes.map(p => p.categoria))), [padroes]);
  const motivosDaCategoria = useMemo(() => {
    if (!form.categoria_motivo) return [];
    return Array.from(new Set(padroes.filter(p => p.categoria === form.categoria_motivo).map(p => p.motivo_especifico)));
  }, [padroes, form.categoria_motivo]);

  // Atualiza o motivo se a categoria mudar
  useEffect(() => {
    if (motivosDaCategoria.length > 0 && !motivosDaCategoria.includes(form.descricao_motivo)) {
      setForm(f => ({ ...f, descricao_motivo: motivosDaCategoria[0] }));
    }
  }, [form.categoria_motivo, motivosDaCategoria]);

  const reincidencias = historicoColab.filter(h => h.categoria_motivo === form.categoria_motivo && h.status !== 'REJEITADO').length;

  const padraoSugerido = useMemo(() => {
    if (!form.categoria_motivo || !form.descricao_motivo) return null;
    const possiveis = padroes.filter(p => p.categoria === form.categoria_motivo && p.motivo_especifico === form.descricao_motivo).sort((a,b) => a.nivel_gravidade - b.nivel_gravidade);
    if (possiveis.length === 0) return null;
    
    let nivelAlvo = reincidencias + 1;
    let selecionado = possiveis.find(p => p.nivel_gravidade === nivelAlvo);
    
    if (!selecionado) {
      const menores = possiveis.filter(p => p.nivel_gravidade <= nivelAlvo);
      if (menores.length > 0) selecionado = menores[menores.length - 1];
      else selecionado = possiveis[possiveis.length - 1];
    }
    return selecionado;
  }, [padroes, form.categoria_motivo, form.descricao_motivo, reincidencias]);

  const customTags = useMemo(() => {
    if (!padraoSugerido) return [];
    const sysTags = ['NOME_COLABORADOR', 'FUNCAO', 'UNIDADE_ALOCACAO', 'DATA_OCORRENCIA', 'DATA_ATUAL', 'NARRATIVA_ENCARREGADO'];
    const matches = padraoSugerido.texto_template.match(/\[([A-Z_]+)\]/g) || [];
    const tags = matches.map((m: string) => m.replace('[', '').replace(']', ''));
    return Array.from(new Set(tags)).filter((t: string) => !sysTags.includes(t));
  }, [padraoSugerido]);

  const generateAdvertenciaPDF = async (data: any, padrao: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { logoBase64, assinaturaBase64 } = await import('./pdfImages');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    doc.setTextColor(0, 0, 0);
    
    // Header com Logo e Razão Social
    try {
      doc.addImage(logoBase64, 'PNG', 15, 12, 45, 12);
    } catch(e) {}
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ALICERCE CONSTRUÇÕES E SERVIÇOS LTDA", 65, 17);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("CNPJ: 42.971.150/0001-92", 65, 23);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MEDIDA DISCIPLINAR", pageWidth / 2, 35, { align: "center" });
    doc.line(15, 40, pageWidth - 15, 40);

    let textoFinal = padrao.texto_template;
    textoFinal = textoFinal.replace(/\[NOME_COLABORADOR\]/g, data.colaborador_nome);
    textoFinal = textoFinal.replace(/\[FUNCAO\]/g, data.colaborador_cargo);
    textoFinal = textoFinal.replace(/\[UNIDADE_ALOCACAO\]/g, data.unidade_alocada);
    textoFinal = textoFinal.replace(/\[DATA_OCORRENCIA\]/g, new Date(data.data_ocorrencia).toLocaleDateString('pt-BR'));
    textoFinal = textoFinal.replace(/\[DATA_ATUAL\]/g, new Date().toLocaleDateString('pt-BR'));
    textoFinal = textoFinal.replace(/\[NARRATIVA_ENCARREGADO\]/g, data.detalhes_ocorrencia);

    for (const tag of customTags) {
      const val = data.variaveis_adicionais[tag as string] || `[${tag}]`;
      textoFinal = textoFinal.replace(new RegExp(`\\[${tag}\\]`, 'g'), val);
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const lines = doc.splitTextToSize(textoFinal, pageWidth - 30);
    doc.text(lines, 15, 50);

    const finalY = 50 + (lines.length * 5) + 30;
    
    // Assinatura Colaborador
    doc.line(20, finalY, 90, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(data.colaborador_nome.toUpperCase(), 55, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Assinatura do Colaborador", 55, finalY + 10, { align: "center" });
    doc.setFontSize(8);
    doc.text(`Data: ____/____/________`, 55, finalY + 15, { align: "center" });
    
    // Assinatura Empresa (Emedir)
    try {
      doc.addImage(assinaturaBase64, 'JPEG', 135, finalY - 20, 40, 18);
    } catch(e) {}
    doc.line(120, finalY, 190, finalY);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Emedir Santos Gonçalves", 155, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("Diretor / Responsável Legal", 155, finalY + 10, { align: "center" });

    // Testemunhas (Recusa)
    const testY = finalY + 35;
    doc.setFont("helvetica", "italic");
    doc.text("Em caso de recusa de assinatura pelo colaborador, colher a assinatura de 2 testemunhas:", 15, testY - 5);
    doc.setFont("helvetica", "normal");
    doc.line(20, testY + 10, 90, testY + 10);
    doc.text("Testemunha 1 (Nome legível e CPF)", 55, testY + 15, { align: "center" });
    doc.line(120, testY + 10, 190, testY + 10);
    doc.text("Testemunha 2 (Nome legível e CPF)", 155, testY + 15, { align: "center" });

    doc.setFontSize(7);
    doc.text(`Documento gerado em: ${new Date().toLocaleString('pt-BR')} pelo Alicerce ERP`, 15, 285);

    doc.save(`Medida_${data.colaborador_nome.replace(/\s+/g, '_')}_${data.data_ocorrencia}.pdf`);
  };

  const handleSubmit = async () => {
    if (!form.colaborador_id || !form.detalhes_ocorrencia || !form.descricao_motivo || !padraoSugerido) {
      toast.error("Preencha todos os campos corretamente.");
      return;
    }

    setSaving(true);
    const nivelStr = padraoSugerido.nivel_gravidade === 3 ? 'SUSPENSAO' : (padraoSugerido.nivel_gravidade === 2 ? 'ADVERTENCIA (REINCIDENCIA)' : 'ADVERTENCIA');

    const payload = {
      colaborador_id: form.colaborador_id,
      colaborador_nome: form.colaborador_nome,
      colaborador_cpf: form.colaborador_cpf,
      colaborador_cargo: form.colaborador_cargo,
      unidade_alocada: form.unidade_alocada,
      categoria_motivo: form.categoria_motivo,
      descricao_motivo: form.descricao_motivo,
      data_ocorrencia: form.data_ocorrencia,
      detalhes_ocorrencia: form.detalhes_ocorrencia,
      testemunhas: form.testemunhas,
      nivel_sugerido_encarregado: nivelStr,
      padrao_advertencia_id: padraoSugerido.id,
      variaveis_adicionais: form.variaveis_adicionais,
      encarregado_solicitante_id: user.id,
      encarregado_solicitante_nome: user.nome,
      status: 'PENDENTE_GERENCIA'
    };

    const { error } = await supabase.from('processos_disciplinares').insert([payload]);

    if (!error) {
      toast.success("Processo enviado para aprovação da Gerência Operacional!");
      generateAdvertenciaPDF(form, padraoSugerido);
      
      setForm({
        ...form,
        colaborador_id: '', colaborador_nome: '', colaborador_cpf: '', colaborador_cargo: '', unidade_alocada: '',
        detalhes_ocorrencia: '', testemunhas: '', variaveis_adicionais: {}
      });
      setHistoricoColab([]);
      fetchProcessos();
    } else {
      toast.error("Erro ao registrar: " + error.message);
    }
    setSaving(false);
  };

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
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1">Abertura Dinâmica de Processos Operacionais</p>
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
                <div className="absolute top-[100%] mt-2 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {colabsSugeridos.map(c => (
                    <div key={c.id} className="p-4 border-b border-gray-100 hover:bg-gray-100 cursor-pointer transition-all text-left" onClick={() => selecionarColab(c)}>
                      <div className="text-sm font-bold text-black">{c.nome}</div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{c.cargo || c.funcao} - {c.unidade_alocacao}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {form.colaborador_id && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Termômetro Inteligente Baseado na Categoria */}
                <div className={`p-6 rounded-2xl border ${padraoSugerido?.nivel_gravidade === 1 ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : padraoSugerido?.nivel_gravidade === 3 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Termômetro de Reincidência</span>
                  </div>
                  <p className="text-sm font-bold">
                    Ocorrências Anteriores na Categoria: {reincidencias}
                  </p>
                  <p className="text-xs mt-1 font-medium">
                    {padraoSugerido ? `Punição Determinada pelo Sistema: Nível ${padraoSugerido.nivel_gravidade} (${padraoSugerido.nivel_gravidade === 3 ? 'Suspensão' : 'Advertência'})` : 'Buscando regras...'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Categoria</label>
                    <select 
                      className="input-field !h-12 w-full text-sm font-bold" 
                      value={form.categoria_motivo} 
                      onChange={e => setForm({...form, categoria_motivo: e.target.value})}
                    >
                      {categoriasUnicas.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Data da Ocorrência</label>
                    <input type="date" className="input-field w-full font-black" value={form.data_ocorrencia} onChange={e => setForm({...form, data_ocorrencia: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Motivo Específico</label>
                  <select 
                    className="input-field !h-12 w-full text-sm font-bold" 
                    value={form.descricao_motivo} 
                    onChange={e => setForm({...form, descricao_motivo: e.target.value})}
                  >
                    {motivosDaCategoria.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
                  </select>
                </div>

                {customTags.length > 0 && (
                  <div className="p-4 bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-[var(--brand)] tracking-widest">Informações Específicas Necessárias</h4>
                    {customTags.map((tag: any) => (
                      <div key={tag}>
                        <label className="text-[9px] font-black uppercase text-[var(--text-muted)] mb-1 block">[{tag}]</label>
                        <input 
                          className="input-field w-full font-bold text-sm" 
                          placeholder={`Informe o valor para ${tag}...`}
                          value={form.variaveis_adicionais[tag] || ''}
                          onChange={e => setForm({...form, variaveis_adicionais: { ...form.variaveis_adicionais, [tag]: e.target.value }})}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Relato do Encarregado (Sua Narrativa)</label>
                  <textarea className="input-field w-full h-32 p-4 font-medium" placeholder="Descreva exatamente como o fato ocorreu..." value={form.detalhes_ocorrencia} onChange={e => setForm({...form, detalhes_ocorrencia: e.target.value})} />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)] mb-2 block">Testemunhas (Opcional)</label>
                  <input className="input-field w-full font-black" placeholder="Nomes..." value={form.testemunhas} onChange={e => setForm({...form, testemunhas: e.target.value})} />
                </div>

                <button 
                  onClick={handleSubmit} disabled={saving}
                  className="w-full h-14 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg"
                >
                  {saving ? 'Gerando Documento...' : 'Gerar e Enviar para Avaliação'}
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
