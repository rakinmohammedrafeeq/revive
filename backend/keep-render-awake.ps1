# Keep Render Backend Awake
# Prevents cold starts by pinging health endpoint every 10 minutes

$renderUrl = "https://revive-backend-qfre.onrender.com/healthz"
$pingInterval = 600 # 10 minutes in seconds

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 Render Keep-Alive Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $renderUrl" -ForegroundColor Yellow
Write-Host "Interval: Every $($pingInterval / 60) minutes" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$successCount = 0
$failCount = 0

while ($true) {
    $timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    
    try {
        $response = Invoke-WebRequest -Uri $renderUrl -Method GET -TimeoutSec 30 -UseBasicParsing
        $successCount++
        
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "✅ Render is alive" -NoNewline -ForegroundColor Green
        Write-Host " | Status: $($response.StatusCode) | Success: $successCount | Fails: $failCount" -ForegroundColor Gray
    }
    catch {
        $failCount++
        
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "❌ Ping failed" -NoNewline -ForegroundColor Red
        Write-Host " | Error: $($_.Exception.Message) | Success: $successCount | Fails: $failCount" -ForegroundColor Gray
        
        # If consecutive failures, warn user
        if ($failCount % 3 -eq 0 -and $failCount -gt 0) {
            Write-Host "`n⚠️  WARNING: Multiple failures detected. Check Render service status.`n" -ForegroundColor Yellow
        }
    }
    
    Write-Host "   Next ping in $($pingInterval / 60) minutes...`n" -ForegroundColor DarkGray
    Start-Sleep -Seconds $pingInterval
}
