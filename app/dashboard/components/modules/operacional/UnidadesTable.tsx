"use client";
import { Building2, MapPin, Users, ArrowRight } from "lucide-react";

export default function UnidadesTable({ unidades, busca }: { unidades: any[], busca: string }) {
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
            <th className="p-8 text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Cliente</th>
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
                      <MapPin size={10} /> Localização Centralizada
                    </div>
                  </div>
                </div>
              </td>
              <td className="p-8">
                <div className="text-xs font-black text-[var(--text-muted)] uppercase">{u.cliente || "Alicerce Cliente"}</div>
              </td>
              <td className="p-8 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-black">
                  <Users size={14} className="text-[var(--text-muted)]" /> 12
                </div>
              </td>
              <td className="p-8 text-center">
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest">Ativo</span>
              </td>
              <td className="p-8 text-right">
                <button className="p-3 bg-[var(--bg-base)] text-[var(--text-muted)] rounded-xl border border-[var(--border)] hover:text-[var(--brand)] hover:border-[var(--brand)] transition-all">
                  <ArrowRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
