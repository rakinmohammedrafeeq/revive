# Gemini API Key Validation Script (PowerShell)
# This script validates if your Gemini API key is correctly configured

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Gemini API Key Validation" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[X] Error: .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] .env file found" -ForegroundColor Green

# Read .env file and load variables
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Variable -Name $key -Value $value -Scope Script
    }
}

# Check if GEMINI_API_KEY is set
if ([string]::IsNullOrWhiteSpace($GEMINI_API_KEY)) {
    Write-Host "[X] Error: GEMINI_API_KEY is not set in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] GEMINI_API_KEY found in .env" -ForegroundColor Green
Write-Host "  Key starts with: $($GEMINI_API_KEY.Substring(0, [Math]::Min(10, $GEMINI_API_KEY.Length)))..." -ForegroundColor Gray
Write-Host ""

# Validate key format
if ($GEMINI_API_KEY -match '^AIza') {
    Write-Host "[OK] Key format looks valid (starts with AIza)" -ForegroundColor Green
} else {
    Write-Host "[!] Warning: Key doesn't start with 'AIza' - this may not be a valid Google Gemini API key" -ForegroundColor Yellow
    Write-Host "   Valid keys should be obtained from: https://aistudio.google.com/app/apikey" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing API connection..." -ForegroundColor Cyan
Write-Host ""

# Set model name
if ([string]::IsNullOrWhiteSpace($GEMINI_MODEL)) {
    $GEMINI_MODEL = "gemini-3.6-flash"
}

# Prepare API request
$url = "https://generativelanguage.googleapis.com/v1beta/models/$GEMINI_MODEL`:generateContent?key=$GEMINI_API_KEY"
$body = @{
    contents = @(
        @{
            parts = @(
                @{
                    text = "Say hello in one word"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

try {
    # Make API request
    $response = Invoke-WebRequest -Uri $url -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "HTTP Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host ""
    
    if ($response.StatusCode -eq 200) {
        Write-Host "[SUCCESS] Gemini API key is valid and working!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response preview:" -ForegroundColor Gray
        $preview = $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
        Write-Host "$preview..." -ForegroundColor Gray
        exit 0
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = ""
    
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
    } catch {
        $errorBody = $_.Exception.Message
    }
    
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Gray
    Write-Host ""
    
    switch ($statusCode) {
        400 {
            Write-Host "[X] FAILED: API key is invalid or request format is incorrect" -ForegroundColor Red
        }
        403 {
            Write-Host "[X] FAILED: API key is invalid or does not have permission" -ForegroundColor Red
        }
        429 {
            Write-Host "[!] Rate limit exceeded. Your key might be valid but you've made too many requests." -ForegroundColor Yellow
        }
        default {
            Write-Host "[X] FAILED: Unexpected HTTP status code $statusCode" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Gray
    Write-Host $errorBody -ForegroundColor Gray
    exit 1
}
