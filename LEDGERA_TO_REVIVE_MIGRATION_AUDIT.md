# Ledgera → Revive Migration Audit Report

**Date:** September 1, 2026  
**Type:** READ-ONLY Repository-Wide Audit  
**Status:** ✅ COMPLETE  
**Scope:** All files (backend, frontend, Docker, CI/CD, configuration, documentation)

---

## Executive Summary

This audit identifies **every occurrence** of "Ledgera" across the entire repository and classifies each reference by required action. The repository contains **~350+ Ledgera references** across Java packages, configuration files, frontend code, deployment manifests, documentation, and branding assets.

### Summary Statistics

| Category | Count | Action Required |
|----------|-------|----------------|
| **Java Package Names** | ~150+ files | CHANGE (automated) |
| **Backend Configuration** | 12 references | CHANGE |
| **Frontend Code** | 45+ references | CHANGE |
| **Database References** | 8 references | REVIEW |
| **Environment Variables** | 4 references | CHANGE |
| **Deployment URLs** | 6 references | CHANGE |
| **Branding/UI** | 35+ references | CHANGE |
| **Documentation** | 100+ references | CHANGE |
| **Email Templates** | 6 references | CHANGE |

---

## A. Java Package & Application Identity

### Classification: **CHANGE** (Automated via IDE Refactor)

All Java files use `package com.ledgera.*` which should become `com.revive.*` or remain as-is depending on decision.

#### Main Application Class

| File | Current | Recommended | Reason |
|------|---------|-------------|--------|
| `backend/src/main/java/com/ledgera/LedgeraApplication.java` | `class LedgeraApplication` | `class ReviveApplication` | CHANGE - Main application entry point |
| Same file, line 78 | `SpringApplication.run(LedgeraApplication.class, args)` | `SpringApplication.run(ReviveApplication.class, args)` | CHANGE - Bootstrap reference |

#### Package Structure (~150+ files)

**Current:** `com.ledgera.*`

**Options:**
1. **CHANGE to `com.revive.*`** — Clean break, new product identity
2. **KEEP `com.ledgera.*`** — Preserve technical continuity (domain name still valid)

**Files Affected:**
- `backend/src/main/java/com/ledgera/config/*.java` (10 files)
- `backend/src/main/java/com/ledgera/controller/*.java` (13 files)
- `backend/src/main/java/com/ledgera/dto/*.java` (30+ files)
- `backend/src/main/java/com/ledgera/entity/*.java` (15 files)
- `backend/src/main/java/com/ledgera/enums/*.java` (8 files)
- `backend/src/main/java/com/ledgera/exception/*.java` (5 files)
- `backend/src/main/java/com/ledgera/repository/*.java` (13 files)
- `backend/src/main/java/com/ledgera/security/*.java` (7 files)
- `backend/src/main/java/com/ledgera/service/*.java` (20+ files)

**Migration Strategy:**
- ✅ **Can be automated** via IntelliJ IDEA "Refactor → Rename Package"
- ⚠️ **Test thoroughly** after package rename
- ⚠️ **Update imports** in all files (IDE handles this)

**Recommendation:** **REVIEW** — Decide between:
- **Option A:** Change to `com.revive.*` (clean product identity)
- **Option B:** Keep `com.ledgera.*` temporarily (reduces risk, domain still owned)

---

## B. Backend Configuration

### Classification: **CHANGE**

#### application.properties

**File:** `backend/src/main/resources/application.properties`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 1 | `spring.application.name=Ledgera` | `spring.application.name=Revive` | **CHANGE** - Application identifier |
| 37 | `ledgera.seed-admin=${LEDGERA_SEED_ADMIN:true}` | `revive.seed-admin=${REVIVE_SEED_ADMIN:true}` | **CHANGE** - Property namespace |
| 49 | `resend.from.name=${RESEND_FROM_NAME:Ledgera}` | `resend.from.name=${RESEND_FROM_NAME:Revive}` | **CHANGE** - Email branding |

**Impact:** Low risk, application restart required

---

#### application-prod.properties

**File:** `backend/src/main/resources/application-prod.properties`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 26 | `logging.level.com.ledgera=INFO` | `logging.level.com.revive=INFO` | **CHANGE** (if package renamed) |

