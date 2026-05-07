import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Users, Calculator, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import TableSkeleton from "@/components/ui/TableSkeleton";

export default function CotasManager() {
  const [cotas, setCotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCotas();
  }, []);

  const fetchCotas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('config_cotas_secretaria').select('*').order('secretaria');
      if (error) {
        // Fallback: se a tabela não existir, criar em memória para o usuário rodar o SQL depois
        toast.error("Tabela de cotas não encontrada. Por favor, execute o SQL de criação.");
        setCotas([
          { secretaria: "SEMED", modo_calculo: "MANUAL", qtd_asg_manual: 100 },
          { secretaria: "SEMSA", modo_calculo: "MANUAL", qtd_asg_manual: 50 },
          { secretaria: "SEMAD", modo_calculo: "MANUAL", qtd_asg_manual: 20 },
          { secretaria: "SEMAG", modo_calculo: "MANUAL", qtd_asg_manual: 10 }
        ]);
      } else {
        setCotas(data || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateCota = (index: number, field: string, value: any) => {
    const newCotas = [...cotas];
    newCotas[index][field] = value;
    setCotas(newCotas);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('config_cotas_secretaria').upsert(
        cotas.map(c => ({
          secretaria: c.secretaria,
          modo_calculo: c.modo_calculo,
          qtd_asg_manual: parseInt(c.qtd_asg_manual) || 0,
          updated_at: new Date().toISOString()
        }))
      );
      if (error) throw error;
      toast.success("Cotas atualizadas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar cotas: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton rows={5} cols={3} />;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Calculator size={28} /> Gestão de Cotas (Base de ASGs)
            </h2>
            <p className="opacity-90 mt-2 max-w-2xl text-[13px] font-medium leading-relaxed">
              Controle se o limite de suprimentos dos Compradores será calculado usando o Banco de Dados (Automático) ou se você definirá uma cota de ASGs fixa (Manual) por Secretaria.
            </p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-black/10 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
        <Settings className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12" size={200} />
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[2rem] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-header">Secretaria</th>
                <th className="table-header">Modo de Cálculo</th>
                <th className="table-header">Qtd. ASGs (Cálculo Manual)</th>
                <th className="table-header w-10">Status</th>
              </tr>
            </thead>
            <tbody>
              {cotas.map((cota, idx) => (
                <tr key={cota.secretaria} className="table-row hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">
                        <Users size={16} />
                      </div>
                      <span className="font-black text-[var(--text-primary)] text-sm">{cota.secretaria}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <select
                      className="input-field !h-10 !text-xs font-bold w-48"
                      value={cota.modo_calculo}
                      onChange={(e) => updateCota(idx, 'modo_calculo', e.target.value)}
                    >
                      <option value="AUTOMATICO">Automático (Banco)</option>
                      <option value="MANUAL">Manual (Fixo)</option>
                    </select>
                  </td>
                  <td className="table-cell">
                    <input
                      type="number"
                      className={`input-field !h-10 !text-sm font-black w-32 ${cota.modo_calculo === 'AUTOMATICO' ? 'opacity-30 cursor-not-allowed' : 'border-[var(--brand)]'}`}
                      value={cota.qtd_asg_manual}
                      disabled={cota.modo_calculo === 'AUTOMATICO'}
                      onChange={(e) => updateCota(idx, 'qtd_asg_manual', e.target.value)}
                    />
                  </td>
                  <td className="table-cell">
                    {cota.modo_calculo === 'MANUAL' ? (
                      <span className="badge badge-amber uppercase text-[9px]"><ShieldCheck size={10}/> Manual</span>
                    ) : (
                      <span className="badge badge-green uppercase text-[9px]"><RefreshCw size={10}/> Auto</span>
                    )}
                  </td>
                </tr>
              ))}
              {cotas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-muted)] text-xs font-medium">
                    Nenhuma secretaria configurada. Verifique o banco de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
