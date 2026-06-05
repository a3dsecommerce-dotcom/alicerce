"use client";
import { useState, useEffect } from "react";
import { FileText, Printer, Shield, User, Package, MapPin, Activity, Clock, Search, Filter, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PrintableFichaEPI from "../../components/PrintableFichaEPI";

export default function RelatoriosPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [targetData, setTargetData] = useState<any>(null);

  // Mock data para demonstração
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("crm_user");
    if (saved) setUser(JSON.parse(saved));

    async function loadData() {
      const { data: cols } = await supabase.from('usuarios').select('*').limit(20);
      const { data: units } = await supabase.from('unidades').select('*');
      if (cols) setColaboradores(cols);
      if (units) setUnidades(units);
      setLoading(false);
    }
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Carregando Oráculo de Documentação...</div>;

  const canSee = (roles: string[]) => roles.includes(user?.role) || user?.nivel === 4;

  const reports = [
    {
      id: "ficha-epi",
      title: "Ficha de Entrega de EPI",
      description: "Documento legal de recebimento de equipamentos de segurança.",
      icon: Shield,
      allowed: canSee(["ADMIN", "DIRETORIA", "RH_PESSOAL", "ALMOXARIFADO", "ENCARREGADO"]),
      action: (colab: any) => {
        setTargetData({
          colaborador: {
            nome: colab.nome,
            cpf: colab.cpf || "000.000.000-00",
            cargo: colab.cargo || "ASG",
            unidade: colab.unidade_alocacao || "Geral"
          },
          itens: [
            { data: new Date().toLocaleDateString(), ca: "12345", descricao: "Bota de Segurança Branca", qtd: 1 },
            { data: new Date().toLocaleDateString(), ca: "67890", descricao: "Luva de Proteção Quimica", qtd: 2 }
          ]
        });
        setSelectedDoc("ficha-epi");
      }
    },
    {
      id: "log-auditoria",
      title: "Log de Auditoria Soberana",
      description: "Relatório de todas as ações executadas no sistema por período.",
      icon: Activity,
      allowed: canSee(["ADMIN", "DIRETORIA", "AUDITORIA", "ALMOXARIFADO"]),
      action: () => setSelectedDoc("log-auditoria")
    },
    {
      id: "rota-responsavel",
      title: "Mapa de Rota Operacional",
      description: "Lista de unidades e colaboradores sob responsabilidade do encarregado.",
      icon: MapPin,
      allowed: canSee(["ADMIN", "DIRETORIA", "ENCARREGADO", "GERENCIA"]),
      action: () => setSelectedDoc("rota-responsavel")
    },
    {
      id: "requisicao-entrega",
      title: "Requisição vs Entrega",
      description: "Relatório de conferência de pedidos do almoxarifado.",
      icon: Package,
      allowed: canSee(["ADMIN", "DIRETORIA", "ALMOXARIFADO", "COMPRADOR"]),
      action: () => setSelectedDoc("requisicao-entrega")
    }
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in no-print">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-8 rounded-[2rem] border border-[var(--border)] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand)]/5 rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none"></div>
        
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <FileText className="text-[var(--brand)]" /> Central de Documentação e Fé Pública
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Gere e imprima planilhas, fichas e relatórios oficiais baseados em seu nível de acesso.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.filter(r => r.allowed).map(report => (
          <div key={report.id} className="card p-6 group hover:border-[var(--brand)] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-base)] flex items-center justify-center text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-all">
                <report.icon size={24} />
              </div>
              <button className="btn-ghost !p-2" title="Informações do Relatório">
                <Shield size={14} className="text-green-500" />
              </button>
            </div>
            
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">{report.title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">{report.description}</p>
            
            <div className="flex flex-col gap-3">
               {report.id === "ficha-epi" ? (
                 <div className="flex flex-col gap-2">
                   <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Selecionar Colaborador</label>
                   <select className="input-field !h-10 text-xs" onChange={(e) => {
                     const c = colaboradores.find(x => x.id === e.target.value);
                     if (c) report.action(c);
                   }}>
                     <option value="">Selecione...</option>
                     {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </select>
                 </div>
               ) : (
                 <button className="btn-brand w-full" onClick={() => report.action(null)}>
                   <Printer size={16} /> Preparar para Impressão
                 </button>
               )}
            </div>
          </div>
        ))}
      </div>

      {/* Visualização de Impressão (Apenas via comando browser ou print) */}
      {selectedDoc === "ficha-epi" && targetData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10 no-print">
           <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-auto relative">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                 <h2 className="text-xl font-black text-black">Prévia do Documento</h2>
                 <div className="flex gap-4">
                    <button className="btn-ghost" onClick={() => setSelectedDoc(null)}>Fechar</button>
                    <button className="btn-brand" onClick={handlePrint}>
                       <Printer size={18} /> Imprimir Agora (A4)
                    </button>
                 </div>
              </div>
              
              {/* O componente de impressão real é injetado aqui e escondido via CSS no navegador normal */}
              <div className="border p-10 bg-gray-50 rounded-xl overflow-hidden pointer-events-none">
                 <div className="scale-[0.8] origin-top">
                    <PrintableFichaEPI colaborador={targetData.colaborador} itens={targetData.itens} />
                    {/* Hack para mostrar na prévia já que PrintableFichaEPI tem print-only */}
                    <div className="bg-white text-black font-serif p-8">
                       <h2 className="text-2xl font-bold uppercase mb-4 text-center">FICHA DE EPI (PRÉVIA)</h2>
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <p><strong>NOME:</strong> {targetData.colaborador.nome}</p>
                          <p><strong>CPF:</strong> {targetData.colaborador.cpf}</p>
                          <p><strong>CARGO:</strong> {targetData.colaborador.cargo}</p>
                          <p><strong>UNIDADE:</strong> {targetData.colaborador.unidade}</p>
                       </div>
                       <table className="w-full border">
                          <thead>
                            <tr className="bg-gray-100"><th className="border p-2">ITEM</th><th className="border p-2">CA</th><th className="border p-2">QTD</th></tr>
                          </thead>
                          <tbody>
                            {targetData.itens.map((it:any, i:number) => (
                              <tr key={i}><td className="border p-2">{it.descricao}</td><td className="border p-2">{it.ca}</td><td className="border p-2">{it.qtd}</td></tr>
                            ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Este é o componente que REALMENTE será impresso quando window.print() for chamado */}
           <PrintableFichaEPI colaborador={targetData.colaborador} itens={targetData.itens} />
        </div>
      )}

      {/* Outros Relatórios (Simulados) */}
      {selectedDoc && selectedDoc !== "ficha-epi" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10 no-print">
           <div className="bg-white rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-auto text-black">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">{reports.find(r => r.id === selectedDoc)?.title}</h2>
                <div className="flex gap-4">
                    <button className="btn-ghost" onClick={() => setSelectedDoc(null)}>Voltar</button>
                    <button className="btn-brand" onClick={handlePrint}><Printer size={18} /> Imprimir Relatório</button>
                </div>
              </div>

              <div className="p-8 border-2 border-black">
                <div className="flex justify-between mb-8 border-b-2 border-black pb-4">
                  <div>
                    <h3 className="font-bold text-xl uppercase">Alicerce Construtora e Serviços</h3>
                    <p className="text-xs">Intelligence Operations Center - Relatório de {selectedDoc.toUpperCase()}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>Página: 1/1</p>
                    <p>Emissão: {new Date().toLocaleString()}</p>
                    <p>Operador: {user?.name}</p>
                  </div>
                </div>

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left">Referência</th>
                      <th className="border p-2 text-left">Descrição do Evento / Item</th>
                      <th className="border p-2 text-left">Responsável</th>
                      <th className="border p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(15)].map((_, i) => (
                      <tr key={i}>
                        <td className="border p-2 font-mono text-[10px]">#882{i}</td>
                        <td className="border p-2 text-[11px]">Movimentação de material estratégica conforme requisição setorial.</td>
                        <td className="border p-2 text-[11px]">Setor {user?.role}</td>
                        <td className="border p-2 text-[11px] font-bold">PROCESSADO</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-12 flex justify-center">
                  <div className="w-64 border-t border-black text-center pt-2 text-[10px] uppercase font-bold">
                    Carimbo de Autenticidade Digital
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