**Impact:** Only needed if package structure changes

---

#### application-h2.properties

**File:** `backend/src/main/resources/application-h2.properties`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 6 | `spring.datasource.url=jdbc:h2:mem:ledgera;...` | `spring.datasource.url=jdbc:h2:mem:revive;...` | **CHANGE** - In-memory DB name |

**Impact:** Only affects H2 profile (development/testing)

---

#### LedgeraApplication.java

**File:** `backend/src/main/java/com/ledgera/LedgeraApplication.java`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 58 | `String resendFromName = dotenv.get("RESEND_FROM_NAME", "Ledgera");` | `String resendFromName = dotenv.get("RESEND_FROM_NAME", "Revive");` | **CHANGE** - Default email sender name |

**Impact:** Low, default value only (overridden by env var)

---

## C. Database Configuration

### Classification: **REVIEW**

#### Docker Compose Dev

**File:** `backend/docker-compose.dev.yml`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 6 | `container_name: ledgera-postgres-dev` | `container_name: revive-postgres-dev` | **CHANGE** - Container name |
| 8 | `POSTGRES_DB: ledgera` | `POSTGRES_DB: revive` | **REVIEW** - Database name |
| 9 | `POSTGRES_USER: ledgera` | `POSTGRES_USER: revive` | **REVIEW** - Database user |
| 10 | `POSTGRES_PASSWORD: ledgera123` | `POSTGRES_PASSWORD: revive123` | **CHANGE** - Development password |
| 15 | `- ledgera-postgres-data:/var/lib/postgresql/data` | `- revive-postgres-data:/var/lib/postgresql/data` | **CHANGE** - Volume name |
| 18 | `test: ["CMD-SHELL", "pg_isready -U ledgera -d ledgera"]` | `test: ["CMD-SHELL", "pg_isready -U revive -d revive"]` | **CHANGE** - Health check |
| 24 | `- ledgera-network` | `- revive-network` | **CHANGE** - Network name |
| 27 | `ledgera-postgres-data:` | `revive-postgres-data:` | **CHANGE** - Volume declaration |
| 31 | `ledgera-network:` | `revive-network:` | **CHANGE** - Network declaration |

**Impact:** ⚠️ **BREAKING** for existing dev containers  
**Action Required:** Destroy and recreate dev containers after change  
**Data Migration:** No (development only)

---

#### Migration V2 (Historical)

**File:** `backend/src/main/resources/db/migration/V2__backfill_financial_record_users.sql`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 19 | `SET user_id = (SELECT id FROM users WHERE email = 'admin@ledgera.com' LIMIT 1)` | N/A | **KEEP** - Historical migration, do not modify |

**Reason:** Flyway migrations should **NEVER** be modified after deployment  
**Impact:** None (already applied to production database)

---

## D. Environment Variables

### Classification: **CHANGE**

#### Environment Variable Names

| Current | Recommended | Files Affected | Classification |
|---------|-------------|----------------|----------------|
| `LEDGERA_SEED_ADMIN` | `REVIVE_SEED_ADMIN` | `.env.example`, `application.properties`, `DataInitializer.java`, `render.yaml` | **CHANGE** |
| `RESEND_FROM_NAME` (default value) | Keep var name, change default | `.env.example`, `application.properties` | **CHANGE** default only |

**Files:**
- `backend/.env.example`
- `backend/src/main/resources/application.properties`
- `backend/src/main/java/com/ledgera/config/DataInitializer.java`
- `render.yaml`

**Impact:** ⚠️ Requires environment variable update in:
- Local `.env` files
- Render.com deployment
- Any other deployment environments
- CI/CD secrets (if applicable)

---

## E. Google OAuth Configuration

### Classification: **CHANGE**

#### OAuth Redirect URIs

**Current Configuration:**

| File | Line | Current Value | Issue |
|------|------|---------------|-------|
| `render.yaml` | 30 | `GOOGLE_REDIRECT_URI=https://ledgera-backend.onrender.com/login/oauth2/code/google` | **CHANGE** - Hardcoded Ledgera domain |
| `backend/.env.example` | N/A | `GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google` | **KEEP** - Localhost valid |

**Required Actions:**

