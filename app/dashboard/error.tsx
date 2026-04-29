'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center text-red-600 mb-6 shadow-lg shadow-red-200">
        <AlertTriangle size={40} />
      </div>
      
      <h2 className="text-2xl font-black text-slate-900 mb-2">Ops! Algo deu errado no Dashboard</h2>
      <p className="text-slate-500 max-w-md mb-8 font-medium">
        Houve um erro inesperado ao carregar esta parte do portal. 
        Pode ser um problema temporário de conexão ou um erro no banco de dados.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn-brand flex items-center gap-2 h-12 px-8"
        >
          <RefreshCcw size={18} /> Tentar Novamente
        </button>
        
        <Link 
          href="/"
          className="btn-ghost flex items-center gap-2 h-12 px-8 border border-slate-200"
        >
          <Home size={18} /> Voltar ao Início
        </Link>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-slate-100 rounded-xl text-left max-w-2xl overflow-auto border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Detalhes do Erro (Apenas Dev):</p>
          <code className="text-xs text-red-600">{error.message}</code>
          {error.stack && (
            <pre className="mt-4 text-[10px] text-slate-500 font-mono leading-tight">
              {error.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
