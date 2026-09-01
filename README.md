<p align="center">
  <img src="public/icon.svg" alt="Ledgera Logo" width="170">
</p>

<p align="center">
  <a href="https://ledgera-finance-system.vercel.app"><img src="https://img.shields.io/badge/Demo-Live-success?style=for-the-badge" alt="Live Demo"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License"/></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/Version-1.1.0-orange.svg?style=for-the-badge" alt="Version"/></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?style=for-the-badge" alt="Contributions"/></a>
</p>

<div align="center">
  
  [![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4.10-646CFF.svg)](https://vite.dev/)
  [![TanStack Query](https://img.shields.io/badge/TanStack%20Query-5.60-FF4154.svg)](https://tanstack.com/query)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
  [![pgvector](https://img.shields.io/badge/pgvector-0.1.4-4169E1.svg)](https://github.com/pgvector/pgvector)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-38B2AC.svg)](https://tailwindcss.com/)
  
</div>

# Ledgera – AI-Powered Full-Stack Finance Tracking Platform

Ledgera is a production-grade, AI-powered collaborative finance platform built for teams and enterprises. It combines cutting-edge AI capabilities (Groq + Gemini 3.6 + RAG with pgvector), multi-workspace collaboration, comprehensive analytics, and enterprise-level security into a modern SaaS application.

**Key Highlights:**
- 🤖 **Advanced AI Architecture** - Groq AI (Llama 3.3 70B), Gemini 3.6 Flash (OCR), AI Agent with tool-calling (7 tools), RAG-powered financial advisor with local embeddings (all-MiniLM-L6-v2)
- 🧠 **RAG Financial Advisor + AI Agent** - PostgreSQL pgvector semantic search + context-aware investment advice + autonomous agent with 7 tools (4 read + 3 write with RBAC)
- 🔐 **Enterprise Security** - Google OAuth 2.0, JWT authentication, Bucket4j rate limiting, RBAC, admin platform
- 👥 **Multi-Workspace Collaboration** - Team management with granular permissions (Owner/Editor/Viewer)
- 📊 **Real-Time Analytics** - Interactive dashboards with TanStack Query, Recharts visualization, category breakdowns
- ☁️ **Cloud Infrastructure** - Cloudinary CDN, Neon PostgreSQL with pgvector extension, Resend email API
- 🎨 **Modern UX** - Responsive design, glassmorphic UI with Radix UI + Tailwind CSS 4.x, system theme detection

---

## Features

## Features

### 🤖 AI-Powered Features (Advanced Architecture)
- **Smart Transaction Categorization** - AI automatically suggests categories and transaction types with confidence scoring (powered by Groq AI - Llama 3.3 70B Versatile @ 280 tokens/sec)
- **Receipt OCR & Auto-Entry** - Upload receipt photos and extract amount, merchant, date, category, and type automatically (powered by Gemini 3.6 Flash with enhanced accuracy)
- **Cloudinary Cloud Storage** - Enterprise-grade receipt image storage with CDN delivery, automatic optimization, global edge caching, and 25GB free tier
- **AI Financial Insights** - Get personalized spending analysis, budget recommendations, savings rate tracking, and trend analysis (powered by Groq AI with ~0.95s time-to-first-token)
- **AI Agent with Tool-Calling** - Autonomous AI agent loop using Groq Llama 3.3 70B with 7 registered tools:
  - `get_transactions` - Query and filter financial records
  - `get_spending_summary` - Analyze spending by category
  - `search_records` - Full-text search across transactions
  - `get_monthly_trends` - Track income/expense trends over time
  - `create_transaction` - Create new transactions (requires user confirmation)
  - `update_transaction` - Update existing transactions (requires user confirmation)
  - `delete_transaction` - Delete transactions permanently (requires user confirmation)
  - Write-confirmation flow with TTL pending action store for secure transaction operations
  - Multi-step reasoning and autonomous tool orchestration
  - RBAC-based tool filtering (Viewers get 4 read tools, Editors/Owners get all 7)
  - Gemini Tool-Calling Service as an alternative AI agent provider (function-calling API)
- **RAG Financial Advisor** - Advanced AI advisor using Retrieval-Augmented Generation:
  - Local sentence transformers for embeddings (all-MiniLM-L6-v2, 384 dimensions) via Deep Java Library (DJL) 0.28.0
  - PostgreSQL pgvector 0.1.4 for semantic vector search
  - Context-aware investment advice based on your actual financial records
  - Portfolio recommendations, tax strategies, wealth-building guidance
  - Session-based conversations with memory and semantic retrieval
  - Tabbed UI with AI Advisor + AI Agent on same page
- **Hybrid Provider Strategy** - Optimal quota management using Groq (text), Gemini 3.6 (vision), and local models (embeddings)
- Real-time AI suggestions with sub-second response times (average ~0.5s)
- Multimodal AI processing for text and image analysis
- Automatic model fallback for resilience and quota management

### Authentication & Security
- JWT-based stateless authentication and authorization
- **Google OAuth 2.0 social login** (Continue with Google - seamless integration)
- Dual authentication strategy (Email+Password OR Google Sign-In)
- OTP-based password reset flow with email integration (Resend API v3.0.0)
- Rate limiting with Bucket4j (3 OTP requests per 15 minutes, configurable per-endpoint)
- Multi-level role-based access control (RBAC):
  - Platform roles: Admin, Analyst, Viewer
  - Workspace permissions: Owner, Editor, Viewer
- Method-level security with Spring Security annotations
- Secure token management with configurable expiry (24h default)
- Protected routes and API endpoints
- BCrypt password hashing
- CORS configuration for production and development
- Session management: Stateless (JWT only)

### Workspace Management
- Multi-workspace support for unlimited team collaboration
- Workspace-scoped financial records and analytics with complete data isolation
- Three granular permission levels:
  - **Owner:** Full control, member management, workspace deletion
  - **Editor:** Create/edit/delete records, full data access
  - **Viewer:** Read-only access to all workspace data
- Workspace member management with email invitations
- Permission inheritance (workspace permissions control record access)
- Automatic workspace switching with query invalidation
- Workspace deletion with safety validations
- Member removal and permission updates (Owner only)
- Real-time workspace synchronization

### Financial Management
- Income and expense tracking with custom categories
- Advanced filtering and search capabilities
- Workspace-scoped transaction management
- Permission-based record creation/editing
- Transaction history with user attribution
- Real-time data synchronization

### Analytics & Visualization
- Interactive dashboard with real-time analytics powered by TanStack Query
- Monthly cash flow trends (area charts with gradient fills)
- Category-wise spending breakdown (horizontal bar charts)
- Income vs expense comparisons with period-over-period analysis
- Recent activity feed with user attribution
- Workspace-specific analytics with automatic filtering
- Custom chart tooltips with formatted currency
- Responsive chart design for mobile and desktop
- Export-ready data visualization

### Admin Platform Management
- Dedicated admin panel for platform-wide user administration
- User activation/deactivation controls with confirmation modals
- Advanced search and filtering:
  - Search by name or email
  - Filter by status (active/inactive)
  - Sort by name, email, role, created date
  - Pagination (15 users per page, configurable)
- View user workspace associations and membership details
- Prevent self-deactivation safeguards
- Professional admin UX with:
  - Current user highlighting
  - Confirmation modals for destructive actions
  - Real-time status updates
  - Workspace count display
- Admin account management (promote users, merge accounts)

### UI/UX Features
- System theme detection (Light/Dark/System)
- Responsive design for mobile and desktop
- Modern glassmorphic UI components
- Smooth animations and transitions
- Toast notifications for user feedback
- Accessible components (WCAG considerations)

### Architecture
- RESTful API with Spring Boot
- Layered architecture (Controller → Service → Repository)
- Database migrations with Flyway
- Comprehensive error handling with user-friendly messages
- Detailed logging and monitoring
- Workspace context management  

---

## Why Ledgera?

Ledgera demonstrates production-grade full-stack development with cutting-edge AI integration:

- **Hybrid AI Architecture** — Optimal quota management using Groq (Llama 3.3 70B @ 280 tokens/sec) + Gemini 3.6 Flash (enhanced OCR) with intelligent provider selection
- **Dual AI Agent Providers** — Groq-based and Gemini Function-Calling implementations for flexible tool orchestration
- **RAG Financial Advisor** — PostgreSQL pgvector + local embeddings (DJL 0.28.0) for semantic search & context-aware advice
- **Enterprise Architecture** — Layered backend design with clear separation of concerns (Controller → Service → Repository)
- **Multi-Tenancy** — Workspace-based architecture with complete data isolation for seamless team collaboration
- **Security First** — Google OAuth 2.0, JWT authentication (JJWT 0.12.5), RBAC, workspace permissions, Bucket4j rate limiting
- **Modern Stack** — Spring Boot 3.2.5, React 18.3.1, TypeScript 5.7.3, PostgreSQL 15+, Vite 5.4.10, TanStack Query 5.60
- **AI-Powered** — Smart categorization (~0.5s response), receipt OCR (Gemini 3.6), financial insights, RAG advisor, autonomous agent
- **Email Integration** — Professional OTP-based password reset flow with Resend API v3.0.0
- **Scalable Design** — RESTful API, Flyway migrations, comprehensive error handling, Docker containerization
- **Admin Platform** — Dedicated admin panel for platform-wide user management with search & filtering
- **Modern UX** — System theme detection, responsive design, accessible components (Radix UI), glassmorphic UI (Tailwind CSS 4.2)
- **Cloud-Native** — Cloudinary CDN (25GB free), serverless PostgreSQL (Neon), Vercel edge deployment, Render containerized backend
- **Developer Experience** — Hot reload (Vite), TypeScript strict mode, ESLint, detailed logging, API documentation, comprehensive scripts

Built to reflect production-level design practices used in modern AI-powered SaaS applications.

---

## Tech Stack

### Backend
- **Language:** Java 17+
- **Framework:** Spring Boot 3.2.5 (2024 stable release)
- **AI Integration:** 
  - **Groq AI** - Text categorization, insights, and AI Agent (Llama 3.3 70B Versatile @ 280 tokens/sec)
  - **Gemini 3.6 Flash** - Receipt OCR, image understanding, and tool-calling (12% faster, superior document processing)
  - **Deep Java Library (DJL) 0.28.0** - Local embeddings (sentence-transformers/all-MiniLM-L6-v2, 384 dimensions)
- **Vector Database:** PostgreSQL 15+ with pgvector 0.1.4 extension for semantic search
- **Cloud Storage:** Cloudinary 1.38.0 (Image CDN & Storage with 25GB free tier)
- **Authentication:** 
  - JWT (JJWT 0.12.5) - Stateless token-based authentication
  - Google OAuth 2.0 (Spring OAuth2 Client) - Social login integration
- **Security:** Spring Security 6.x with JWT + OAuth2 + RBAC
- **Database:** Spring Data JPA + Hibernate, Flyway migrations for version control
- **Email:** Resend API v3.0.0 (Transactional email with 99.9% deliverability SLA)
- **Rate Limiting:** Bucket4j v8.7.0 (Token bucket algorithm for API throttling)
- **Build Tool:** Maven 3.9+ with Maven Wrapper
- **HTTP Client:** Apache HttpClient5 v5.3.1

### Frontend
- **Framework:** React 18.3.1 with TypeScript 5.7.3
- **Build Tool:** Vite 5.4.10 (Next-gen frontend tooling with HMR)
- **Routing:** React Router v6.28.0 (Client-side routing with lazy loading)
- **HTTP Client:** Axios 1.7.7 (Centralized API client with interceptors)
- **Data Fetching:** TanStack Query v5.60.0 (Server state management with caching)
- **Charts:** Recharts 3.10.0 (Responsive charting library for dashboards)
- **UI Components:** Radix UI primitives + Tailwind CSS 4.2.0 (Accessible, customizable components)
- **Forms:** React Hook Form 7.54.1 + Zod 3.24.1 (Type-safe validation with schema)
- **Notifications:** Sonner 1.7.1 (Toast notifications with queuing)
- **Icons:** Lucide React 0.564.0 (Modern icon library with tree-shaking)
- **Markdown:** React Markdown 10.1.0 (For AI chat responses)
- **Animations:** Embla Carousel 8.6.0 (For landing page features)

### Database
- **Production:** PostgreSQL 15+ with pgvector extension (Neon serverless with auto-suspend)
- **Development:** PostgreSQL via Docker Compose or H2 in-memory database (optional profile)
- **Migrations:** Flyway (version-controlled schema management with rollback support)
- **Connection Pooling:** HikariCP (default Spring Boot connection pool)
- **Vector Extension:** pgvector 0.1.4 for similarity search and RAG capabilities

### DevOps & Infrastructure
- **Backend Hosting:** Render (Docker containerization with auto-scaling)
- **Frontend Hosting:** Vercel (Edge network deployment with CDN)
- **Database Hosting:** Neon (Serverless PostgreSQL with auto-suspend)
- **Email Service:** Resend (99.9% deliverability SLA)
- **CDN:** Cloudinary (Global edge caching for images)
- **Version Control:** Git + GitHub (with GitHub Actions CI/CD ready)
- **Container:** Docker with multi-stage builds (production-optimized)
- **Environment Management:** Dotenv for local development, platform env vars for production

## Repository Structure

```text
ledgera/
├─ backend/                           # Spring Boot API
│  ├─ src/main/java/com/ledgera/
│  │  ├─ config/                      # Configuration classes
│  │  │  ├─ DataInitializer.java     # Seed data
│  │  │  ├─ EmailConfig.java         # Resend email client
│  │  │  ├─ RateLimitConfig.java     # Rate limiting
│  │  │  └─ SecurityConfig.java      # Spring Security
│  │  ├─ controller/                  # REST controllers
│  │  │  ├─ AdminUserController.java
│  │  │  ├─ AgentController.java      # AI Agent endpoints
│  │  │  ├─ AiController.java         # AI categorization/OCR
│  │  │  ├─ AuthController.java
│  │  │  ├─ DashboardController.java
│  │  │  ├─ FinancialAdvisorController.java  # RAG advisor
│  │  │  ├─ FinancialRecordController.java
│  │  │  ├─ HealthController.java
│  │  │  ├─ OtpController.java
│  │  │  ├─ UserController.java
│  │  │  ├─ WorkspaceController.java
│  │  │  └─ WorkspaceMemberController.java
│  │  ├─ dto/                         # Data Transfer Objects
│  │  │  ├─ AdvisorChatRequest.java
│  │  │  ├─ AdvisorChatResponse.java
│  │  │  ├─ AgentRequest.java
│  │  │  ├─ AgentResponse.java
│  │  │  ├─ AiCategorizationRequest.java
│  │  │  ├─ AiCategorizationResponse.java
│  │  │  ├─ ConfirmActionRequest.java
│  │  │  ├─ PendingAction.java
│  │  │  └─ ... (other DTOs)
│  │  ├─ entity/                      # JPA entities
│  │  │  ├─ FinancialRecord.java
│  │  │  ├─ User.java
│  │  │  ├─ Workspace.java
│  │  │  ├─ WorkspaceInvitation.java
│  │  │  └─ WorkspaceMember.java
│  │  ├─ enums/                       # Enumerations
│  │  │  ├─ Role.java
│  │  │  ├─ TransactionType.java
│  │  │  └─ WorkspacePermission.java
│  │  ├─ exception/                   # Exception handling
│  │  │  └─ GlobalExceptionHandler.java
│  │  ├─ repository/                  # Data access layer
│  │  │  ├─ FinancialRecordRepository.java
│  │  │  ├─ FinancialRecordSpecification.java
│  │  │  ├─ UserRepository.java
│  │  │  ├─ WorkspaceRepository.java
│  │  │  ├─ WorkspaceInvitationRepository.java
│  │  │  └─ WorkspaceMemberRepository.java
│  │  ├─ security/                    # Security components
│  │  │  ├─ CustomUserDetailsService.java
│  │  │  ├─ JwtAuthenticationFilter.java
│  │  │  ├─ JwtTokenProvider.java
│  │  │  ├─ RequireWorkspacePermission.java
│  │  │  ├─ WorkspaceContextHolder.java
│  │  │  └─ WorkspacePermissionEvaluator.java
│  │  ├─ service/                     # Business logic
│  │     ├─ AdminUserService.java
│  │     ├─ AgentOrchestrationService.java    # Agent loop
│  │     ├─ AgentToolRegistry.java            # Tool registration
│  │     ├─ AgentToolExecutorService.java     # Tool execution
│  │     ├─ AiModelFallbackService.java       # Provider fallback
│  │     ├─ PendingActionStore.java           # Confirmation store
│  │     ├─ AuthService.java
│  │     ├─ CloudinaryService.java            # Image storage
│  │     ├─ CurrentUserService.java
│  │     ├─ DashboardService.java
│  │     ├─ EmailService.java
│  │     ├─ EmbeddingService.java             # RAG embeddings
│  │     ├─ FinancialAdvisorService.java      # RAG advisor
│  │     ├─ FinancialRecordService.java
│  │     ├─ GeminiAiService.java              # Gemini integration
│  │     ├─ GeminiToolCallingService.java     # Gemini agent provider
│  │     ├─ GroqAiService.java                # Groq integration
│  │     ├─ OtpService.java                   # OTP management
│  │     ├─ UserService.java
│  │     ├─ VectorSearchService.java          # Semantic search
│  │     ├─ WorkspaceService.java
│  │     └─ WorkspaceMemberService.java
│  ├─ src/main/resources/
│  │  ├─ application.properties       # Main config
│  │  ├─ application-h2.properties    # H2 profile
│  │  └─ db/migration/                # Flyway migrations
│  │     ├─ V1__init.sql
│  │     ├─ V2__backfill_financial_record_users.sql
│  │     ├─ V3__add_workspaces.sql
│  │     ├─ V4__add_otp_fields.sql
│  │     ├─ V5__update_workspace_names_to_first_name.sql
│  │     └─ V6__ensure_workspace_owners_are_members.sql
│  ├─ .env                            # Environment variables
│  ├─ .env.example                    # Environment template
│  ├─ Dockerfile                      # Docker configuration
│  ├─ docker-compose.yml              # Docker Compose
│  ├─ Dockerfile                      # Development Dockerfile
│  ├─ Dockerfile.prod                 # Production Dockerfile
│  ├─ keep-neon-awake.cmd             # Neon database keep-alive (Windows)
│  ├─ keep-neon-awake.ps1             # Neon database keep-alive (PowerShell)
│  ├─ Makefile                        # Build automation
│  ├─ neon-setup.sql                  # Neon database setup script
│  ├─ render-start.sh                 # Render deployment startup script
│  ├─ start-dev-db.cmd                # Start local dev database (Windows)
│  ├─ test-resend-api.sh              # Test Resend email API
│  ├─ validate-gemini-key.ps1         # Validate Gemini API key (PowerShell)
│  ├─ validate-gemini-key.sh          # Validate Gemini API key (Bash)
│  ├─ verify_and_fix_admin.sql        # Admin account verification script
│  └─ pom.xml                         # Maven dependencies
│
├─ frontend/                          # React + Vite SPA
│  ├─ src/
│  │  ├─ api/                         # API client
│  │  │  ├─ adminApi.ts
│  │  │  ├─ advisorApi.ts             # RAG advisor
│  │  │  ├─ agentApi.ts               # AI Agent
│  │  │  ├─ aiApi.ts                  # AI categorization/OCR
│  │  │  ├─ authApi.ts
│  │  │  ├─ client.ts
│  │  │  ├─ dashboardApi.ts
│  │  │  ├─ recordsApi.ts
│  │  │  ├─ usersApi.ts
│  │  │  ├─ workspaceApi.ts
│  │  │  └─ workspaceMemberApi.ts
│  │  ├─ components/                  # React components
│  │  │  ├─ advisor/                  # RAG advisor UI
│  │  │  │  ├─ AdvisorChat.tsx
│  │  │  │  ├─ AgentChat.tsx          # AI Agent UI
│  │  │  │  ├─ AgentConfirmModal.tsx  # Confirmation modal
│  │  │  │  └─ FinancialInsights.tsx
│  │  │  ├─ auth/                     # Auth components
│  │  │  ├─ backend/                  # Backend status
│  │  │  ├─ dashboard/                # Dashboard widgets
│  │  │  ├─ landing/                  # Landing page
│  │  │  ├─ layout/                   # Layout components
│  │  │  ├─ records/                  # Record components
│  │  │  ├─ workspace/                # Workspace components
│  │  │  └─ ui/                       # UI primitives
│  │  ├─ config/                      # Configuration
│  │  │  └─ brandAssets.ts            # Logo & branding
│  │  ├─ contexts/                    # React contexts
│  │  │  ├─ AuthContext.tsx
│  │  │  ├─ SidebarContext.tsx
│  │  │  ├─ ThemeContext.tsx
│  │  │  └─ WorkspaceContext.tsx
│  │  ├─ hooks/                       # Custom hooks
│  │  ├─ pages/                       # Page components
│  │  │  ├─ admin/                    # Admin pages
│  │  │  ├─ advisor/                  # AI Advisor page
│  │  │  │  └─ index.tsx              # Tabbed UI (Advisor + Agent)
│  │  │  ├─ auth/                     # Auth pages
│  │  │  ├─ dashboard/                # Dashboard page
│  │  │  ├─ records/                  # Records page
│  │  │  ├─ workspace/                # Workspace pages
│  │  │  └─ LandingPage.tsx
│  │  ├─ store/                       # State management
│  │  ├─ types/                       # TypeScript types
│  │  ├─ utils/                       # Utility functions
│  │  ├─ App.tsx                      # Root component
│  │  └─ main.tsx                     # Entry point
│  ├─ public/
│  │  ├─ icon.svg                     # App logo (SVG)
│  │  ├─ icon.png                     # App logo (PNG)
│  │  └─ site.webmanifest             # PWA manifest
│  ├─ .env                            # Environment variables
│  ├─ .env.example                    # Environment template
│  ├─ index.html                      # HTML template
│  ├─ package.json                    # Dependencies
│  ├─ tsconfig.json                   # TypeScript config
│  ├─ vite.config.ts                  # Vite config
│  └─ vercel.json                     # Vercel config
│
├─ public/                            # Shared assets
│  ├─ icon.svg                        # Ledgera logo
│  ├─ icon.png                        # Ledgera logo (PNG)
│  └─ site.webmanifest                # PWA manifest
│
├─ .gitignore                         # Git ignore rules
└─ README.md                          # This file
```

## Environment Configuration

### Backend Environment Variables

Create a `backend/.env` file with the following variables:

```env
# Database Configuration
DB_URL=jdbc:postgresql://your-db-host/your-database?sslmode=require
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secret-key-at-least-256-bits-long-change-this-in-production
JWT_EXPIRATION=86400000

# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_from_console_cloud_google_com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
APP_OAUTH2_REDIRECT_URI=http://localhost:5173/auth/callback

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key_from_resend_com
RESEND_FROM_EMAIL=your-verified-email@yourdomain.com
RESEND_FROM_NAME=Ledgera

# AI Configuration (Hybrid Provider Setup)
# Gemini 3.6 Flash - For receipt OCR/image understanding (superior document processing, 12% faster)
GEMINI_API_KEY=your_gemini_api_key_from_aistudio_google_com
GEMINI_MODEL=gemini-3.6-flash
GEMINI_VISION_PRIMARY=gemini-3.6-flash
GEMINI_TEXT_PRIMARY=gemini-3.5-flash-lite

# Groq - For categorization, insights & agent (280 tokens/sec, ~0.95s time-to-first-token)
GROQ_API_KEY=your_groq_api_key_from_console_groq_com
GROQ_MODEL=llama-3.3-70b-versatile

# AI Rate Limits
AI_MAX_CATEGORIZATION_REQUESTS_PER_DAY=100
AI_MAX_RECEIPT_UPLOADS_PER_DAY=20
AI_RETRY_ATTEMPTS=3
AI_RETRY_DELAY_MS=1000

# Cloudinary Configuration (Image Storage & CDN)
CLOUDINARY_CLOUD_NAME=your_cloud_name_from_cloudinary_dashboard
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Application Configuration
APP_BASE_URL=http://localhost:5173
SPRING_PROFILES_ACTIVE=dev

# Admin Seed Data (Optional - creates default admin user)
LEDGERA_SEED_ADMIN=true

# Embeddings Configuration (Optional - set to true to disable on low-memory systems)
DISABLE_EMBEDDINGS=false
```

**Note:** Use `backend/.env.example` as a reference template.

**Environment Variable Details:**

- **DB_URL**: PostgreSQL connection string with SSL mode
- **JWT_SECRET**: Strong secret key for JWT signing (min 256 bits)
- **JWT_EXPIRATION**: Token expiry in milliseconds (default: 24 hours)
- **GOOGLE_CLIENT_ID/SECRET**: OAuth 2.0 credentials from Google Cloud Console
- **RESEND_API_KEY**: Email API key from Resend dashboard
- **GEMINI_API_KEY**: Get from [Google AI Studio](https://aistudio.google.com/apikey)
- **GROQ_API_KEY**: Get from [Groq Console](https://console.groq.com)
- **CLOUDINARY_***: Cloud storage credentials from Cloudinary dashboard
- **SPRING_PROFILES_ACTIVE**: Set to `prod` for production, `dev` for development, `h2` for H2 database
- **DISABLE_EMBEDDINGS**: Set to `true` on systems with <2GB RAM to disable local embedding models

**Important:** To ensure proper character encoding (₹ rupee symbol, etc.), the project includes UTF-8 configuration in `pom.xml`:
```xml
<properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

### Frontend Environment Variables

The frontend uses a centralized API client for all backend requests. See [frontend/API_CONFIGURATION.md](frontend/API_CONFIGURATION.md) for detailed documentation.

**Development (`.env.local`):**
```env
# Uses Vite proxy to avoid CORS issues
VITE_API_BASE_URL=/api
```

**Production (`.env` and `.env.production`):**
```env
# Direct backend URL
VITE_API_BASE_URL=https://ledgera-backend.onrender.com/api
```

**Key Features:**
- ✅ Centralized Axios client with automatic authentication
- ✅ Consistent error handling across all API calls
- ✅ Environment-based configuration (dev/prod)
- ✅ No hardcoded URLs or direct fetch calls
- ✅ 30-second timeout for all requests
- ✅ Automatic 401 handling with redirect to login

For production deployments:
- Set `VITE_API_BASE_URL` to your backend URL in your hosting platform
- All API calls automatically use this centralized configuration

## Local Development

### Prerequisites

- **Java 17+** (JDK - OpenJDK or Oracle JDK)
- **Maven 3.9+** (included via Maven Wrapper - `./mvnw` or `mvnw.cmd`)
- **Node.js 18+** (frontend includes `.nvmrc` with version `18`)
- **npm 9+** or **yarn 1.22+**
- **PostgreSQL 15+** (or use Docker Compose for local development)
- **Docker Desktop** (optional, for containerized development)
- **Git** (version control)

### Clone the Repository

```bash
git clone https://github.com/yourusername/ledgera.git
cd ledgera
```

### Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add database credentials, JWT secret, Resend API key, AI API keys, etc.

# Run the application
./mvnw spring-boot:run

# On Windows
mvnw.cmd spring-boot:run
```

Backend runs on: **http://localhost:8080**

**Optional:** Use H2 in-memory database for testing:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2

# On Windows
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2
```

**Utility Scripts:**

```bash
# Start local PostgreSQL database with Docker Compose (Windows)
start-dev-db.cmd

# Keep Neon database active (prevents auto-suspend)
keep-neon-awake.cmd       # Windows Command Prompt
keep-neon-awake.ps1       # Windows PowerShell

# Validate AI API keys
validate-gemini-key.sh    # Linux/Mac
validate-gemini-key.ps1   # Windows PowerShell

# Test email service
test-resend-api.sh        # Linux/Mac

# Database maintenance
check-db-state.sql              # Check database state
verify_and_fix_admin.sql        # Verify admin account
cleanup-insights.sql            # Clean up AI insights
cleanup-duplicate-insights.sql  # Remove duplicate insights
```

### Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template (if needed)
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:8080/healthz

### Default Admin Credentials

If data initialization is enabled:
- **Email:** rakinmohammedrafeeq@gmail.com
- **Password:** admin123

**Note:** On first login, a default workspace is automatically created for each user.

---

## Build Commands

### Backend Production Build

```bash
cd backend

# Clean and build JAR
./mvnw clean package

# On Windows
mvnw.cmd clean package

# Run the JAR
java -jar target/ledgera-*.jar

# Build Docker image
docker build -f Dockerfile.prod -t ledgera-backend:latest .

# Run with Docker Compose
docker-compose up -d
```

### Frontend Production Build

```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview

# Verify API configuration
npm run verify-api
```

---

## Available Scripts

### Backend

- `./mvnw spring-boot:run` — Start development server
- `./mvnw clean package` — Build production JAR
- `./mvnw clean package -DskipTests` — Build without running tests
- `./mvnw test` — Run all tests
- `./mvnw clean` — Clean build artifacts
- **Windows:** Use `mvnw.cmd` instead of `./mvnw`

### Frontend

- `npm run dev` — Start Vite dev server (http://localhost:5173)
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` — Run ESLint for code quality checks
- `npm run type-check` — TypeScript type checking
- `npm run verify-api` — Verify API configuration

### Docker Commands

```bash
# Start local PostgreSQL database for development
cd backend
docker-compose -f docker-compose.dev.yml up -d

# View database logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop database
docker-compose -f docker-compose.dev.yml down

# Production build with Docker
docker-compose up -d

# View production logs
docker-compose logs -f
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login (returns JWT)
- `POST /api/auth/request-otp` — Request OTP for password reset
- `POST /api/auth/verify-otp` — Verify OTP code
- `POST /api/auth/reset-password` — Reset password with OTP

### Users (`/api/users`)
- `GET /api/users/me` — Get current user profile
- `PUT /api/users/me` — Update current user profile

### Admin Users (`/api/admin/users`)
- `GET /api/admin/users` — List all users with pagination (Admin only)
- `PUT /api/admin/users/{id}/status` — Activate/deactivate user (Admin only)

### Workspaces (`/api/workspaces`)
- `GET /api/workspaces` — List user's workspaces
- `POST /api/workspaces` — Create new workspace
- `GET /api/workspaces/{id}` — Get workspace details
- `PUT /api/workspaces/{id}` — Update workspace (Owner only)
- `DELETE /api/workspaces/{id}` — Delete workspace (Owner only)
- `POST /api/workspaces/{id}/switch` — Switch to workspace

### Workspace Members (`/api/workspaces/{workspaceId}/members`)
- `GET /api/workspaces/{workspaceId}/members` — List workspace members
- `POST /api/workspaces/{workspaceId}/members/invite` — Invite member (Owner only)
- `PUT /api/workspaces/{workspaceId}/members/{memberId}` — Update member permission (Owner only)
- `DELETE /api/workspaces/{workspaceId}/members/{memberId}` — Remove member (Owner only)

### Financial Records (`/api/records`)
- `GET /api/records` — List records with filtering (workspace-scoped)
- `POST /api/records` — Create new record (Editor/Owner only)
- `GET /api/records/{id}` — Get record by ID
- `PUT /api/records/{id}` — Update record (Editor/Owner only)
- `DELETE /api/records/{id}` — Delete record (Editor/Owner only)

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` — Get dashboard analytics (workspace-scoped)

### AI Features (`/api/ai`)
- `POST /api/ai/categorize` — AI-powered transaction categorization
- `POST /api/ai/receipt` — Upload receipt for OCR and auto-extraction
- `GET /api/ai/insights` — Get AI-generated financial insights
- `POST /api/ai/agent` — AI agent tool-calling loop (query, analyze, create)
- `POST /api/ai/agent/confirm` — Confirm pending agent action
- `POST /api/ai/agent/cancel` — Cancel pending agent action
- `GET /api/ai/health` — Check AI service availability

### Financial Advisor (`/api/advisor`)
- `POST /api/advisor/chat` — Chat with RAG-powered financial advisor
- `POST /api/advisor/insights/generate` — Generate personalized insights
- `GET /api/advisor/insights` — Retrieve stored insights

### Health Check
- `GET /healthz` — Health check endpoint (unauthenticated)

## Deployment

### Render Deployment Configuration

The project includes a `render.yaml` Blueprint for one-click deployment:

```yaml
services:
  - type: web
    name: ledgera-backend
    runtime: java
    plan: starter
    buildCommand: ./mvnw clean package -DskipTests
    startCommand: chmod +x backend/render-start.sh && ./backend/render-start.sh
    healthCheckPath: /health
```

**Deployment Steps:**

1. **Create a new Web Service** on Render
2. **Connect your repository** (GitHub, GitLab, or Bitbucket)
3. **Import Blueprint** or configure manually:
   - Build Command: `cd backend && ./mvnw clean package -DskipTests`
   - Start Command: `java -jar backend/target/*.jar`
   - Health Check Path: `/health`
4. **Set environment variables** (see Backend Environment Variables section above)
5. **Deploy** and monitor logs for startup confirmation

### Vercel Deployment Configuration

The project includes `vercel.json` for proper SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Deployment Steps:**

1. **Import your repository** to Vercel (automatic GitHub integration)
2. **Configure build settings:**
   - Framework Preset: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Set environment variables:**
   - `VITE_API_BASE_URL` = Your backend URL (e.g., `https://your-backend.onrender.com/api`)
4. **Deploy** (automatic on git push)

**Custom Domain Setup:**
- Add your domain in Vercel dashboard
- Update DNS records
- SSL automatically provisioned

### Email Configuration (Resend)

1. **Sign up** at [resend.com](https://resend.com)
2. **Verify your domain** or use `onboarding@resend.dev` for testing
3. **Generate API key** and add to backend environment variables
4. **Configure email templates** in `EmailService.java`

### AI Configuration (Hybrid Provider Setup)

Ledgera uses a **hybrid AI provider strategy** for optimal quota management and cost efficiency:

#### Groq (Categorization, Insights & AI Agent)

1. **Sign up for free** at [https://console.groq.com](https://console.groq.com)
2. **Generate API key** from dashboard (Keys section)
3. **Add to backend `.env`**:
   ```env
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
4. **Free tier includes**: Very generous rate limits, 280 tokens/sec inference speed
5. **Features enabled**: 
   - Transaction categorization with confidence scoring
   - Financial insights generation
   - AI Agent with autonomous tool-calling loop
   - Multi-step reasoning and tool orchestration

#### Gemini 3.6 Flash (Receipt OCR & Tool-Calling)

1. **Get your free API key** at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Sign in** with your Google account
3. **Click "Create API Key"** and select your project (or create new one)
4. **Copy the API key** (starts with `AIza...`)
5. **Add to backend `.env`**:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-3.6-flash
   GEMINI_VISION_PRIMARY=gemini-3.6-flash
   GEMINI_TEXT_PRIMARY=gemini-3.5-flash-lite
   ```
6. **Free tier includes**: 15 requests/minute, 1500 requests/day, 1 million tokens/minute
7. **Features enabled**: 
   - Receipt OCR with enhanced document processing (12% faster than predecessor)
   - Image understanding and extraction
   - Alternative AI Agent provider with function-calling API
   - Structured output with JSON schema supportan Gemini 2.0)

**Why hybrid AI architecture?**
- **Groq** handles high-frequency text tasks (categorization @ 280 tokens/sec, insights with ~0.95s latency) with generous free quota
- **Gemini 3.6 Flash** handles occasional receipt uploads with superior OCR accuracy and document understanding
- **Local embeddings (DJL)** for RAG financial advisor - completely free, no API calls
- **Zero quota exhaustion** during demos or typical usage patterns

📚 **See [backend/AI_PROVIDER_ARCHITECTURE.md](backend/AI_PROVIDER_ARCHITECTURE.md) for detailed architecture documentation**

### Cloudinary Configuration (Image Storage)

1. **Sign up for free** at [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. **Get your credentials** from the dashboard:
   - Cloud Name
   - API Key
   - API Secret
3. **Add to backend `.env`**:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. **Free tier includes**: 25GB storage, 25GB bandwidth/month, unlimited transformations
5. **Features enabled**: Receipt image storage, CDN delivery, automatic optimization

### Database Setup (Neon)

1. **Create a PostgreSQL database** on [Neon](https://neon.tech)
2. **Copy connection string** to `DB_URL`
3. **Flyway migrations** run automatically on startup

## Screenshots

### Landing Page
Interactive showcase with animated statistics, feature highlights, and smooth transitions. Responsive design optimized for mobile and desktop.

### Dashboard
Real-time analytics with monthly trends, category breakdowns, and recent activity. Workspace-scoped data visualization with interactive charts (Recharts).

### Financial Records
Advanced filtering, search, and management of transactions. Permission-based access controls. Receipt images stored in Cloudinary CDN.

### AI Features
- **AI Agent**: Autonomous tool-calling loop with 6 registered tools for complex financial queries
- **RAG Financial Advisor**: Context-aware investment advice using pgvector semantic search
- **Smart Categorization**: AI-powered transaction categorization with confidence scoring
- **Receipt OCR**: Gemini 3.6 Flash powered image extraction

### Workspace Management
Create and manage multiple workspaces. Invite team members with granular permissions (Owner/Editor/Viewer). Real-time workspace switching.

### Admin Panel
Platform-wide user management with activation controls, search, filtering, and pagination. Professional admin UX with confirmation modals.

### Authentication
- Secure login and registration with email/password
- Google OAuth 2.0 social login
- OTP-based password reset flow with Resend email integration

### Theme System
Automatic system theme detection with manual Light/Dark/System mode selection. Persistent theme preference storage.

---

## Project Status & Roadmap

### Current Status: v1.1.0 (Production-Ready)

✅ **Completed Features:**
- Core financial management (CRUD operations)
- Multi-workspace collaboration with RBAC
- AI-powered categorization and insights
- Receipt OCR with Cloudinary storage
- RAG financial advisor with pgvector
- AI Agent with autonomous tool-calling
- Google OAuth 2.0 authentication
- OTP-based password reset
- Admin platform for user management
- Real-time analytics dashboard
- Rate limiting and security features
- Docker containerization
- Production deployment (Render + Vercel)

### Roadmap

**v1.2.0 - Enhanced Analytics** (Planned)
- [ ] Budget tracking and alerts
- [ ] Recurring transaction detection
- [ ] Export to CSV/Excel
- [ ] Custom report generation
- [ ] Data visualization improvements

**v1.3.0 - Advanced Collaboration** (Planned)
- [ ] Workspace activity feed
- [ ] Comment system for transactions
- [ ] Approval workflows for expenses
- [ ] Shared budget limits
- [ ] Team notifications

**v2.0.0 - Enterprise Features** (Future)
- [ ] Advanced audit logging
- [ ] SSO integration (SAML, LDAP)
- [ ] Custom roles and permissions
- [ ] API rate limiting per workspace
- [ ] White-label support
- [ ] Multi-currency support
- [ ] Bank integrations (Plaid, Yodlee)

---

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check Java version
java -version  # Should be 17+

# Check environment variables
cat backend/.env  # Linux/Mac
type backend\.env  # Windows

# Clean build and restart
cd backend
./mvnw clean package
./mvnw spring-boot:run
```

**Database connection errors:**
```bash
# Verify PostgreSQL is running (Docker)
docker-compose -f backend/docker-compose.dev.yml ps

# Check connection string format
# Should be: jdbc:postgresql://host:port/database?sslmode=require

# Test connection
psql -h your-host -U your-username -d your-database
```

**AI API errors:**
```bash
# Validate Gemini API key
cd backend
./validate-gemini-key.sh  # Linux/Mac
.\validate-gemini-key.ps1  # Windows PowerShell

# Check Groq API key in console.groq.com
# Verify rate limits haven't been exceeded
```

**Frontend build errors:**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json  # Linux/Mac
rmdir /s /q node_modules & del package-lock.json  # Windows
npm install

# Verify API configuration
npm run verify-api

# Check Node version
node --version  # Should be 18+
```

**Embedding service out of memory:**
```env
# Disable embeddings on low-memory systems
# Add to backend/.env:
DISABLE_EMBEDDINGS=true
```

**Email not sending:**
```bash
# Test Resend API
cd backend
./test-resend-api.sh

# Verify email address is verified in Resend dashboard
# Check RESEND_API_KEY is correct
```

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/rakinmohammedrafeeq/ledgera/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rakinmohammedrafeeq/ledgera/discussions)
- **Documentation:** See `CONTRIBUTING.md` and `SECURITY.md`
- **Email:** rakinmohammedrafeeq@gmail.com

---

## Performance Considerations

### Backend Optimization
- **Connection Pooling:** HikariCP with optimized pool size
- **Database Indexing:** All foreign keys and frequently queried columns indexed
- **Query Optimization:** JPA fetch strategies and pagination
- **Caching:** Consider adding Redis for session storage (future enhancement)

### Frontend Optimization
- **Code Splitting:** Vite automatic chunking and lazy loading
- **Image Optimization:** Cloudinary automatic format conversion and CDN
- **API Caching:** TanStack Query with configurable stale times
- **Bundle Size:** Tree-shaking and minification in production build

### AI Service Optimization
- **Provider Selection:** Groq for speed (280 tokens/sec), Gemini for accuracy
- **Local Embeddings:** No API calls for RAG, completely free
- **Rate Limiting:** Bucket4j prevents quota exhaustion
- **Error Handling:** Automatic retry with exponential backoff

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ledgera.git
   cd ledgera
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
4. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m 'Add some AmazingFeature'
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/AmazingFeature
   ```
6. **Open a Pull Request** on GitHub

### Contribution Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Update documentation for new features
- Add tests for new functionality
- Ensure all tests pass before submitting PR
- Update CHANGELOG.md with your changes

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## Technology Decisions

### Why Spring Boot?
- **Mature ecosystem** with extensive enterprise support
- **Convention over configuration** for rapid development
- **Production-ready features** (actuator, metrics, health checks)
- **Excellent JPA/Hibernate integration** for database operations
- **Strong security framework** with Spring Security

### Why React + TypeScript?
- **Type safety** prevents runtime errors and improves developer experience
- **Component reusability** and modern hooks-based architecture
- **Large ecosystem** with excellent third-party library support
- **Vite build tool** provides instant HMR and optimal production builds

### Why PostgreSQL with pgvector?
- **Robust ACID compliance** for financial data integrity
- **Vector extension** enables semantic search for RAG advisor
- **JSON support** for flexible schema evolution
- **Excellent performance** with proper indexing strategies
- **Free tier** available on Neon with generous limits

### Why Hybrid AI Architecture?
- **Cost efficiency** - Free tiers from multiple providers
- **Quota management** - Distribute load across providers
- **Optimal performance** - Use best model for each task
- **Resilience** - Automatic fallback if one provider fails
- **Local embeddings** - Zero-cost RAG implementation

### Why TanStack Query?
- **Automatic caching** reduces API calls and improves UX
- **Background refetching** keeps data fresh without user action
- **Optimistic updates** for instant UI feedback
- **Built-in retry logic** improves resilience
- **DevTools** for debugging and development

### Why Radix UI?
- **Accessibility first** with WCAG compliance built-in
- **Unstyled primitives** allow complete design freedom
- **Keyboard navigation** and screen reader support
- **Focus management** handles complex interactions
- **Tree-shakeable** for optimal bundle size

---

## License

This project is licensed under the [MIT License](LICENSE).

**Summary:**
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

See the [LICENSE](LICENSE) file for full details.

---

## Acknowledgments

### Technologies & Libraries
- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [React](https://reactjs.org/) - Frontend library
- [PostgreSQL](https://www.postgresql.org/) - Database
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
- [TanStack Query](https://tanstack.com/query) - Server state management
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Groq](https://groq.com/) - AI inference platform
- [Google Gemini](https://ai.google.dev/) - Multimodal AI
- [Cloudinary](https://cloudinary.com/) - Media management
- [Resend](https://resend.com/) - Email API
- [Vite](https://vitejs.dev/) - Build tool
- [Deep Java Library](https://djl.ai/) - ML framework for Java

### Inspiration
Built to demonstrate modern full-stack development with AI integration, following industry best practices for security, scalability, and user experience.

---

## Contact  

For questions, suggestions, or collaboration:

- **Email:** rakinmohammedrafeeq@gmail.com  
- **LinkedIn:** [linkedin.com/in/rakinmohammedrafeeq](https://www.linkedin.com/in/rakinmohammedrafeeq)  
- **GitHub:** [github.com/rakinmohammedrafeeq](https://github.com/rakinmohammedrafeeq)

---

## Support  

If you find this project useful:

- ⭐ Star the repository on GitHub
- Report issues or suggest features
- Contribute via pull requests
- ☕ Support my work:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rakinmohammedrafeeq)

---

<div align="center">
  <img src="public/icon.svg" alt="Ledgera Logo" width="60" height="60">
  
  Built with ❤️ by [Rakin Mohammed Rafeeq](https://github.com/rakinmohammedrafeeq)
</div>
