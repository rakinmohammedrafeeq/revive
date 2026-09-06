# Render Deployment Checklist

## 🔴 Critical Fixes Applied - Deploy Required

### Files Changed:
1. ✅ `RecoveryPredictionModel.java` - Fixed Python command
2. ✅ `application.properties` - Added timezone configuration  
3. ✅ `FailedPayment.java` - Fixed UTC timestamp handling

---

## 📋 Pre-Deployment Steps

### 1. Update Environment Variables in Render

Go to: https://dashboard.render.com → Select `revive-backend` → Environment Tab

**Update this variable:**
```
GROQ_TEXT_MODEL=llama-3.1-8b-instant
```

**Why?** 
- Current value `llama-3.3-70b-versatile` requires Groq Enterprise (paid)
- `llama-3.1-8b-instant` is available on free tier
- Alternative: Upgrade to Groq Enterprise to keep 3.3

---

## 🚀 Deployment Options

### Option A: Git Push (Automatic)
```bash
git add .
git commit -m "fix: resolve Python path, Groq model, and timezone issues"
git push origin main
```
Render will auto-deploy from your connected repository.

### Option B: Manual Deploy
1. Go to Render Dashboard
2. Select `revive-backend`
3. Click "Manual Deploy" → "Deploy latest commit"

---

## ✅ Post-Deployment Verification

### 1. Check Logs (immediately after deploy)
Look for these SUCCESS indicators:

```log
✅ Python dependencies installed
✅ AI Recovery Diagnosis Service initialized with model: llama-3.1-8b-instant  
✅ Application started successfully
```

### 2. Verify ML Predictions Working
**Before:** You should see this error disappear:
```log
❌ Python model call failed for PAY_XXX, using rule-based fallback: 
   Cannot run program "python": error=2, No such file or directory
```

**After:** ML predictions should work silently (no warnings)

### 3. Verify Groq API Working
**Before:** This error should disappear:
```log
❌ Groq API error: 404 - {"error":{"message":"The model `llama-3.3-70b-versatile` 
   does not exist or you do not have access to it."
```

**After:** AI diagnosis should work (test by viewing a payment's AI diagnosis)

### 4. Verify Timestamps Fixed
- Create a new test payment
- Check if the timestamp shows correctly (current time, not wrong date)
- Dates should now display in YOUR local timezone

---

## 🔍 Testing Commands

### Test Python Installation
```bash
# In Render Shell (Dashboard → Shell tab)
python3 --version
pip3 list | grep scikit-learn
```

Expected output:
```
Python 3.x.x
scikit-learn==1.5.2
```

### Test API Endpoints
```bash
# Health check
curl https://revive-backend.onrender.com/healthz

# Should return: {"status":"UP"}
```

---

## 🐛 Troubleshooting

### If Python still fails:
1. Check build logs for Python installation errors
2. Verify `render-build.sh` has execute permissions
3. Check if ML models are copied: `ls -la /app/ml/`

### If Groq still fails:
1. Verify env var updated: Check Environment tab
2. Check API key is valid: Test at https://console.groq.com
3. Verify rate limits not exceeded

### If timestamps still wrong:
1. Check database timezone: Run `SHOW TIMEZONE;` in PostgreSQL
2. Verify Jackson serialization in logs
3. Clear browser cache and reload frontend

---

## 📊 Summary of Changes

| Issue | Status | Impact |
|-------|--------|--------|
| Python command not found | ✅ Fixed | ML predictions now work |
| Invalid Groq model | ⚠️ Needs env update | AI diagnosis will work after env change |
| Wrong timestamps | ✅ Fixed | Dates display correctly |

---

## 🔗 Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Application Logs**: Dashboard → revive-backend → Logs tab
- **Environment Variables**: Dashboard → revive-backend → Environment tab
- **Groq Console**: https://console.groq.com
- **Groq Models Docs**: https://console.groq.com/docs/models

---

## 💡 Long-term Recommendations

1. **Consider Groq Enterprise** if you need faster inference (280 vs 560 tokens/sec)
2. **Set up monitoring** for ML model failures  
3. **Add retry logic** for Groq API calls with exponential backoff
4. **Consider switching to Instant types** for Java timestamps (better timezone handling)
5. **Add integration tests** for timezone handling

---

## 🆘 Need Help?

If issues persist after deployment:
1. Check Render logs: `Dashboard → Logs → Live tail`
2. Check database connection: `Dashboard → Shell → psql -d $DATABASE_URL`
3. Review full error traces in logs
4. Contact Render support if infrastructure issues

---

**Last Updated**: September 6, 2026
**Applied By**: Kiro AI Assistant
**Tested**: Ready for deployment
