"use client";
import { useState } from "react";
import { 
  Shield, Settings, Database, Loader, MapPin, Plus, Building2, User, Phone, Map, Users, Search, Truck,
  LayoutDashboard, ClipboardList, ShieldAlert, Trophy, Target
} from "lucide-react";
import MissoesManager from "./gerencia/MissoesManager";

export default function GerenciaModule({ user, initialTab }: { user: any, initialTab?: string }) {
  // MODO DE SEGURANÇA: APENAS MISSÕES PARA DIAGNÓSTICO
  const [activeTab, setActiveTab] = useState("MISSOES");
  
  return (
    <div className="flex flex-col gap-10 animate-fade-in h-full px-4 lg:px-20 py-10">
      {/* Banner de Diagnóstico */}
      <div className="bg-green-600 text-white p-4 text-[10px] font-black uppercase text-center rounded-2xl shadow-xl animate-pulse">
        SISTEMA DE MISSÕES ATIVO - MODO DE SEGURANÇA (V500.52)
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] italic leading-tight tracking-tighter text-shadow-sm">Painel de Controle Central</h2>
          <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Shield size={16} className="text-green-500" /> Operações Alicerce Ops
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-10 overflow-hidden">
        <MissoesManager />
      </div>
    </div>
  );
}
