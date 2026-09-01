# Neon Database Keep-Alive Script
# Pings the backend every 4 minutes to prevent Neon free tier from sleeping

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Neon Database Keep-Alive Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "This script pings your backend every 4 minutes"
Write-Host "to keep the Neon database from sleeping."
Write-Host ""
Write-Host "Leave this window open while developing!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] Pinging backend to keep database awake..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -Method Get -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host " ✓ Backend is responding" -ForegroundColor Green
        } else {
            Write-Host " ⚠ Backend returned status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " ✗ Backend not responding - is it running?" -ForegroundColor Red
    }
    
    Write-Host "Waiting 4 minutes until next ping...`n" -ForegroundColor Gray
    Start-Sleep -Seconds 240
}
