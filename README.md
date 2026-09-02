<p align="center">
  <img src="public/icon.svg" alt="Revive Logo" width="170">
</p>

# REVIVE

## AI Revenue Recovery

Revive detects revenue at risk, diagnoses what went wrong, evaluates recovery viability within configured guardrails, executes bounded recovery actions, measures outcomes, and maintains a complete audit trail.

<p align="center">
  <a href="https://revive-ops.vercel.app"><img src="https://img.shields.io/badge/Demo-Live-success?style=for-the-badge" alt="Live Demo"/></a>
  <a href="https://github.com/rakinmohammedrafeeq/revive"><img src="https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github" alt="GitHub"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License"/></a>
</p>

<div align="center">
  
  [![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://www.oracle.com/java/)
  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
  [![pgvector](https://img.shields.io/badge/pgvector-0.1.4-4169E1.svg)](https://github.com/pgvector/pgvector)
  
</div>

---

## What Revive Does

Revive is an AI-powered platform that **recovers revenue at risk** through failed payments, abandoned checkouts, and subscription failures.

**Revenue at risk** is revenue that should have been received but wasn't — not because money left the customer's account, but because the transaction never completed.

Revive closes the loop:
- **Detect** when revenue is at risk in real-time
- **Diagnose** why the failure happened and whether recovery is viable
- **Decide** what intervention makes sense within policy guardrails
- **Act** with bounded, measurable recovery actions
- **Measure** outcomes: recovered amount, cost, net gain, ROI
- **Audit** every decision and action immutably

This transforms revenue leakage from a passive loss into an actionable, measured opportunity.

---

## The Problem

Revenue slips away silently through:

- **Payment failures** — Temporary declines, insufficient funds, issuer errors, gateway timeouts
- **Checkout abandonment** — Incomplete flows, session timeouts, form errors
- **Failed subscriptions** — Expired cards, renewal failures, billing issues
- **Overdue receivables** — Aging invoices, missed payments

### The Critical Distinction

A **failed payment** does NOT mean money was debited from the customer's bank account.

**Example scenario:**
```text
Customer attempts to pay ₹10,000
    ↓
Payment attempt fails (issuer decline / timeout / insufficient funds)
    ↓
Merchant did not receive the expected ₹10,000
    ↓
This is ₹10,000 REVENUE AT RISK
    ↓
A later recovery attempt succeeds
    ↓
₹10,000 becomes RECOVERED REVENUE
```

**Revenue at risk ≠ money debited from customer**

In most cases, the customer's account was never charged. The revenue opportunity simply didn't complete.

The problem is not detection. Payment gateways already tell you when transactions fail.

**The problem is closing the loop:** What do you do next? When? How much does it cost? Did it work? Why or why not?

---

## How Recovery Works

Revive implements a complete revenue recovery lifecycle:

```text
REVENUE AT RISK
    ↓
DETECT
    ↓              Identify failed payment / incomplete transaction
DIAGNOSE
    ↓              AI analysis: What happened? Why? Is recovery viable?
DECIDE
    ↓              Determine recovery intervention based on context
GUARDRAIL
    ↓              Check recovery policies: retry limits, cost thresholds, approvals
RECOVER
    ↓              Execute bounded recovery action (retry, email, offer, etc.)
MEASURE
    ↓              Track outcome: recovered amount, cost, net gain
AUDIT
    ↓              Maintain immutable compliance trail for every action
```

Every step is intentional, measurable, and auditable.

### Detect

Capture failed payment events in real-time from payment gateway webhooks. Record:
- Payment identifier, customer details, amount, currency
- Error code, failure reason, payment method
- Timestamp, metadata, gateway context

### Diagnose

AI analyzes:
- **What happened?** — Parse error codes, failure reasons, customer context
- **Why?** — Identify patterns, historical behavior, risk signals
- **Is recovery viable?** — Assess probability based on failure type and customer history

### Decide

Determine appropriate recovery intervention:
- Automatic retry with exponential backoff
- Email/SMS reminder to customer
- Payment link with alternative methods
- Discount offer to incentivize completion
- Manual review or escalation

### Guardrail

Before acting, validate against **Recovery Policies**:
- **Retry limits** — Maximum attempts per payment
- **Cooldown periods** — Time between retries
- **Cost thresholds** — Maximum recovery cost per payment
- **Budget limits** — Total recovery budget per workspace
- **Channel restrictions** — Allowed recovery channels (EMAIL, SMS, etc.)
- **Approval requirements** — Manual approval for high-value payments

**Policy before action. No exceptions.**

### Recover

Execute recovery action within policy bounds:
- Automated payment retry through gateway
- Send payment reminder via email/SMS
- Generate new payment link
- Apply discount offer
- Escalate for manual intervention

Track action status: `INITIATED → IN_PROGRESS → COMPLETED / FAILED`

### Measure

Record outcome:
- **Recovered amount** — Successfully collected revenue
- **Recovery cost** — Total cost of recovery actions
- **Net gain** — Recovered amount minus recovery cost
- **ROI** — (Net Gain / Recovery Cost) × 100%

### Audit

Log every action immutably:
- Who (user or automated system)
- What (action type, entity affected)
- When (timestamp)
- Why (context, policy evaluation)
- What happened (outcome, success/failure)

The audit trail is **write-only and immutable** for complete compliance transparency.

---

## AI Decision Layer

Revive uses AI as an **intelligence and decision layer**, not a chatbot.

```text
Payment problem
    ↓
Detection
    ↓
Context / diagnosis
    ↓
AI reasoning
    ↓
Recovery recommendation
    ↓
Policy / guardrail evaluation
    ↓
Bounded action
    ↓
Outcome
    ↓
Audit
```

### AI is designed to answer:

- **What happened?** — Diagnose failure reason, error code, customer context
- **Why might this have happened?** — Identify patterns, historical behavior, risk signals
- **Is this worth recovering?** — Support recovery viability assessment
- **What intervention makes sense?** — Support recovery action planning
- **Are we allowed to take that action?** — Validate against configured policies
- **Why is this recommendation being made?** — Provide explainability for decisions

Revive is **not** a chatbot-first product. AI is embedded as a reasoning layer that supports diagnosis, recommendation, and explanation.

---

## Recovery Workflow

### Failed Payment Entity

Core entity representing revenue at risk.

| Field | Description |
|-------|-------------|
| `payment_identifier` | External payment/order ID from gateway |
| `customer_id` | Customer identifier for recovery contact |
| `amount` | Failed payment amount (revenue at risk) |
| `currency` | Currency code (INR, USD, etc.) |
| `status` | `FAILED`, `PENDING_RETRY`, `RECOVERED`, `ABANDONED` |
| `failure_reason` | Human-readable failure description |
| `error_code` | Gateway error code (`issuer_declined_temp`, `insufficient_funds`) |
| `payment_method` | UPI, CARD, NET_BANKING, etc. |
| `retry_count` | Number of recovery attempts made |
| `failed_at` | When payment initially failed |
| `last_retry_at` | When last recovery attempt occurred |
| `recovered_at` | When payment was successfully recovered |
| `metadata` | JSONB storage for gateway responses, customer preferences |

**Status Lifecycle:**
```text
FAILED → PENDING_RETRY → RETRY_IN_PROGRESS → RECOVERED
           ↓                      ↓
        ABANDONED         UNDER_REVIEW / DISPUTED
```

### Recovery Action Entity

Tracks each recovery attempt with outcome and cost.

| Field | Description |
|-------|-------------|
| `failed_payment_id` | Reference to failed payment being recovered |
| `action_type` | `AUTOMATIC_RETRY`, `EMAIL_REMINDER`, `SMS_REMINDER`, `DISCOUNT_OFFER`, `PAYMENT_LINK`, `PHONE_CALL`, `ESCALATION`, `CUSTOM` |
| `channel` | Communication channel or method used |
| `status` | `INITIATED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `CANCELLED` |
| `is_automated` | Whether action was automated or manual |
| `initiated_by` | User who initiated manual action (null for automated) |
| `outcome` | JSONB storage for gateway responses, customer replies, error details |
| `cost` | Cost of this recovery action (SMS cost, discount amount, manual effort) |
| `initiated_at` | When action was initiated |
| `completed_at` | When action completed |

**Action Types:**
- **AUTOMATIC_RETRY** — Automated payment retry through gateway
- **EMAIL_REMINDER** — Email notification to customer
- **SMS_REMINDER** — SMS notification to customer
- **DISCOUNT_OFFER** — Offer discount to incentivize payment
- **PAYMENT_LINK** — Send new payment link
- **PHONE_CALL** — Manual phone call
- **ESCALATION** — Escalate to collections or manager
- **CUSTOM** — Custom recovery action

### Recovered Revenue Entity

Measures successfully recovered revenue and ROI.

| Field | Description |
|-------|-------------|
| `failed_payment_id` | Reference to recovered payment |
| `recovery_action_id` | Reference to successful recovery action |
| `recovered_amount` | Amount successfully recovered |
| `recovery_cost` | Total cost of recovery actions |
| `net_gain` | Net gain after costs (recovered_amount - recovery_cost) |
| `currency` | Currency code |
| `recovered_at` | When payment was recovered |

**ROI Calculation:**
```text
Net Gain = Recovered Amount - Recovery Cost
ROI = (Net Gain / Recovery Cost) × 100%
```

---

## Guardrails & Stopping Rules

**Recovery Policy** entities define configurable guardrails that prevent runaway recovery costs and protect customer experience.

### Policy Configuration

| Field | Description |
|-------|-------------|
| `name` | Human-readable policy name |
| `max_retry_count` | Maximum retry attempts per payment |
| `cooldown_hours` | Cooldown period between retries |
| `max_recovery_cost_per_payment` | Maximum cost to recover single payment |
| `max_total_recovery_budget` | Maximum total recovery budget for workspace |
| `allowed_channels` | JSONB array of permitted channels (EMAIL, SMS, PHONE, etc.) |
| `policy_rules` | JSONB storage for complex rules (time windows, payment method restrictions) |
| `is_active` | Whether this policy is currently active |
| `priority` | Priority for policy evaluation (lower = higher priority) |

### Example Policy Configuration

```json
{
  "name": "Standard Retry Policy",
  "max_retry_count": 3,
  "cooldown_hours": 24,
  "max_recovery_cost_per_payment": 100.00,
  "allowed_channels": ["EMAIL", "AUTOMATIC_RETRY"],
  "policy_rules": {
    "time_windows": ["09:00-21:00"],
    "exclude_payment_methods": [],
    "require_approval_above": 50000
  }
}
```

*Note: Values shown are illustrative examples. Actual policy configurations are workspace-specific and configurable.*

### Stopping Rules

Recovery stops when:
- **Retry limit reached** — Maximum attempts exceeded
- **Cost threshold exceeded** — Recovery cost exceeds configured maximum
- **Budget exhausted** — Workspace recovery budget depleted
- **Channel not allowed** — Proposed action violates channel restrictions
- **Approval required** — Payment amount requires manual approval
- **Customer opted out** — Customer requested no contact
- **Payment recovered** — Transaction completed successfully
- **Payment abandoned** — Marked for manual review or write-off

**Policy before action. Every recovery action must pass policy guardrails.**

---

## Auditability

**Audit Trail** entity maintains immutable compliance log for all recovery actions.

| Field | Description |
|-------|-------------|
| `timestamp` | When action occurred |
| `user_id` | User who performed action (null for automated) |
| `workspace_id` | Workspace where action occurred |
| `action_type` | Type of action performed |
| `entity_type` | Entity affected (`FailedPayment`, `RecoveryAction`) |
| `entity_id` | ID of affected entity |
| `payment_identifier` | Payment identifier for traceability |
| `details` | JSONB storage for action parameters, state changes, context |
| `outcome` | Human-readable outcome description |
| `ip_address` | IP address of request |
| `user_agent` | User agent of request |

### Audit Principles

- **Write-only** — Audit records are never updated or deleted
- **Immutable** — Complete historical record of all actions
- **Complete** — Who, what, when, why, and outcome for every action
- **Traceable** — Payment identifier links all actions to original transaction
- **Transparent** — Full visibility into automated and manual actions

**Every decision and action is auditable for compliance and debugging.**

---

## Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18.3.1 + TypeScript 5.7.3 + Vite 5.4.10              │
│  TanStack Query 5.60 + Axios 1.7.7 + Radix UI + Tailwind   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────┴─────────────────────────────────────┐
│                        BACKEND                               │
│              Spring Boot 3.2.5 + Java 17                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Controller Layer (REST APIs)                           │ │
│  │ - FailedPaymentController                              │ │
│  │ - RecoveryActionController                             │ │
│  │ - RecoveryPolicyController                             │ │
│  │ - AuditTrailController                                 │ │
│  │ - AuthController, UserController, WorkspaceController  │ │
│  │ - DashboardController, AiController, AdvisorController │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Service Layer (Business Logic)                         │ │
│  │ - RecoveryOrchestrationService                         │ │
│  │ - RecoveryPolicyService                                │ │
│  │ - AuditTrailService                                    │ │
│  │ - RecoveryActionExecutor                               │ │
│  │ - PolicyEvaluationEngine                               │ │
│  │ - AuthService, UserService, WorkspaceService           │ │
│  │ - GroqAiService, GeminiAiService, EmbeddingService     │ │
│  │ - AgentOrchestrationService, VectorSearchService       │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Repository Layer (Data Access)                         │ │
│  │ Spring Data JPA + Hibernate                            │ │
│  │ - FailedPaymentRepository                              │ │
│  │ - RecoveryActionRepository                             │ │
│  │ - RecoveryPolicyRepository                             │ │
│  │ - RecoveredRevenueRepository                           │ │
│  │ - AuditTrailRepository                                 │ │
│  │ - UserRepository, WorkspaceRepository                  │ │
│  │ - FinancialRecordRepository (supporting capabilities)  │ │
│  └────────────────────────────────────────────────────────┘ │
│                         ↓                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Security Layer                                         │ │
│  │ - Spring Security 6.x                                  │ │
│  │ - JwtAuthenticationFilter, JwtTokenProvider            │ │
│  │ - CustomUserDetailsService                             │ │
│  │ - WorkspacePermissionEvaluator (RBAC)                  │ │
│  │ - Bucket4j Rate Limiting                               │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                  DATABASE & STORAGE                          │
│                                                              │
│  ┌──────────────────────┐  ┌─────────────────────────────┐  │
│  │ PostgreSQL 15+       │  │ Cloudinary CDN              │  │
│  │ - pgvector 0.1.4     │  │ - Image storage & delivery  │  │
│  │ - JSONB support      │  │ - Receipt uploads           │  │
│  │ - HikariCP pool      │  └─────────────────────────────┘  │
│  │ - Flyway migrations  │                                   │
│  └──────────────────────┘                                   │
│                                                              │
│  Tables:                                                     │
│  - users, workspaces, workspace_members                      │
│  - failed_payments, recovery_actions, recovery_policies      │
│  - recovered_revenue, audit_trail                            │
│  - financial_records, financial_insights (supporting)        │
│  - financial_embeddings, advisor_conversations (supporting)  │
└──────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┴─────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ Groq AI          │  │ Gemini AI        │  │ Resend    │  │
│  │ Text processing  │  │ Vision OCR       │  │ Email API │  │
│  │                  │  │ Tool-calling     │  │           │  │
│  └──────────────────┘  └──────────────────┘  └───────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Payment Gateway Webhooks                             │   │
│  │ - Real-time failure event ingestion                  │   │
│  │ - Payment retry execution                            │   │
│  │ - Gateway error code normalization                   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Layered architecture** — Clear separation: Controller → Service → Repository
- **Multi-tenancy** — Workspace-scoped data isolation with RBAC
- **Stateless authentication** — JWT-based with OAuth 2.0 social login
- **Domain-driven design** — Rich domain entities with business logic
- **Hybrid AI architecture** — Groq (text) + Gemini (vision) + Local (embeddings) with automatic failover
- **Event-driven audit trail** — Immutable compliance logging for all actions
- **Policy-based guardrails** — Configurable rules evaluated before action execution
- **Webhook-driven ingestion** — Real-time payment failure detection from gateways

---

## Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Java** | 17+ | Primary language |
| **Spring Boot** | 3.2.5 | Application framework |
| **Spring Data JPA** | 3.2.x | Database persistence |
| **Spring Security** | 6.x | Authentication & authorization |
| **Hibernate** | 6.x | ORM implementation |
| **PostgreSQL** | 15+ | Primary database |
| **pgvector** | 0.1.4 | Vector embeddings for semantic search |
| **Flyway** | 9.x | Database migrations |
| **JJWT** | 0.12.5 | JWT token generation & validation |
| **Resend** | 3.0.0 | Transactional email API |
| **Bucket4j** | 8.7.0 | Rate limiting (token bucket) |
| **Groq AI** | - | Text AI processing |
| **Gemini AI** | - | Vision OCR & tool-calling |
| **DJL** | 0.28.0 | Local embeddings |
| **Cloudinary** | 1.38.0 | Image CDN & storage |
| **Apache HttpClient5** | 5.3.1 | HTTP client for external APIs |
| **Lombok** | - | Boilerplate reduction |
| **Maven** | 3.9+ | Build automation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI framework |
| **TypeScript** | 5.7.3 | Type-safe JavaScript |
| **Vite** | 5.4.10 | Build tool & dev server |
| **React Router** | 6.28.0 | Client-side routing |
| **TanStack Query** | 5.60.0 | Server state management |
| **Axios** | 1.7.7 | HTTP client |
| **Radix UI** | - | Accessible component primitives |
| **Tailwind CSS** | 4.2.0 | Utility-first styling |
| **React Hook Form** | 7.54.1 | Form management |
| **Zod** | 3.24.1 | Schema validation |
| **Recharts** | 3.10.0 | Data visualization |
| **Lucide React** | 0.564.0 | Icon library |
| **Sonner** | 1.7.1 | Toast notifications |

### Database

- **PostgreSQL 15+** with pgvector extension
- **Flyway versioned migrations** (V0 through V9)
- **JSONB columns** for flexible metadata storage
- **Vector indexes** for semantic search (ivfflat with cosine similarity)
- **Composite indexes** for query optimization
- **Foreign key constraints** with cascade delete
- **Timestamp triggers** for automatic updated_at management

### Infrastructure

- **Render** — Backend hosting (Docker container)
- **Vercel** — Frontend hosting (Edge CDN)
- **Neon** — Serverless PostgreSQL
- **Cloudinary** — Image CDN & storage
- **Resend** — Email delivery
- **Docker** — Containerization with multi-stage builds

### Supporting Financial Capabilities

The platform includes supporting financial management capabilities built on the same infrastructure:
- Transaction categorization with AI
- Receipt OCR and data extraction
- Financial insights generation
- RAG-powered financial advisor with conversation history
- Dashboard analytics with trend visualization

These capabilities leverage the same AI infrastructure (Groq, Gemini, pgvector) and workspace management system that powers Revive's recovery intelligence.

---

## Demo / How to Run

### Prerequisites

- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.9+** (included via Maven Wrapper)
- **Node.js 18+**
- **PostgreSQL 15+** (or use H2 in-memory database for testing)
- **Docker Desktop** (optional)

### Quick Start

#### 1. Clone Repository

```bash
git clone https://github.com/rakinmohammedrafeeq/revive.git
cd revive
```

#### 2. Setup Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add database credentials, JWT secret, API keys, etc.

# Run application
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run

# Optional: Use H2 in-memory database for testing
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
```

Backend runs on: **http://localhost:8080**

#### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

#### 4. Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080
- **Health Check:** http://localhost:8080/healthz

### Development Account Seeding

Admin account seeding can be configured through environment variables for local development. Never commit credentials to version control.

**Note:** On first login, a default workspace is automatically created for each user.

### Production Build

```bash
# Backend
cd backend
./mvnw clean package
java -jar target/revive-backend-*.jar

# Frontend
cd frontend
npm run build
npm run preview
```

---

## Project Structure

```text
revive/
├── backend/                                  # Spring Boot API
│   ├── src/main/java/com/revive/
│   │   ├── config/                           # Configuration classes
│   │   │   ├── SecurityConfig.java           # Spring Security
│   │   │   ├── OAuth2Config.java             # Google OAuth setup
│   │   │   ├── RateLimitConfig.java          # Bucket4j rate limiting
│   │   │   ├── EmailConfig.java              # Resend email client
│   │   │   └── DataInitializer.java          # Seed data loader
│   │   ├── controller/                       # REST API controllers
│   │   │   ├── FailedPaymentController.java  # Failed payment endpoints
│   │   │   ├── RecoveryActionController.java # Recovery action endpoints
│   │   │   ├── RecoveryPolicyController.java # Policy management
│   │   │   ├── AuditTrailController.java     # Audit trail access
│   │   │   ├── AuthController.java           # Authentication
│   │   │   ├── UserController.java           # User management
│   │   │   ├── WorkspaceController.java      # Workspace CRUD
│   │   │   └── ... (other controllers)
│   │   ├── dto/                              # Data Transfer Objects
│   │   ├── entity/                           # JPA entities
│   │   │   ├── FailedPayment.java            # Failed payment entity
│   │   │   ├── RecoveryAction.java           # Recovery action entity
│   │   │   ├── RecoveryPolicy.java           # Recovery policy entity
│   │   │   ├── RecoveredRevenue.java         # Recovered revenue tracking
│   │   │   ├── AuditTrail.java               # Immutable audit log
│   │   │   ├── User.java                     # User entity
│   │   │   ├── Workspace.java                # Workspace entity
│   │   │   └── ... (other entities)
│   │   ├── enums/                            # Enumerations
│   │   │   ├── PaymentStatus.java            # Payment status enum
│   │   │   ├── RecoveryActionType.java       # Recovery action types
│   │   │   ├── RecoveryActionStatus.java     # Recovery action status
│   │   │   ├── AuditActionType.java          # Audit action types
│   │   │   └── ... (other enums)
│   │   ├── exception/                        # Exception handling
│   │   ├── repository/                       # Data access layer
│   │   │   ├── FailedPaymentRepository.java
│   │   │   ├── RecoveryActionRepository.java
│   │   │   ├── RecoveryPolicyRepository.java
│   │   │   ├── RecoveredRevenueRepository.java
│   │   │   ├── AuditTrailRepository.java
│   │   │   └── ... (other repositories)
│   │   ├── security/                         # Security components
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── WorkspacePermissionEvaluator.java
│   │   │   └── ... (other security components)
│   │   └── service/                          # Business logic
│   │       ├── RecoveryOrchestrationService.java
│   │       ├── RecoveryPolicyService.java
│   │       ├── AuditTrailService.java
│   │       ├── RecoveryActionExecutor.java
│   │       ├── PolicyEvaluationEngine.java
│   │       ├── GroqAiService.java
│   │       ├── GeminiAiService.java
│   │       └── ... (other services)
│   ├── src/main/resources/
│   │   ├── application.properties            # Main configuration
│   │   └── db/migration/                     # Flyway migrations
│   │       ├── V0__enable_extensions.sql     # Enable pgvector
│   │       ├── V1__init.sql                  # Initial schema
│   │       ├── V9__add_revive_revenue_recovery_tables.sql  # Revive domain
│   │       └── ... (other migrations)
│   ├── .env                                  # Environment variables
│   ├── .env.example                          # Environment template
│   ├── docker-compose.yml                    # Docker Compose
│   ├── Dockerfile                            # Development Dockerfile
│   ├── Dockerfile.prod                       # Production Dockerfile
│   └── pom.xml                               # Maven dependencies
│
├── frontend/                                 # React + Vite SPA
│   ├── src/
│   │   ├── api/                              # API client
│   │   ├── components/                       # React components
│   │   ├── contexts/                         # React contexts
│   │   ├── pages/                            # Page components
│   │   │   ├── recovery/                     # Recovery workspace
│   │   │   ├── policies/                     # Policy management
│   │   │   ├── audit/                        # Audit trail
│   │   │   └── ... (other pages)
│   │   ├── types/                            # TypeScript types
│   │   └── utils/                            # Utility functions
│   ├── public/
│   │   └── icon.svg                          # App logo
│   ├── .env.example                          # Environment template
│   ├── package.json                          # Dependencies
│   ├── vite.config.ts                        # Vite config
│   └── vercel.json                           # Vercel config
│
├── public/                                   # Shared assets
│   └── icon.svg                              # Revive logo
└── README.md                                 # This file
```

---

## Security

### Authentication & Authorization

- **JWT-based stateless authentication** (JJWT 0.12.5)
  - Token expiry: 24 hours (configurable)
  - HS256 algorithm with 256-bit secret
- **Google OAuth 2.0 social login** (Spring OAuth2 Client)
- **OTP-based password reset** with email delivery
- **BCrypt password hashing** (Spring Security default)

### Role-Based Access Control (RBAC)

**Platform Roles:**
- **Admin** — Full platform access, user management
- **Analyst** — Read-only analytics access
- **Viewer** — Limited read-only access

**Workspace Permissions:**
- **Owner** — Full workspace control, member management, deletion
- **Editor** — Create/edit/delete records, full data access
- **Viewer** — Read-only workspace data access

Method-level security with `@PreAuthorize` annotations and `WorkspacePermissionEvaluator`.

### Rate Limiting

- **Bucket4j token bucket algorithm**
- Configurable per-endpoint limits
- Protects against abuse and quota exhaustion

### Best Practices

- **Environment-based secrets** (never committed to git)
- **CORS configuration** for production and development
- **SQL injection prevention** via JPA/Hibernate parameterized queries
- **XSS protection** via React's automatic escaping
- **CSRF protection** (stateless JWT eliminates CSRF risk)
- **Workspace data isolation** — queries always filtered by workspace

### Policy Guardrails as Security

Recovery Policy entities act as guardrails:
- **Retry limits** — Maximum attempts per payment
- **Cooldown periods** — Time between retries
- **Cost thresholds** — Maximum recovery cost per payment
- **Budget limits** — Total recovery budget per workspace
- **Channel restrictions** — Allowed recovery channels
- **Approval requirements** — Manual approval for high-value payments

Policies are evaluated **before** recovery actions execute, ensuring all actions stay within configured bounds.

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env` file. Use `backend/.env.example` as reference.

**Critical variables:**

```env
# Database
DB_URL=jdbc:postgresql://your-db-host/your-database?sslmode=require
DB_USERNAME=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-at-least-256-bits-long-for-hs256-algorithm
JWT_EXPIRATION=86400000

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=no-reply@alliededge.app
RESEND_FROM_NAME=Revive

# AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_VISION_PRIMARY=gemini-flash
GEMINI_TEXT_PRIMARY=gemini-flash-lite

# AI (Groq)
GROQ_API_KEY=your_groq_api_key
GROQ_TEXT_MODEL=llama-3.3-70b-versatile
GROQ_VISION_MODEL=llama-3.2-90b-vision-preview

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# Application
APP_BASE_URL=http://localhost:5173

# Embeddings (set to true to disable on low-memory systems)
DISABLE_EMBEDDINGS=false

# Admin Seeding (development only)
REVIVE_SEED_ADMIN=true
```

**Important:**
- **NEVER** commit real secrets to version control
- Use strong, unique values for `JWT_SECRET` (min 256 bits)
- Get API keys from respective provider consoles

### Frontend Environment Variables

**Development (`.env.local`):**

```env
# Uses Vite proxy to avoid CORS issues
VITE_API_BASE_URL=/api
```

**Production (`.env.production`):**

```env
# Direct backend URL (configure for your deployment)
VITE_API_BASE_URL=https://your-backend.example.com/api
```

---

## Product Principles

1. **Revenue recovery first.** Revive exists to recover revenue, not to be a chatbot or generic AI tool.

2. **Detection before intervention.** Always detect and diagnose before taking action.

3. **AI as a decision layer, not a chatbot.** AI supports diagnosis, recommendation, and explanation — not conversational fluff.

4. **Policy before action.** Every recovery action must pass policy guardrails. No exceptions.

5. **Actions remain bounded.** Recovery actions operate within configured limits: retry count, cost thresholds, approval requirements.

6. **Outcomes must be measurable.** Every action produces measurable results: recovered amount, cost, net gain, ROI.

7. **Decisions must be auditable.** Maintain an immutable audit trail of who did what, when, why, and what happened.

8. **Never fabricate financial results.** Do not invent recovery rates, revenue amounts, or customer counts. Use real data or clearly label simulations.

9. **Human-readable explanations before technical details.** Speak in revenue language ("₹18,500 at risk") before technical jargon ("payment_id=12345 error_code=issuer_declined_temp").

10. **Build around real data and real system capabilities.** Document what exists, not what we wish existed. Separate current from future functionality.

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## Contact

- **Email:** rakinmohammedrafeeq@gmail.com
- **Phone:** +91 9008648930
- **LinkedIn:** [linkedin.com/in/rakinmohammedrafeeq](https://www.linkedin.com/in/rakinmohammedrafeeq/)
- **GitHub:** [github.com/rakinmohammedrafeeq/revive](https://github.com/rakinmohammedrafeeq/revive)

---

**Built with focus. Designed for revenue recovery. Powered by AI.**
