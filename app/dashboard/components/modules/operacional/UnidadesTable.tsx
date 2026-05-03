import { Building2, MapPin, Users, Edit2, Trash2 } from "lucide-react";

interface UnidadesTableProps {
  unidades: any[];
  busca: string;
  onEdit?: (u: any) => void;
  onDelete?: (id: string | number) => void;
}

export default function UnidadesTable({ unidades, busca, onEdit, onDelete }: UnidadesTableProps) {
  const filtradas = unidades.filter(u => 
    u.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    u.cliente?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[var(--bg-base)]/40 border-b border-[var(--border)]">
          <tr>
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Unidade / Posto</th>
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Secretaria / Cliente</th>
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Efetivo</th>
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-center">Status</th>
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filtradas.map((u, i) => (
            <tr key={u.id || i} className="hover:bg-[var(--bg-base)]/30 transition-all group">
              <td className="p-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center text-[var(--brand)] group-hover:scale-110 transition-transform">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[var(--text-primary)]">{u.nome}</div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1">
                      <MapPin size={10} /> {u.bairro || 'Localização Centralizada'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-8">
                <div className="text-xs font-black text-[var(--text-muted)] uppercase">{u.secretaria || u.cliente || "Alicerce Cliente"}</div>
              </td>
              <td className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-black">
                  <Users size={14} className="text-[var(--text-muted)]" /> --
                </div>
              </td>
              <td className="p-8 text-center">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.status === 'INATIVO' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                  {u.status || 'Ativo'}
                </span>
              </td>
              <td className="p-8 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEdit?.(u)}
                    className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-blue-600 hover:border-blue-600 transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete?.(u.id)}
                    className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-red-600 hover:border-red-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