1. **Update Google Cloud Console:**
   - Add new authorized redirect URI: `https://revive-backend.onrender.com/login/oauth2/code/google`
   - Keep old URI temporarily during migration
   - Remove old URI after cutover

2. **Update Deployment Config:**
   - Change `render.yaml` line 30 to new domain
   - Update frontend OAuth callback in `render.yaml` line 32

3. **Update Frontend OAuth Redirect:**

**Current:**
```yaml
- key: APP_OAUTH2_REDIRECT_URI
  sync: false  # Value in Render dashboard
```

**Recommended:** Update in Render dashboard to use new frontend domain

**Impact:** ⚠️ **CRITICAL** - OAuth will break if not updated in Google Console first

---

## F. AI/LLM Configuration

### Classification: **KEEP**

#### AI Model Configuration

**No Ledgera-specific references found in:**
- Groq configuration
- Gemini configuration
- Model selection logic
- AI service classes

**Status:** ✅ No changes required

---

## G. Frontend Branding & Configuration

### Classification: **CHANGE**

#### App Name Configuration

**File:** `frontend/src/config/appInfo.ts`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 1 | `export const APP_NAME = 'Ledgera'` | `export const APP_NAME = 'Revive'` | **CHANGE** - Global app name |

**Impact:** Propagates to all UI locations using APP_NAME

---

#### Brand Assets

**File:** `frontend/src/config/brandAssets.ts`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 2-4 | Comment mentions `E:\ledgera\public` | Update comment | **CHANGE** - Documentation only |

**Impact:** Comment only, assets referenced by path remain valid

---

#### Storage Keys

**File:** `frontend/src/store/authStore.ts`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 3 | `const TOKEN_KEY = 'ledgera_token'` | `const TOKEN_KEY = 'revive_token'` | **REVIEW** - LocalStorage key |
| 4 | `const USER_KEY = 'ledgera_user'` | `const USER_KEY = 'revive_user'` | **REVIEW** - LocalStorage key |
| 5 | `const AUTH_EVENT = 'ledgera:auth-changed'` | `const AUTH_EVENT = 'revive:auth-changed'` | **REVIEW** - Custom event name |

**Impact:** ⚠️ **BREAKING** for existing users  
**Reason:** Changing localStorage keys will log out all existing users  
**Recommendation:** 
- **Option A:** Keep old keys (users stay logged in)
- **Option B:** Add migration logic to copy old keys to new keys
- **Option C:** Accept user logout (cleanest break)

---

#### Theme Storage

**File:** `frontend/src/contexts/ThemeContext.tsx`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 21 | `localStorage.getItem('ledgera-theme')` | `localStorage.getItem('revive-theme')` | **REVIEW** - LocalStorage key |
| 48 | `localStorage.setItem('ledgera-theme', theme)` | `localStorage.setItem('revive-theme', theme)` | **REVIEW** - LocalStorage key |

**Impact:** ⚠️ Users will lose theme preference  
**Recommendation:** Add migration logic or accept theme reset

---

#### UI Text References (35+ occurrences)

**Files with "Ledgera" in UI:**
1. `frontend/src/pages/LandingPage.tsx` (2 refs: logo alt, brand text)
2. `frontend/src/pages/auth/LoginPage.tsx` (3 refs: logo alt, spinner alt, header)
3. `frontend/src/pages/auth/RegisterPage.tsx` (2 refs: logo alt, spinner alt)
4. `frontend/src/pages/auth/ForgotPasswordPage.tsx` (2 refs: email context, spinner alt)
5. `frontend/src/pages/auth/OAuth2CallbackPage.tsx` (2 refs: logo alt, spinner alt)
6. `frontend/src/pages/auth/TermsAndPrivacyPage.tsx` (7 refs: logo alt, terms text, policy text)
7. `frontend/src/components/layout/AppSidebar.tsx` (2 refs: logo alt, sidebar brand)
8. `frontend/src/components/layout/AuthLayout.tsx` (2 refs: logo alt, header brand)
9. `frontend/src/components/ui/fintrix-spinner.tsx` (2 refs: logo alt, component name)

