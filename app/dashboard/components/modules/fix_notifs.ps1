$path = "c:\gravidade\alicerce-crm\app\dashboard\components\modules\OcorrenciasModule.tsx"
$content = Get-Content $path -Encoding UTF8

# Substituir handleNovaOcorrencia (linha 105 aprox)
$content[104] = '    else { supabase.from("notificacoes").insert([{ setor_destino: formData.setor_destino, titulo: "Nova Ocorrência", mensagem: "Demanda: " + formData.assunto, link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }'

# Substituir handleMarcarRecebido (linha 120 aprox)
$content[119] = '    else { supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "Ocorrência Recebida", mensagem: "Sua demanda foi recebida.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }'

# Substituir handleResolverOcorrencia (linha 140 aprox)
$content[139] = '    else { supabase.from("notificacoes").insert([{ user_id: selectedTicket.representante_id, titulo: "Ocorrência Resolvida", mensagem: "Sua demanda foi resolvida.", link: "/dashboard?module=OCORRENCIAS" }]).then(() => {}); setModalAberto(null); fetchTickets(); }'

$content | Set-Content $path -Encoding UTF8
