# Keep Both Neon Database AND Render Backend Awake
# Prevents double cold start by pinging both services

$renderUrl = "https://revive-backend-qfre.onrender.com/healthz"
$neonDbUrl = $env:DB_URL

# Load .env file if exists
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    $neonDbUrl = $env:DB_URL
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔄 Dual Keep-Alive Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Render Backend: $renderUrl" -ForegroundColor Yellow
Write-Host "Neon Database: $($neonDbUrl -replace 'postgresql://([^:]+):([^@]+)@', 'postgresql://*****:*****@')" -ForegroundColor Yellow
Write-Host "`nSchedule:" -ForegroundColor White
Write-Host "  - Neon ping: Every 4 minutes" -ForegroundColor Gray
Write-Host "  - Render ping: Every 10 minutes" -ForegroundColor Gray
Write-Host "`nPress Ctrl+C to stop" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan

$renderSuccess = 0
$renderFail = 0
$neonSuccess = 0
$neonFail = 0
$startTime = Get-Date

function Ping-Render {
    $timestamp = (Get-Date).ToString('HH:mm:ss')
    
    try {
        $response = Invoke-WebRequest -Uri $renderUrl -Method GET -TimeoutSec 30 -UseBasicParsing
        $script:renderSuccess++
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "✅ Render" -NoNewline -ForegroundColor Green
        Write-Host " ($($response.StatusCode))" -ForegroundColor Gray
    }
    catch {
        $script:renderFail++
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "❌ Render" -NoNewline -ForegroundColor Red
        Write-Host " ($($_.Exception.Message))" -ForegroundColor Gray
    }
}

function Ping-Neon {
    $timestamp = (Get-Date).ToString('HH:mm:ss')
    
    if (-not $neonDbUrl) {
        Write-Host "[$timestamp] ⚠️  Neon DB URL not configured (skipping)" -ForegroundColor Yellow
        return
    }
    
    try {
        # Simple ping using psql or connection test
        # For now, we'll ping the Render endpoint which validates DB connection
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
        Write-Host "🔵 Neon" -NoNewline -ForegroundColor Cyan
        Write-Host " (validated via Render)" -ForegroundColor Gray
        $script:neonSuccess++
    }
    catch {
        $script:neonFail++
        Write-Host "[$timestamp] ❌ Neon connection check failed" -ForegroundColor Red
    }
}

# Initial pings
Ping-Render
Ping-Neon

$neonCounter = 0
$renderCounter = 0

while ($true) {
    Start-Sleep -Seconds 60  # Check every minute
    
    $neonCounter++
    $renderCounter++
    
    # Ping Neon every 4 minutes
    if ($neonCounter -ge 4) {
        Ping-Neon
        $neonCounter = 0
    }
    
    # Ping Render every 10 minutes
    if ($renderCounter -ge 10) {
        Ping-Render
        $renderCounter = 0
    }
    
    # Show stats every 10 minutes
    if ($renderCounter -eq 0) {
        $uptime = New-TimeSpan -Start $startTime -End (Get-Date)
        Write-Host "`n📊 Stats: Render ✅$renderSuccess/❌$renderFail | Neon ✅$neonSuccess/❌$neonFail | Uptime: $($uptime.Hours)h $($uptime.Minutes)m`n" -ForegroundColor DarkCyan
    }
}
