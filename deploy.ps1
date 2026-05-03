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

# 4. WEBHOOK
Write-Host "[4/4] Webhook..."
# O usuário deve ter configurado isso no Easypanel
$WEBHOOK = "https://easypanel.mshosting.com.br/api/hooks/deploy/8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d"

try {
    Invoke-RestMethod -Uri $WEBHOOK -Method Post
    Write-Host "SUCCESS: Deploy triggered."
} catch {
    Write-Host "WARNING: Webhook failed. Manual deploy needed."
}

Write-Host "DONE."
