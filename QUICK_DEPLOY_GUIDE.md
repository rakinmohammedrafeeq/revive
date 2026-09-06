# 🚀 Quick Deployment Guide

## ✅ Step 1: Copy Environment Variables to Render

**Go to**: https://dashboard.render.com → **revive-backend** → **Environment** tab

Copy ALL these from your local `backend/.env` file. You need to add them manually one by one:

### Critical Variables (Add These First):
```
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
DISABLE_EMBEDDINGS=true
APP_BASE_URL=https://revive-ops.vercel.app
GOOGLE_REDIRECT_URI=https://revive-backend-qfre.onrender.com/login/oauth2/code/google
APP_OAUTH2_REDIRECT_URI=https://revive-ops.vercel.app/oauth2/callback
```

### Then add ALL other variables from your `.env`:
- DB_URL, DB_USERNAME, DB_PASSWORD
- JWT_SECRET, JWT_EXPIRATION
- GEMINI_API_KEY, GEMINI_* (all vision/text models)
- GROQ_API_KEY, GROQ_VISION_MODEL
- RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME
- CLOUDINARY_* (all 4 variables)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- AI_MAX_* (all rate limits)
- REVIVE_SEED_ADMIN=true

**Total: ~35 environment variables**

---

## ✅ Step 2: Update Render Settings

**Go to**: https://dashboard.render.com → **revive-backend** → **Settings** tab

### Verify these settings:

**Root Directory**: `backend`

**Dockerfile Path**: `Dockerfile`

**Docker Build Context**: `.` (current directory)

**Docker Command**: (leave empty - uses Dockerfile's ENTRYPOINT)

Click **Save Changes** if you modified anything.

---

## ✅ Step 3: Commit and Push Changes

```bash
cd d:\Projects\Revive
git add -A
git commit -m "Add Python ML support to Dockerfile"
git push origin main
```

---

## ✅ Step 4: Deploy on Render

**Go to**: https://dashboard.render.com → **revive-backend**

Click **"Manual Deploy"** → **"Deploy latest commit"**

Wait **5-10 minutes** for build to complete.

**Watch the logs** - you should see:
- "Building Docker image..."
- "Installing Python dependencies..."
- "Starting Spring Boot application..."
- "Started ReviveApplication in X seconds"

---

## ✅ Step 5: Test Backend

Once deployed, test:

```bash
curl https://revive-backend-qfre.onrender.com/actuator/health
```

**Expected**: `{"status":"UP"}`

---

## ✅ Step 6: Update Vercel Environment Variable

**Go to**: https://vercel.com/dashboard → **revive-ops** → **Settings** → **Environment Variables**

**Add/Update**:
```
VITE_API_URL=https://revive-backend-qfre.onrender.com/api
```

*(Note the `/api` at the end - this is important!)*

Click **Save**.

---

## ✅ Step 7: Redeploy Frontend

**Go to**: https://vercel.com/dashboard → **revive-ops** → **Deployments**

Click **"⋯"** on latest deployment → **"Redeploy"**

Wait **2-3 minutes**.

---

## ✅ Step 8: Update Google OAuth Console

**Go to**: https://console.cloud.google.com/apis/credentials

Click your **OAuth 2.0 Client ID**

### Add Authorized JavaScript origins:
```
https://revive-ops.vercel.app
https://revive-backend-qfre.onrender.com
```

### Add Authorized redirect URIs:
```
https://revive-backend-qfre.onrender.com/login/oauth2/code/google
https://revive-ops.vercel.app/oauth2/callback
```

Click **SAVE**.

---

## ✅ Step 9: Test Complete Flow

1. **Open**: https://revive-ops.vercel.app
2. **Login** with email or Google OAuth
3. **Create a failed payment** (amount: 100, error: declined_temp)
4. **Check** that AI analysis appears
5. **Verify** recovery probability is shown

---

## 🚨 If Backend Build Fails on Render

Check the **Logs** tab on Render for error messages.

**Common issues**:

1. **Missing env vars**: Add ALL ~35 variables from your `.env`
2. **ML files not found**: Ensure `ml/` folder is in your Git repo
3. **Out of memory**: Add `DISABLE_EMBEDDINGS=true` environment variable
4. **Database connection timeout**: Neon DB may be sleeping, retry after 30 seconds

---

## 🎉 Success Checklist

- ✅ Backend deploys successfully on Render
- ✅ Health check returns `{"status":"UP"}`
- ✅ Frontend loads on Vercel
- ✅ Login works (email + Google OAuth)
- ✅ Can create failed payments
- ✅ AI analysis runs and shows recovery probability
- ✅ No CORS errors in browser console (F12)

---

## 📝 Final URLs

- **Frontend**: https://revive-ops.vercel.app
- **Backend**: https://revive-backend-qfre.onrender.com
- **API Base**: https://revive-backend-qfre.onrender.com/api
- **Health**: https://revive-backend-qfre.onrender.com/actuator/health

---

**Need help?** Check Render logs or browser console (F12) for errors.
