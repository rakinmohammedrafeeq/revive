# Production Fixes for Render Deployment

## Issues Identified from Logs

### 1. Python Command Not Found ✅ FIXED
**Error**: `Cannot run program "python": error=2, No such file or directory`

**Root Cause**: Java code calls `python` but Linux systems have `python3`

**Fix Applied**: Updated `RecoveryPredictionModel.java` line 97
```java
// Changed from:
ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT, jsonInput);
// To:
ProcessBuilder pb = new ProcessBuilder("python3", PYTHON_SCRIPT, jsonInput);
```

### 2. Invalid Groq Model Name ❌ NEEDS ENV FIX
**Error**: `The model 'llama-3.3-70b-versatile' does not exist or you do not have access to it`

**Root Cause**: Environment variable `GROQ_TEXT_MODEL` is set to a non-existent model

**Valid Groq Models** (as of 2026):
- ✅ `llama-3.3-70b-versatile` - **Enterprise only** (requires paid plan)
- ✅ `llama-3.1-8b-instant` - Free tier available
- ✅ `openai/gpt-oss-120b` - Available
- ✅ `openai/gpt-oss-20b` - Available

**Solution**: The model DOES exist but requires an Enterprise Groq account. 

**Two Options**:

#### Option A: Upgrade to Groq Enterprise (Recommended for Production)
Contact Groq sales to enable `llama-3.3-70b-versatile`

#### Option B: Use Free Tier Model (Immediate Fix)
Update your Render environment variable:
```bash
GROQ_TEXT_MODEL=llama-3.1-8b-instant
```

**Steps to Update in Render**:
1. Go to your Render dashboard
2. Select `revive-backend` service
3. Go to "Environment" tab
4. Find `GROQ_TEXT_MODEL`
5. Change value to: `llama-3.1-8b-instant`
6. Click "Save Changes" - this will trigger a redeploy

### 3. Date Display Issue 🕐 ✅ FIXED
**Reported Issue**: Timestamps showing wrong dates (e.g., "9/6/2026, 12:27:39 PM" when created just now)

**Root Cause**: 
- Backend was using `LocalDateTime.now()` which captures server's local timezone
- Render servers run in UTC, but `LocalDateTime` doesn't store timezone info
- Frontend `toLocaleString()` displays in user's browser timezone
- No explicit timezone configuration in Spring Boot

**Fixes Applied**:

1. **Backend Timezone Configuration** (`application.properties`):
```properties
spring.jpa.properties.hibernate.jdbc.time_zone=UTC
spring.jackson.time-zone=UTC
spring.jackson.serialization.write-dates-as-timestamps=false
```

2. **Entity Timestamp Fix** (`FailedPayment.java`):
```java
// Changed from LocalDateTime.now() to LocalDateTime.now(ZoneOffset.UTC)
@PrePersist
protected void onCreate() {
    LocalDateTime utcNow = LocalDateTime.now(ZoneOffset.UTC);
    this.createdAt = utcNow;
    this.updatedAt = utcNow;
    if (this.failedAt == null) {
        this.failedAt = utcNow;
    }
}
```

**Result**: All timestamps now stored consistently in UTC and properly converted to user's local timezone in the frontend.

---

## Quick Fix Commands

### For Render.com Deployment:

1. **Python fix is already applied** - Will work on next deploy

2. **Update Groq Model** (via Render Dashboard):
   - Navigate to: https://dashboard.render.com
   - Select: revive-backend
   - Environment → GROQ_TEXT_MODEL → `llama-3.1-8b-instant`
   - Save (auto-redeploys)

3. **Or use Render CLI**:
```bash
# Install Render CLI if needed
npm install -g @render/cli

# Update environment variable
render env set GROQ_TEXT_MODEL=llama-3.1-8b-instant --service revive-backend
```

---

## Verification After Deploy

Monitor logs for these confirmations:
```
✅ AI Recovery Diagnosis Service initialized with model: llama-3.1-8b-instant
✅ Python model predictions working (no more "Cannot run program" errors)
```

---

## Alternative: Keep Groq 3.3 Model

If you want to keep using `llama-3.3-70b-versatile`, you need to:

1. Contact Groq to upgrade your account to Enterprise
2. The model exists but is Enterprise-only
3. Current pricing: Contact Sales
4. Faster than 3.1 (280 tokens/sec vs 560 tokens/sec for 8B)

---

## References

- [Groq Supported Models](https://console.groq.com/docs/models)
- [Groq Enterprise Plans](https://groq.com/)