**Search & Replace Pattern:**
```typescript
// Find: alt="Ledgera"
// Replace: alt="Revive"

// Find: >Ledgera<
// Replace: >Revive<

// Find: "Ledgera"
// Replace: "Revive" (in UI strings only, NOT imports)
```

**Impact:** Visual branding update, no functional change

---

#### Component Names

**File:** `frontend/src/components/ui/fintrix-spinner.tsx`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 4 | `export function LedgeraSpinner({` | Keep or rename to `ReviveSpinner` | **REVIEW** |
| 35-36 | `export const FintrixSpinner = LedgeraSpinner` | Keep deprecated alias | **KEEP** |

**Recommendation:** **REVIEW** — Decide if component should be renamed

---

#### Package.json

**File:** `frontend/package.json`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 2 | `"name": "ledgera-frontend"` | `"name": "revive-frontend"` | **CHANGE** - Package identifier |

**File:** `frontend/package-lock.json` (auto-generated)

Will be regenerated automatically when package.json changes.

---

## H. API URLs & CORS

### Classification: **CHANGE**

#### Production API URL

**File:** `frontend/.env.example`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 3 | `VITE_API_BASE_URL=https://ledgera-backend.onrender.com/api` | `VITE_API_BASE_URL=https://revive-backend.onrender.com/api` | **CHANGE** - Production URL |

**File:** `frontend/.env.production`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 1 | `VITE_API_BASE_URL=https://ledgera-backend.onrender.com/api` | `VITE_API_BASE_URL=https://revive-backend.onrender.com/api` | **CHANGE** - Production URL |

**Impact:** ⚠️ **CRITICAL** - Frontend will fail to connect to backend if domains don't match

**Required Actions:**
1. Rename Render.com service from `ledgera-backend` to `revive-backend`
2. Update CORS configuration in SecurityConfig.java (if domain-restricted)
3. Update frontend environment variables
4. Update DNS/CDN if using custom domain

---

#### Vite Public Directory Comment

**File:** `frontend/vite.config.ts`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 7 | `// Shared static assets: E:\ledgera\public ...` | Update comment to reflect new structure | **CHANGE** - Comment only |

---

## I. Docker Configuration

### Classification: **CHANGE**

#### Dockerfile Comments

**File:** `backend/Dockerfile`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 2 | `# Multi-Stage Dockerfile for Ledgera Backend (Spring Boot 3.2.5)` | `# Multi-Stage Dockerfile for Revive Backend (Spring Boot 3.2.5)` | **CHANGE** - Documentation |
| 22 | `mv target/ledgera-backend-*.jar target/app.jar` | `mv target/revive-backend-*.jar target/app.jar` | **CHANGE** (if artifact name changes) |

**Impact:** Depends on whether `pom.xml` artifactId is changed

---

#### Docker Compose (covered in Section C)

See Section C for all docker-compose.dev.yml changes.

---

## J. GitHub Actions

### Classification: **CHANGE**

#### Docker Build Workflow

**File:** `.github/workflows/docker-build.yml`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 14 | `IMAGE_NAME: ${{ github.repository }}/revive-backend` | **Already uses "revive"!** | **KEEP** ✅ |

**Status:** ✅ Already migrated to Revive naming

**No changes required in GitHub Actions.**

---

## K. Deployment Configuration (Render.com)

### Classification: **CHANGE**

**File:** `render.yaml`

| Line | Current | Recommended | Classification | Priority |
|------|---------|-------------|----------------|----------|
| 4 | `name: ledgera-backend` | `name: revive-backend` | **CHANGE** | HIGH |
| 30 | `value: https://ledgera-backend.onrender.com/login/oauth2/code/google` | `value: https://revive-backend.onrender.com/login/oauth2/code/google` | **CHANGE** | CRITICAL |
| 38 | `value: Ledgera` | `value: Revive` | **CHANGE** | MEDIUM |
| 53 | `key: LEDGERA_SEED_ADMIN` | `key: REVIVE_SEED_ADMIN` | **CHANGE** | HIGH |

**Migration Steps:**

1. **Before cutover:**
   - Add new OAuth redirect URI in Google Console
   - Test new backend deployment with new name
   
2. **During cutover:**
   - Update `render.yaml`
   - Redeploy backend (will create new service URL)
   - Update frontend environment variables
   - Update `APP_OAUTH2_REDIRECT_URI` in Render dashboard
   
