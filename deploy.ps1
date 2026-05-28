# ALICERCE ERP - Deploy Script
param(
    [Parameter(Mandatory=$false)]
    [string]$mensagem = "chore: atualizacao automatica"
)

$ErrorActionPreference = "Continue"
$GIT = "C:\Program Files\Git\bin\git.exe"

Write-Host "--- ALICERCE ERP: DEPLOY ---"

# 1. GIT ADD
Write-Host "[1/4] Git Add..."
& $GIT add .

# 2. GIT COMMIT
Write-Host "[2/4] Git Commit..."
$timestamp = Get-Date -Format "dd/MM/yyyy HH:mm"
$commitMsg = "$mensagem [$timestamp]"
& $GIT commit -m "$commitMsg"

# 3. GIT PUSH
Write-Host "[3/4] Git Push..."
& $GIT push origin main

# 4. WEBHOOK / DEPLOY
Write-Host "[4/4] Finalizando Deploy..."

# Instrução: Configure o Webhook do Easypanel no seu ambiente local (.env) 
# ou substitua a URL abaixo para automação completa.
$WEBHOOK = "http://187.77.233.165:3000/api/deploy/DmciHjDqZNcasKbJ6MZeU41fhQRm6yA9AUQbgJmJfc8934e3"

if ($WEBHOOK -and $WEBHOOK -ne "") {
    try {
        $response = Invoke-WebRequest -Uri $WEBHOOK -Method Get -ErrorAction Stop
        Write-Host "SUCESSO: Deploy acionado via Webhook. Status: $($response.StatusCode)"
    } catch {
        Write-Host "AVISO: Webhook falhou ou não respondeu. $_"
    }
} else {
    Write-Host "NOTA: Webhook não configurado. Execute o Rebuild manual no Painel Easypanel."
}

Write-Host "DONE."
