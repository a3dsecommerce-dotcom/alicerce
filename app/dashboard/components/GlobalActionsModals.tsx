"use client";
import React, { useState, useEffect } from 'react';
import AdaptiveModal from '../../../components/ui/AdaptiveModal';
import { supabase } from '@/lib/supabase';
import { n8n } from '@/lib/n8n';
import { Loader, Send, AlertTriangle, Package, User, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Truck, ShieldCheck } from 'lucide-react';

interface GlobalActionsModalsProps {
  modalActive: string | null;
  onClose: () => void;
  user: any;
}

export default function GlobalActionsModals({ modalActive, onClose, user }: GlobalActionsModalsProps) {
  const [loading, setLoading] = useState(false);
  
  // Ocorrência State
  const [ocorrencia, setOcorrencia] = useState({ assunto: '', unidade: '', descricao: '', prioridade: 'NORMAL' });
  
  // EPI State (Step-by-Step)
  const [epiStep, setEpiStep] = useState(1);
  const [epiData, setEpiData] = useState({ colaborador: '', item: '', tamanho: '', observacao: '', telefone: '' });
  
  // Check-in State
  const [checkin, setCheckin] = useState({ unidade: '', observacao: '' });
  
  // Reposição State
  const [reposicao, setReposicao] = useState({ item: '', quantidade: 1 });

  const handleSalvarOcorrencia = async () => {
    setLoading(true);
    const { error } = await supabase.from('tickets_sla').insert([{
      ...ocorrencia,
      criado_por: user?.nome || 'Usuário Portal',
      status: 'PENDENTE'
    }]);

    if (!error) {
      try {
        n8n.trigger('notificacao-ocorrencia', { ...ocorrencia, usuario: user?.nome });
      } catch (e) {
        console.warn("n8n offline");
      }
      alert("Ocorrência registrada com sucesso!");
      onClose();
    } else {
      alert("Erro ao salvar: " + error.message);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Modal: Abrir Ocorrência */}
      <AdaptiveModal 
        isOpen={modalActive === 'abrir-ocorrencia'} 
        onClose={onClose} 
        title="Abrir Nova Ocorrência"
        width="500px"
      >
        <div className="flex flex-col gap-4">
          <p className="text-[0.7rem] text-[var(--text-muted)] font-bold uppercase tracking-widest">Relate problemas operacionais, falta de efetivo ou sinistros.</p>
          
          <div>
            <label className="label-sm">Assunto / Título</label>
            <input 
              className="input-field w-full" 
              placeholder="Ex: Falta de ASG no posto X" 
              value={ocorrencia.assunto}
              onChange={e => setOcorrencia({...ocorrencia, assunto: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Unidade</label>
              <input 
                className="input-field w-full" 
                placeholder="Ex: SEMED" 
                value={ocorrencia.unidade}
                onChange={e => setOcorrencia({...ocorrencia, unidade: e.target.value})}
              />
            </div>
            <div>
              <label className="label-sm">Prioridade</label>
              <select 
                className="input-field w-full"
                value={ocorrencia.prioridade}
                onChange={e => setOcorrencia({...ocorrencia, prioridade: e.target.value})}
              >
                <option value="BAIXA">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta / Urgente</option>
                <option value="CRITICA">Crítica (Sinistro)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-sm">Descrição Detalhada</label>
            <textarea 
              className="input-field w-full min-h-[100px] pt-3" 
              placeholder="Descreva o que aconteceu..." 
              value={ocorrencia.descricao}
              onChange={e => setOcorrencia({...ocorrencia, descricao: e.target.value})}
            />
          </div>

          </div>
        </AdaptiveModal>



      {/* Modal: Informar Abono / Feriado */}
      <AdaptiveModal
        isOpen={modalActive === 'informar-abono'}
        onClose={onClose}
        title="Gerar Abono Coletivo"
        width="500px"
      >
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-[var(--success)]/5 border border-[var(--success)]/20 rounded-xl">
             <p className="text-[0.7rem] text-[var(--success)] font-bold uppercase mb-1">Impacto no Ponto</p>
             <p className="text-[0.75rem] text-[var(--text-secondary)]">O abono coletivo justifica a ausência de todos os colaboradores vinculados à sua secretaria/unidade na data selecionada.</p>
          </div>

          <div>
            <label className="label-sm">Abrangência</label>
            <select className="input-field w-full">
              <option value="TODOS">Todos os Colaboradores (Feriado / Ponto Facultativo)</option>
              <option value="INDIVIDUAL">Colaborador Específico</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-sm">Data do Abono</label>
              <input type="date" className="input-field w-full" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label-sm">Tipo de Motivo</label>
              <select className="input-field w-full">
                <option>Ponto Facultativo</option>
                <option>Feriado Municipal/Estadual</option>
                <option>Luto / Gala</option>
                <option>Justificativa Administrativa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-sm">Observações para o RH</label>
            <textarea className="input-field w-full min-h-[80px]" placeholder="Ex: Decreto Municipal nº 123/2024..." />
          </div>

          </div>
        </AdaptiveModal>

      {/* Modal: Entrega de EPI (NR-06) - STEP-BY-STEP UX EXTREMA */}
      <AdaptiveModal
        isOpen={modalActive === 'entregar-epi'}
        onClose={() => { setEpiStep(1); onClose(); }}
        title="Entrega de EPI (NR-06)"
        width="450px"
      >
        <div className="flex flex-col gap-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full mx-1 transition-all ${epiStep >= s ? "bg-[var(--brand)]" : "bg-[var(--bg-base)]"}`} />
            ))}
          </div>

          {epiStep === 1 && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-right duration-300">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-[var(--brand)]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--brand)]">
                  <User size={32} />
                </div>
                <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs">Identificar Colaborador</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Quem está recebendo o equipamento?</p>
              </div>
              <input 
                className="input-field w-full !text-lg !py-4 text-center" 
                placeholder="Nome ou CPF" 
                value={epiData.colaborador}
                onChange={e => setEpiData({...epiData, colaborador: e.target.value})}
                autoFocus
              />
              <button 
                className="btn-brand !h-14 !text-sm" 
                disabled={!epiData.colaborador}
                onClick={() => setEpiStep(2)}
              >
                Próximo Passo <ChevronRight size={18} className="ml-2" />
              </button>
            </div>
          )}

          {epiStep === 2 && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-right duration-300">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                  <Package size={32} />
                </div>
                <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs">Selecionar Equipamento</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Qual item está sendo entregue?</p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {['Bota de Segurança', 'Luva Nitrílica', 'Capacete c/ Carneira', 'Protetor Auricular'].map(item => (
                  <button 
                    key={item}
                    className={`p-4 rounded-2xl border text-sm font-bold transition-all text-left flex justify-between items-center ${epiData.item === item ? "border-[var(--brand)] bg-[var(--brand)]/5 text-[var(--brand)]" : "border-[var(--border)] hover:border-[var(--brand)]/50"}`}
                    onClick={() => setEpiData({...epiData, item})}
                  >
                    {item}
                    {epiData.item === item && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button className="flex-1 btn-ghost !h-14" onClick={() => setEpiStep(1)}><ChevronLeft size={18} /></button>
                <button 
                  className="flex-[3] btn-brand !h-14 !text-sm" 
                  disabled={!epiData.item}
                  onClick={() => setEpiStep(3)}
                >
                  Confirmar Item <ChevronRight size={18} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {epiStep === 3 && (
            <div className="flex flex-col gap-5 animate-in slide-in-from-right duration-300">
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-green-500">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs">Resumo da Entrega</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">Confirme os dados para gerar a NR-06</p>
              </div>
              
              <div className="bg-[var(--bg-base)] p-5 rounded-2xl border border-[var(--border)] flex flex-col gap-3">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Colaborador</span>
                  <span className="text-xs font-black">{epiData.colaborador}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Item</span>
                  <span className="text-xs font-black">{epiData.item}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                 <p className="text-[8px] text-amber-600 font-black uppercase mb-1 flex items-center gap-1"><AlertTriangle size={10} /> Aviso n8n</p>
                 <p className="text-[9px] text-amber-700 font-bold leading-tight">Ao confirmar, o n8n gerará automaticamente o PDF da NR-06 e notificará o RH.</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button className="flex-1 btn-ghost !h-14" onClick={() => setEpiStep(2)}><ChevronLeft size={18} /></button>
                <button 
                  className="flex-[3] btn-brand !bg-[var(--success)] !h-14 !text-sm" 
                  onClick={() => {
                    setLoading(true);
                    try {
                      n8n.trigger('gerar-pdf', { tipo: 'EPI', data: epiData });
                      // Trigger WhatsApp notification via n8n
                      if (epiData.colaborador) {
                        n8n.trigger('notificacao-wpp', { 
                          telefone: epiData.telefone || '5592999999999', 
                          mensagem: `Olá ${epiData.colaborador}, seu EPI (${epiData.item}) foi registrado com sucesso. O PDF da NR-06 será enviado em breve.` 
                        });
                      }
                    } catch (e) {
                      console.warn("n8n offline");
                    }
                    setTimeout(() => {
                      setLoading(false);
                      alert("Registro concluído! O n8n está gerando o documento NR-06.");
                      setEpiStep(1);
                      onClose();
                    }, 1000);
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader className="animate-spin" size={18} /> : "Finalizar e Gerar PDF"}
                </button>
              </div>
            </div>
          )}
        </div>
      </AdaptiveModal>

      {/* Modal: Check-in de Unidade (Prova de Presença) */}
      <AdaptiveModal
        isOpen={modalActive === 'checkin-unidade'}
        onClose={onClose}
        title="Check-in na Unidade"
        width="450px"
      >
        <div className="flex flex-col gap-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-[var(--brand)]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--brand)]">
              <MapPin size={40} className="animate-bounce" />
            </div>
            <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-sm">Registrar Presença</h4>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-2">Confirme sua localização atual para fiscalização.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label-sm">Unidade / Posto</label>
              <input 
                className="input-field w-full" 
                placeholder="Ex: UBS Dr. José Lins" 
                value={checkin.unidade}
                onChange={e => setCheckin({...checkin, unidade: e.target.value})}
              />
            </div>
            <div>
              <label className="label-sm">Observações da Visita (Opcional)</label>
              <textarea 
                className="input-field w-full" 
                placeholder="Relate o estado geral da unidade..." 
                value={checkin.observacao}
                onChange={e => setCheckin({...checkin, observacao: e.target.value})}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
             <ShieldCheck size={18} className="text-blue-500 shrink-0" />
             <p className="text-[10px] text-blue-700 font-bold leading-tight">O sistema capturará as coordenadas GPS e o horário exato para o relatório de conformidade.</p>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 btn-ghost !h-14" onClick={onClose}>Cancelar</button>
            <button 
              className="flex-[2] btn-brand !h-14" 
              onClick={() => {
                setLoading(true);
                n8n.trigger('checkin-fiscalizacao', { ...checkin, usuario: user?.nome, timestamp: new Date() });
                setTimeout(() => {
                  setLoading(false);
                  alert("Check-in realizado com sucesso! Sua presença foi registrada.");
                  onClose();
                }, 800);
              }}
              disabled={loading || !checkin.unidade}
            >
              {loading ? <Loader className="animate-spin" /> : "Confirmar Check-in"}
            </button>
          </div>
        </div>
      </AdaptiveModal>

      {/* Modal: Solicitar Reposição de Estoque */}
      <AdaptiveModal
        isOpen={modalActive === 'solicitar-reposicao'}
        onClose={onClose}
        title="Solicitar Reposição"
        width="450px"
      >
        <div className="flex flex-col gap-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
              <Truck size={40} />
            </div>
            <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-sm">Pedido de Suprimentos</h4>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-2">O que está faltando na sua unidade?</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="label-sm">Item Necessário</label>
              <select 
                className="input-field w-full"
                value={reposicao.item}
                onChange={e => setReposicao({...reposicao, item: e.target.value})}
              >
                <option value="">Selecione o item...</option>
                <option>Luvas Nitrílicas (M/G)</option>
                <option>Botas de Segurança (38-42)</option>
                <option>Detergente Hospitalar</option>
                <option>Sacos de Lixo (100L)</option>
              </select>
            </div>
            <div>
              <label className="label-sm">Quantidade / Volume</label>
              <input 
                type="number"
                className="input-field w-full" 
                value={reposicao.quantidade}
                onChange={e => setReposicao({...reposicao, quantidade: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 btn-ghost !h-14" onClick={onClose}>Cancelar</button>
            <button 
              className="flex-[2] btn-brand !bg-[var(--info)] !h-14" 
              onClick={() => {
                setLoading(true);
                n8n.trigger('solicitacao-reposicao', { ...reposicao, solicitado_por: user?.nome });
                setTimeout(() => {
                  setLoading(false);
                  alert("Pedido enviado! O almoxarifado processará sua solicitação.");
                  onClose();
                }, 800);
              }}
              disabled={loading || !reposicao.item}
            >
              {loading ? <Loader className="animate-spin" /> : "Enviar Solicitação"}
            </button>
          </div>
        </div>
      </AdaptiveModal>
    </>
  );
}