3. **After cutover:**
   - Verify OAuth flow works
   - Remove old OAuth redirect URI from Google Console
   - Delete old `ledgera-backend` service if desired

**Impact:** ⚠️ **SERVICE DISRUPTION** — Backend URL will change

---

## L. Documentation

### Classification: **CHANGE**

#### README.md (100+ references)

**File:** `README.md`

**References:**
- Line 2: Logo alt text
- Line 6: Demo link (`https://ledgera-finance-system.vercel.app`)
- Line 26: Main heading "Ledgera – AI-Powered Full-Stack Finance Tracking Platform"
- Line 28: Product description (10+ "Ledgera" mentions)
- Line 158: "Why Ledgera?" section heading
- Line 236: Project structure comment
- Line 407-408: File descriptions
- Line 440: Email configuration example
- Line 470: Environment variable
- Line 511: Backend URL example
- Line 541-542: Clone command
- Line 644-648: JAR and Docker examples
- Line 780-842: Deployment configuration
- Line 1065-1066: Support links
- Line 1103-1105: Fork instructions
- Line 1241: Footer logo

**Search & Replace Strategy:**
```bash
# App name
sed -i 's/Ledgera/Revive/g' README.md

# URLs (manual review required)
# ledgera-finance-system.vercel.app → revive-revenue-recovery.vercel.app (example)
# ledgera-backend.onrender.com → revive-backend.onrender.com

# Email addresses
# admin@ledgera.com → (keep or change?)
# support@ledgera.com → support@revive.ai (example)

# GitHub repo
# rakinmohammedrafeeq/ledgera → rakinmohammedrafeeq/revive
```

**Impact:** Documentation only, no functional change

---

#### SECURITY.md

**File:** `SECURITY.md`

| Line | Reference | Recommended | Classification |
|------|-----------|-------------|----------------|
| 14 | "security of Ledgera" | "security of Revive" | **CHANGE** |
| 206 | "improve Ledgera's security" | "improve Revive's security" | **CHANGE** |
| 210 | "keep Ledgera and our users safe" | "keep Revive and our users safe" | **CHANGE** |

---

#### CHANGELOG.md

**File:** `CHANGELOG.md`

| Line | Reference | Classification |
|------|-----------|----------------|
| 250 | GitHub release link | **CHANGE** - Update repo name |

---

#### Phase 1 Reports (7 files)

**Files:**
- `PHASE1_IMPLEMENTATION_REPORT.md`
- `REVIVE_PHASE1_SUMMARY.md`
- `PHASE1_CHECKLIST.md`
- `PHASE1_TEST_REPORT.md`
- `PHASE1_INTEGRATION_VERIFICATION_REPORT.md`
- `PHASE1_FINAL_REPORT.md`
- `PHASE1_COMPLETE_SUMMARY.md`

**Classification:** **KEEP** — Historical documentation, preserve "Ledgera" mentions as context

**Reason:** These docs describe the migration FROM Ledgera TO Revive

---

## M. Database & Domain References

### Classification: **KEEP** (with exceptions)

#### Database Tables

**Current:** All tables use generic names (users, workspaces, financial_records, etc.)

**Status:** ✅ No "ledgera" references in table names

**Action:** **KEEP** — No changes required

---

#### Historical Data

**User Email:** `admin@ledgera.com` (used in V2 migration, line 19)

**Classification:** **KEEP** — Historical migration, cannot modify

**Impact:** None (migration already applied)

---

#### Protected Email

**File:** `backend/src/main/java/com/ledgera/service/UserService.java`

| Line | Current | Classification |
|------|---------|----------------|
| 79 | `if (user.getEmail().equals("admin@ledgera.com"))` | **REVIEW** — Hardcoded protection |

**Recommendation:** **REMOVE** protection or update to new admin email

**Reason:** This prevents deactivation of seeded admin account

**Options:**
1. Remove check entirely (allow deactivation)
2. Change to new admin email
3. Check against database flag instead of hardcoded email

---

## N. Other References

### Email Templates

