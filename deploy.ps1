#!/usr/bin/env pwsh
# =============================================================================
# ALICERCE ERP - Script de Deploy Automático
# Uso: .\deploy.ps1 -mensagem "descricao da alteracao"
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$mensagem = "chore: atualizacao automatica do portal"
)

$ErrorActionPreference = "Stop"

# --- CONFIGURAÇÃO ---
# Cole aqui o webhook URL do Easypanel (Projeto > Serviço > Deploy > Webhook)
$EASYPANEL_WEBHOOK = $env:EASYPANEL_WEBHOOK_URL
if (-not $EASYPANEL_WEBHOOK) {
    # Fallback: edite diretamente aqui se preferir
    $EASYPANEL_WEBHOOK = "https://SUA_URL_EASYPANEL_WEBHOOK_AQUI"
}

Write-Host ""
Write-Host "🚀 ALICERCE ERP - Deploy Automático" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# PASSO 1: Adicionar todos os arquivos modificados
Write-Host "📦 [1/4] Adicionando arquivos ao stage..." -ForegroundColor Yellow
& "C:\Program Files\Git\bin\git.exe" add . 2>&1
if ($LASTEXITCODE -ne 0) {
    # tenta no PATH alternativo
    git add . 2>&1
}

# PASSO 2: Commit
Write-Host "💾 [2/4] Criando commit: $mensagem" -ForegroundColor Yellow
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm"
$commitMsg = "$mensagem [$timestamp]"

try {
    & "C:\Program Files\Git\bin\git.exe" commit -m $commitMsg 2>&1
} catch {
    Write-Host "  → Nada novo para commitar ou git não encontrado no caminho padrão." -ForegroundColor Gray
}

# PASSO 3: Push para o GitHub
Write-Host "📤 [3/4] Enviando para o GitHub (main)..." -ForegroundColor Yellow
try {
    & "C:\Program Files\Git\bin\git.exe" push origin main 2>&1
    Write-Host "  ✅ Push concluído!" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Push falhou. Verifique a conexão ou autenticação do GitHub." -ForegroundColor Red
}

# PASSO 4: Disparar Deploy no Easypanel
Write-Host "🔁 [4/4] Disparando deploy no Easypanel..." -ForegroundColor Yellow

if ($EASYPANEL_WEBHOOK -eq "https://SUA_URL_EASYPANEL_WEBHOOK_AQUI") {
    Write-Host ""
    Write-Host "  ⚠️  WEBHOOK DO EASYPANEL NÃO CONFIGURADO!" -ForegroundColor Red
    Write-Host "  Configure a variável de ambiente EASYPANEL_WEBHOOK_URL" -ForegroundColor Red
    Write-Host "  ou edite o script e substitua SUA_URL_EASYPANEL_WEBHOOK_AQUI" -ForegroundColor Red
} else {
    try {
        $response = Invoke-WebRequest -Uri $EASYPANEL_WEBHOOK -Method POST -UseBasicParsing -SkipCertificateCheck
        Write-Host "  ✅ Deploy disparado! Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Falha ao disparar webhook: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "✅ Processo de deploy concluído!" -ForegroundColor Green
Write-Host "   Verifique o Easypanel para acompanhar o build." -ForegroundColor Gray
Write-Host ""
