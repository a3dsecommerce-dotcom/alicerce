"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface UserSearchInputProps {
  label: string;
  placeholder?: string;
  valueName: string;
  className?: string;
  onSelect: (user: { id: string, nome: string }) => void;
}

export default function UserSearchInput({ label, placeholder, valueName, className, onSelect }: UserSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState(valueName);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sincronizar termo se o value externo mudar (ex: reset do form)
  useEffect(() => {
    setSearchTerm(valueName);
  }, [valueName]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSugestoes([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (termo: string) => {
    setSearchTerm(termo);
    
    // Resetar o ID parente se começar a digitar, mas não forçar aqui
    // a não ser que seja requerido. Melhor deixar o parente limpar via onChange se precisasse.
    // Mas UserSearchInput foi feito para onSelect.
    
    if (termo.length < 3) {
      setSugestoes([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .ilike('nome', `%${termo}%`)
      .limit(10);
      
    if (data) {
      setSugestoes(data);
    }
    setLoading(false);
  };

  const handleSelect = (user: any) => {
    setSearchTerm(user.nome);
    setSugestoes([]);
    onSelect({ id: user.id, nome: user.nome });
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <label className="text-[10px] font-black uppercase mb-3 block italic opacity-80">{label}</label>
      <input 
        type="text"
        className="input-field w-full !h-14 font-black bg-white"
        placeholder={placeholder || "Digite o nome..."}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading && <div className="absolute right-4 top-12 text-[10px] text-[var(--text-muted)] animate-pulse font-bold">Buscando...</div>}
      
      {sugestoes.length > 0 && (
        <div className="absolute top-[100%] mt-2 left-0 w-full bg-white border border-[var(--border)] rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {sugestoes.map(c => (
            <div 
              key={c.id} 
              className="p-4 border-b border-[var(--border)] hover:bg-[var(--brand)] hover:text-white cursor-pointer transition-all" 
              onClick={() => handleSelect(c)}
            >
              <div className="text-xs font-black">{c.nome}</div>
              <div className="text-[10px] uppercase opacity-80">{c.cargo || c.funcao} - {c.unidade_alocacao}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