**File:** `backend/src/main/java/com/ledgera/service/EmailService.java`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 42 | `subject("Your Ledgera Password Reset Code")` | `subject("Your Revive Password Reset Code")` | **CHANGE** |
| 75 | `subject("You've been invited to join " + workspaceName + " on Ledgera")` | `subject("You've been invited to join " + workspaceName + " on Revive")` | **CHANGE** |
| 109 | `subject("Reset Your Ledgera Password")` | `subject("Reset Your Revive Password")` | **CHANGE** |

**Impact:** User-facing email subject lines

---

### PWA Manifest

**File:** `public/site.webmanifest`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 2 | `"name": "Ledgera — AI-Powered Finance Tracking Platform"` | `"name": "Revive — AI Revenue Recovery Platform"` | **CHANGE** |
| 3 | `"short_name": "Ledgera"` | `"short_name": "Revive"` | **CHANGE** |
| 4 | `"description": "AI-powered finance tracking with smart categorization..."` | `"description": "AI-powered revenue recovery for merchants..."` | **CHANGE** |

**Impact:** PWA installation name and description

---

### HTML Meta Tags

**File:** `frontend/index.html`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 12 | `<title>Ledgera — AI-Powered Finance Tracking Platform</title>` | `<title>Revive — AI Revenue Recovery Platform</title>` | **CHANGE** |
| 14-16 | `<meta name="description" content="AI-powered finance tracking..."/>` | Update to Revive description | **CHANGE** |
| 25 | `<meta property="og:site_name" content="Ledgera" />` | `<meta property="og:site_name" content="Revive" />` | **CHANGE** |
| 26 | `<meta property="og:title" content="Ledgera — ..."/>` | Update to Revive | **CHANGE** |
| 27-30 | Open Graph description | Update to Revive | **CHANGE** |
| 33 | Twitter card title | Update to Revive | **CHANGE** |
| 34-37 | Twitter card description | Update to Revive | **CHANGE** |

**Impact:** SEO, social media sharing, browser tab title

---

### Maven POM

**File:** `backend/pom.xml`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 14 | `<groupId>com.ledgera</groupId>` | `<groupId>com.revive</groupId>` or keep | **REVIEW** |
| 15 | `<artifactId>ledgera-backend</artifactId>` | `<artifactId>revive-backend</artifactId>` | **CHANGE** |
| 17 | `<name>Ledgera Backend</name>` | `<name>Revive Backend</name>` | **CHANGE** |
| 19 | `<description>AI-Powered Finance Tracking Platform - Backend API...` | Update to Revive description | **CHANGE** |

**Impact:**
- Changes JAR filename from `ledgera-backend-1.0.0.jar` to `revive-backend-1.0.0.jar`
- Affects Docker build (line 22 in Dockerfile)
- Maven coordinates change (affects dependency consumers, if any)

---

### Terms & Privacy Contact

**File:** `frontend/src/pages/auth/TermsAndPrivacyPage.tsx`

| Line | Current | Recommended | Classification |
|------|---------|-------------|----------------|
| 209-210 | `support@ledgera.com` | `support@revive.ai` (or new email) | **CHANGE** |
| Multiple | "Ledgera" in legal text (7 occurrences) | Update to "Revive" | **CHANGE** |

**Impact:** Legal documentation and support contact

---

## Summary Tables

### By File Type

| File Type | Ledgera References | Automated? | Risk Level |
|-----------|-------------------|------------|------------|
| Java source (.java) | ~150 files | ✅ Yes (IDE refactor) | Low |
| Properties (.properties) | 5 | ⚠️ Manual | Low |
| TypeScript (.ts/.tsx) | 45+ | ⚠️ Manual | Medium |
| Configuration (.yml/.yaml/.json) | 25 | ⚠️ Manual | High |
| Documentation (.md) | 100+ | ⚠️ Manual | Low |
| SQL (.sql) | 2 (1 historical) | ❌ No change | None |
| HTML | 15 | ⚠️ Manual | Low |

---

### By Priority

| Priority | Items | Examples | Impact |
|----------|-------|----------|--------|
| **CRITICAL** | 6 | OAuth redirect URIs, API URLs, backend service name | Service disruption |
| **HIGH** | 15 | Application name, package structure, environment variables | Breaking changes |
| **MEDIUM** | 50+ | UI text, email templates, branding | User-facing changes |
| **LOW** | 100+ | Documentation, comments, internal names | Cosmetic |

