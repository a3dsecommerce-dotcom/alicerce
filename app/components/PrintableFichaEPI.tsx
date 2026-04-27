"use client";
import React from 'react';

interface FichaEPIProps {
  colaborador: {
    nome: string;
    cpf: string;
    cargo: string;
    unidade: string;
  };
  itens: Array<{
    data: string;
    ca: string;
    descricao: string;
    qtd: number;
  }>;
}

export default function PrintableFichaEPI({ colaborador, itens }: FichaEPIProps) {
  return (
    <div className="print-only hidden p-8 bg-white text-black font-serif">
      <div className="document-header">
        <div className="flex items-center gap-4">
           <img src="/logo.png" alt="Logo" className="w-24 h-auto" />
           <div>
             <h1 className="document-title">Ficha de Entrega de EPI</h1>
             <p className="text-[10px] font-bold">ALICERCE CONSTRUTORA E SERVIÇOS LTDA</p>
           </div>
        </div>
        <div className="text-right text-[10px]">
          <p>Via do Empregador</p>
          <p>Data de Emissão: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 border p-4 rounded">
        <div>
          <p className="text-[9px] uppercase font-bold text-gray-600">Colaborador</p>
          <p className="font-bold">{colaborador.nome}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-gray-600">CPF</p>
          <p className="font-bold">{colaborador.cpf}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-gray-600">Cargo</p>
          <p className="font-bold">{colaborador.cargo}</p>
        </div>
        <div>
          <p className="text-[9px] uppercase font-bold text-gray-600">Unidade/Posto</p>
          <p className="font-bold">{colaborador.unidade}</p>
        </div>
      </div>

      <div className="mb-8 text-[9px] leading-relaxed italic border-b pb-4">
        <p>Declaro para os devidos fins que recebi da empresa ALICERCE CONSTRUTORA E SERVIÇOS LTDA, os Equipamentos de Proteção Individual (EPIs) abaixo relacionados, novos e em perfeitas condições de uso, comprometendo-me a utilizá-los adequadamente durante o exercício de minhas funções, zelando pela sua guarda e conservação, bem como solicitando a substituição quando os mesmos tornarem-se impróprios para o uso.</p>
      </div>

      <table className="mb-12">
        <thead>
          <tr>
            <th>Data</th>
            <th>C.A (Certificado de Aprovação)</th>
            <th>Descrição do Equipamento</th>
            <th>Qtd</th>
            <th>Assinatura do Recebedor</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, i) => (
            <tr key={i}>
              <td>{item.data}</td>
              <td>{item.ca}</td>
              <td>{item.descricao}</td>
              <td>{item.qtd}</td>
              <td className="w-48"></td>
            </tr>
          ))}
          {[...Array(5 - itens.length)].map((_, i) => (
             <tr key={i + 100}>
              <td className="h-8"></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-20 px-10">
        <div className="flex flex-col items-center">
          <div className="signature-line"></div>
          <p className="font-bold">{colaborador.nome}</p>
          <p className="text-[8px]">Assinatura do Colaborador</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="signature-line"></div>
          <p className="font-bold">Representante da Empresa</p>
          <p className="text-[8px]">Responsável pela Entrega</p>
        </div>
      </div>

      <div className="mt-12 text-[7px] text-gray-400 text-center">
        Este documento é gerado eletronicamente pelo Sistema Alicerce ERP V750.1 - Trilha Forense Ativa.
      </div>
    </div>
  );
}
