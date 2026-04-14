# Deploy TTS Edge Function to Supabase
# Prereqs: Run "npx supabase login" once (opens browser)
# Then: npm run deploy:tts
# Or run this script after login:
#   .\scripts\deploy-tts.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "taiwqvydfhlkyjguunrb"

Write-Host "Deploying tts-proxy to Supabase (project $ProjectRef)..." -ForegroundColor Cyan
npx supabase functions deploy tts-proxy --project-ref $ProjectRef

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployed. Set the Azure key secret:" -ForegroundColor Green
    Write-Host "  npx supabase secrets set AZURE_SPEECH_KEY=your_azure_key --project-ref $ProjectRef" -ForegroundColor Yellow
}
