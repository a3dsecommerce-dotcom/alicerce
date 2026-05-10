"use client";
import React, { useState, useEffect } from "react";
import { Search, UserSecret, X, UserCheck, Shield, ChevronRight, LogOut, ArrowRightLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface DevImpersonatorProps {
  originalUser: any;
  onImpersonate: (user: any) => void;
  onStop: () => void;
}

export default function DevImpersonator({ originalUser, onImpersonate, onStop }: DevImpersonatorProps) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  useEffect(() => {
    const impersonated = localStorage.getItem("impersonated_user");
    if (impersonated) {
      setIsImpersonating(true);
      setActiveUser(JSON.parse(impersonated));
    }
  }, []);

  const handleSearch = async (val: string) => {
    setBusca(val);
    if (val.length > 2) {
      const { data } = await supabase
        .from("usuarios")
        .select("*")
        .or(`nome.ilike.%${val}%,telefone.ilike.%${val}%,email.ilike.%${val}%`)
        .limit(6);
      setResultados(data || []);
    } else {
      setResultados([]);
    }
  };

  const startImpersonation = (user: any) => {
    localStorage.setItem("impersonated_user", JSON.stringify(user));
    localStorage.setItem("original_dev_user", JSON.stringify(originalUser));
    setIsImpersonating(true);
    setActiveUser(user);
    setIsOpen(false);
    onImpersonate(user);
    toast.success(`Modo Simulação: Logado como ${user.nome}`);
    window.location.reload(); // Recarrega para aplicar permissões
  };

  const stopImpersonation = () => {
    localStorage.removeItem("impersonated_user");
    const dev = localStorage.getItem("original_dev_user");
    if (dev) {
      const devObj = JSON.parse(dev);
      localStorage.setItem("crm_user", JSON.stringify(devObj));
    }
    setIsImpersonating(false);
    setActiveUser(null);
    onStop();
    toast.info("Voltou para a conta de Desenvolvedor");
    window.location.reload();
  };

  if (!originalUser || originalUser.nivel_acesso < 4) return null;

  return (
    <>
      {/* Botão de Atalho flutuante para o Dev */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-3">
        {isImpersonating && (
          <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce border-2 border-white/20">
            <Shield size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Simulando: {activeUser?.nome}</span>
            <button onClick={stopImpersonation} className="p-1 hover:bg-white/20 rounded-lg transition-all">
              <X size={16} />
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setIsOpen(true)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 border-4 ${isImpersonating ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-indigo-400'}`}
        >
          {isImpersonating ? <ArrowRightLeft size={28} /> : <Shield size={28} />}
        </button>
      </div>

      {/* Modal de Impersonation */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 animate-scale-up">
            <div className="bg-gradient-to-br from-slate-900 to-black p-10 text-white relative">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Shield size={120} />
               </div>
               <div className="flex justify-between items-start relative z-10">
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter">Modo Desenvolvedor</h2>
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mt-2">Simulação de Acesso e Permissões</p>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                    <X size={20} />
                  </button>
               </div>
            </div>

            <div className="p-10 space-y-8">
               <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-2">
                    <Search size={14} className="text-indigo-600" /> Buscar Usuário para Simular
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-black text-slate-900 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      placeholder="NOME, TELEFONE OU EMAIL..."
                      value={busca}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
               </div>

               <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {resultados.map(res => (
                    <button 
                      key={res.id} 
                      onClick={() => startImpersonation(res)}
                      className="w-full p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             {res.nome?.charAt(0)}
                          </div>
                          <div className="text-left">
                             <p className="text-[12px] font-black uppercase text-slate-900">{res.nome}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{res.cargo || 'COLABORADOR'} • NÍVEL {res.nivel_acesso}</p>
                          </div>
                       </div>
                       <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                    </button>
                  ))}

                  {busca.length > 2 && resultados.length === 0 && (
                    <div className="py-10 text-center opacity-30">
                       <p className="text-[10px] font-black uppercase tracking-widest">Nenhum usuário encontrado.</p>
                    </div>
                  )}

                  {!busca && (
                    <div className="py-10 text-center opacity-30 border-2 border-dashed border-slate-200 rounded-2xl">
                       <p className="text-[10px] font-black uppercase tracking-widest">Digite para buscar...</p>
                    </div>
                  )}
               </div>

               {isImpersonating && (
                 <button 
                  onClick={stopImpersonation}
                  className="w-full h-16 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                 >
                    <LogOut size={16} /> Encerrar Simulação e Voltar para minha conta
                 </button>
               )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