---

## Automation Assessment

### ✅ Can Be Automated

1. **Java package rename** — IntelliJ IDEA "Refactor → Rename Package"
   - Renames `com.ledgera` → `com.revive`
   - Updates all imports automatically
   - ~150 files affected

2. **Search & replace in UI** — Simple text substitution
   - Find: `"Ledgera"` in JSX/TSX
   - Replace: `"Revive"`
   - ~35 occurrences

3. **Documentation updates** — Bulk find-replace
   - Find: `Ledgera` in .md files
   - Replace: `Revive`
   - ~100+ occurrences

---

### ⚠️ Requires Manual Review

1. **OAuth configuration** — Must update Google Console first
2. **localStorage keys** — Decide on migration strategy
3. **Email addresses** — Decide if admin@ and support@ change
4. **Database names** — Review dev database names
5. **Package groupId** — Decide if `com.ledgera` or `com.revive`
6. **Component names** — Decide if `LedgeraSpinner` → `ReviveSpinner`

---

### ❌ Cannot Be Changed

1. **Flyway migrations** (V1-V9) — Never modify after deployment
2. **Historical git commits** — Preserve history
3. **Phase 1 documentation** — Keep as migration context

---

## Recommended Migration Order

### Phase 1: Preparation (No User Impact)

1. ✅ **Update Google OAuth Console**
   - Add new redirect URI: `https://revive-backend.onrender.com/...`
   - Keep old URI active

2. ✅ **Create new Render.com service** (parallel deployment)
   - Deploy `revive-backend` alongside `ledgera-backend`
   - Test OAuth flow with new service
   - Verify database connectivity

3. ✅ **Update documentation**
   - README.md
   - SECURITY.md
   - CHANGELOG.md

---

### Phase 2: Backend Migration (Coordinated Cutover)

1. ✅ **Update configuration files**
   - `application.properties` (app name, property namespaces)
   - `pom.xml` (artifact names)
   - `docker-compose.dev.yml` (container/volume names)

2. ⚠️ **Rename Java packages** (optional, high risk)
   - Use IDE refactor: `com.ledgera` → `com.revive`
   - Run full test suite
   - Verify no broken imports

3. ✅ **Update environment variables**
   - Change `LEDGERA_SEED_ADMIN` → `REVIVE_SEED_ADMIN`
   - Update in Render.com dashboard
   - Update in local `.env` files

4. ✅ **Update email templates**
   - Change subject lines in EmailService.java
   - Update RESEND_FROM_NAME default value

5. ✅ **Update Dockerfile**
   - Change comments
   - Update JAR filename pattern (if artifact changed)

---

### Phase 3: Frontend Migration (User-Facing)

1. ✅ **Update branding**
   - `appInfo.ts` (APP_NAME)
   - All UI text (find-replace "Ledgera" → "Revive")
   - Email subject lines visible to users

2. ⚠️ **Update localStorage keys** (breaking change)
   - Option A: Add migration logic
   - Option B: Accept user logout
   - Affected: `authStore.ts`, `ThemeContext.tsx`

3. ✅ **Update PWA manifest**
   - `site.webmanifest` (name, description)
   - `index.html` (meta tags, title)

4. ✅ **Update API URLs**
   - `.env.example`
   - `.env.production`
   - Verify CORS settings

5. ✅ **Update package.json**
   - Change name: `ledgera-frontend` → `revive-frontend`
   - Regenerate package-lock.json

---

### Phase 4: Deployment Cutover (Scheduled Downtime)

1. ✅ **Deploy new backend**
   - Update `render.yaml`
   - Deploy `revive-backend`
   - Verify health endpoint

2. ✅ **Deploy new frontend**
   - Update environment variables
   - Deploy to Vercel/hosting
   - Verify API connectivity

3. ✅ **Update DNS** (if using custom domain)
   - Point domain to new backend
   - Update CORS whitelist

4. ✅ **Test OAuth flow**
   - Verify Google OAuth works
   - Verify workspace invitations work

---

### Phase 5: Cleanup (Post-Cutover)

