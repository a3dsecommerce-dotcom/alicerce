import re

file_path = r'c:\gravidade\alicerce-crm\app\dashboard\components\modules\RHModule.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Match the end of any block followed by ) : (
pattern = r'(\s+</div>\s+)\) : \(\s+(<div className="flex flex-col items-center justify-center p-20 opacity-50">)'

replacement = r'''\1) : dpAba === "contratacao" ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                          {candidatos.filter(c => c.status_candidato === 'CONTRATADO').map(can => (
                             <div key={can.id} className="bg-green-50/30 p-6 rounded-3xl border border-green-100 hover:border-green-200 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-green-600 font-black shadow-sm"><CheckCircle size={24}/></div>
                                   <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-green-100 text-green-600">CONTRATADO</span>
                                </div>
                                <h4 className="text-sm font-black text-[var(--text-primary)] mb-1">{can.nome}</h4>
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-4">Processo de Admissão Finalizado</p>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-bold"><Calendar size={12}/> Candidato movido para a base de ativos.</div>
                             </div>
                          ))}
                          {candidatos.filter(c => c.status_candidato === 'CONTRATADO').length === 0 && (
                             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300">
                                <UserPlus size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Nenhuma admissão recente</p>
                             </div>
                          )}
                       </div>
                    ) : \2'''

if re.search(pattern, content):
    new_content = re.sub(pattern, replacement, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    print("Pattern not found")