1. ✅ **Remove old OAuth redirect URI** from Google Console
2. ✅ **Delete old Render service** (if parallel deployment used)
3. ✅ **Update GitHub repo** (rename if desired)
4. ✅ **Announce migration** to users

---

## Breaking Changes Summary

### User-Facing

| Change | Impact | Mitigation |
|--------|--------|------------|
| **Backend URL change** | API calls will fail | Update frontend env vars |
| **localStorage keys** | Users logged out | Add migration or announce |
| **OAuth redirect** | Login broken | Update Google Console first |
| **Email subject lines** | User confusion | Announce rebrand |

### Developer-Facing

| Change | Impact | Mitigation |
|--------|--------|------------|
| **Package rename** | Import statements break | Use IDE refactor |
| **Artifact name** | JAR filename changes | Update Docker/CI |
| **Environment variables** | App won't start | Update .env files |
| **Docker names** | Containers won't start | Recreate containers |

---

## Risk Assessment

### Low Risk (Can proceed immediately)

- ✅ Documentation updates
- ✅ UI text changes
- ✅ Email subject lines
- ✅ PWA manifest
- ✅ Comments in code

### Medium Risk (Test thoroughly)

- ⚠️ Application properties
- ⚠️ Environment variable names
- ⚠️ Maven artifact names
- ⚠️ Docker configuration
- ⚠️ localStorage keys

### High Risk (Requires coordination)

- 🔴 OAuth redirect URIs
- 🔴 Backend service URL
- 🔴 API endpoint changes
- 🔴 Java package rename

---

## Preservation Requirements

### Must NOT Change

1. ✅ **Flyway migrations** (V1-V9)
   - Reason: Already applied to production
   - Risk: Database corruption

2. ✅ **Git history**
   - Reason: Preserve audit trail
   - Action: Keep commits as-is

3. ✅ **Phase 1 documentation**
   - Reason: Migration context
   - Action: Preserve "Ledgera" mentions

### Should Temporarily Keep

1. ⚠️ **Old OAuth redirect URI**
   - Until cutover complete
   - Remove after verification

2. ⚠️ **Package name `com.ledgera`** (optional)
   - Reduces technical risk
   - Can rename later if needed

---

## Technical Debt Created

If package rename (`com.ledgera` → `com.revive`) is **skipped**:

1. **Package name mismatch**
   - Code says "ledgera"
   - Product is "Revive"
   - Confusing for new developers

2. **Maven coordinates mismatch**
   - GroupId: `com.ledgera`
   - Artifact: `revive-backend`
   - Inconsistent

**Recommendation:** Rename packages during migration OR accept technical debt with clear documentation.

---

## Final Recommendations

### Minimum Viable Migration

**Change only critical items:**
1. Application name in `application.properties`
2. OAuth redirect URIs (Google Console + config)
3. Backend service name (render.yaml)
4. Frontend API URLs
5. UI branding text
6. Documentation

**Keep:**
- Java package names (`com.ledgera`)
- Maven groupId (`com.ledgera`)
- localStorage keys (avoid user logout)
- Docker dev names (avoid recreation)

**Result:** Minimal risk, some technical debt

---

### Complete Migration

**Change everything:**
1. All items in Minimum Viable Migration
2. Java packages (`com.ledgera` → `com.revive`)
3. Maven coordinates (groupId + artifactId)
4. localStorage keys (with migration logic)
5. Docker dev configuration
6. All documentation references

**Result:** Clean break, higher risk, no technical debt

---

## Conclusion

**Total Ledgera References:** ~350+  
**Critical Changes:** 6  
**High Priority Changes:** 15  
**Can Be Automated:** ~200  
**Require Manual Review:** ~50  
**Cannot Be Changed:** 10+  

**Recommended Approach:** **Phased migration** starting with critical OAuth/URL changes, followed by branding updates, with optional package rename as separate phase.

**Estimated Migration Time:**
- Preparation: 2 hours
- Backend migration: 4 hours
- Frontend migration: 3 hours
- Testing: 4 hours
- Deployment: 2 hours
- **Total:** ~15 hours for complete migration

---

**End of Audit Report**

*This audit was performed READ-ONLY. No files were modified.*
