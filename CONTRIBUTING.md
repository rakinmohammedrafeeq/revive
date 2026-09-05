# Contributing to Revive

Thank you for your interest in contributing to **Revive**! Revive is an autonomous AI revenue recovery engine built to detect, diagnose, and recover failed payments within deterministic merchant policy guardrails.

This document outlines the guidelines, development setup, code standards, and submission workflow for contributors.

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Contributors are expected to treat all community members with respect, communicate constructively, and uphold high professional standards in all interactions.

---

## 2. Monorepo Architecture Overview

Revive is structured as a coordinated multi-tier platform:

```
revive/
├── backend/            # Java 21 / Spring Boot 3.2.5 REST API & Orchestration Engine
│   ├── src/main/java/  # Controllers, Services, Entities, Policy Engine, ML Integration
│   └── src/main/resources/db/migration/ # Flyway SQL migrations (V1 - V10)
├── frontend/           # React 18 / TypeScript / Tailwind CSS / Vite Dashboard
│   ├── src/components/ # Reusable UI components & recovery widgets
│   ├── src/pages/      # Command Center, Recovery Workspace, ML Telemetry, Legal
│   └── src/api/        # Axios API clients
├── ml/                 # Python 3.10 Machine Learning Subsystem
│   ├── models/         # Trained Random Forest artifacts (recovery_model.pkl)
│   ├── data/           # Training and evaluation datasets
│   └── predict.py      # Subprocess prediction interface called by Java backend
├── public/             # Brand identity assets (icons, logo vectors)
├── SECURITY.md         # Vulnerability reporting & PCI-DSS compliance posture
└── README.md           # Master architecture & setup documentation
```

---

## 3. Local Development Setup

### Prerequisites
* **Java**: OpenJDK 21 or later
* **Node.js**: v18+ (Node 20 recommended) & `npm`
* **Python**: 3.10+ & `pip`
* **PostgreSQL**: PostgreSQL 15+ (or cloud instance like Neon) with `pgvector` enabled

### 3.1. Clone the Repository
```bash
git clone https://github.com/rakinmohammedrafeeq/revive.git
cd revive
```

### 3.2. Environment Configuration
Copy the environment template and provide your database and API credentials:
```bash
cp .env.example .env
```
Ensure key variables are populated:
* `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (PostgreSQL connection)
* `JWT_SECRET` (minimum 32-character secret)
* `GROQ_API_KEY` (for Groq LLM diagnostic synthesis)
* `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (Razorpay test mode keys)

### 3.3. Start the Backend
```bash
cd backend
./mvnw spring-boot:run
```
*API will listen on `http://localhost:8080` (health check: `http://localhost:8080/api/health`).*

### 3.4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server will listen on `http://localhost:5173`.*

### 3.5. (Optional) Train or Verify ML Models
```bash
cd ml
pip install -r requirements.txt
python evaluate_model.py
```

---

## 4. Development Workflow & Conventional Commits

### Branching Strategy
* Always create a feature or bugfix branch off `main`:
  * `feat/recovery-channel-whatsapp`
  * `fix/dunning-latency-calculation`
  * `docs/update-pci-spec`

### Commit Message Guidelines
We strictly enforce the **Conventional Commits** specification:

```
<type>(<scope>): <short description in present tense>

[optional body explaining motivation and changes]
```

#### Allowed Types:
* `feat`: A new user-facing feature or enhancement
* `fix`: A bug fix
* `docs`: Documentation only changes
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance
* `test`: Adding missing tests or correcting existing tests
* `chore`: Maintenance tasks, dependency updates, build tooling

#### Example:
```git
feat(metrics): add gross volume recovery rate to dashboard metrics response
fix(simulator): resolve CloudFront 403 on Razorpay modal logo
```

---

## 5. Code Quality & Standards

### Java / Backend
* Follow standard Java naming conventions and clean architecture boundaries.
* Never catch generic `Exception` silently — log meaningful context with SLF4J.
* Use Lombok (`@Getter`, `@Setter`, `@Builder`) consistently on entity and DTO classes.
* Enforce transaction boundaries using `@Transactional` appropriately.
* Run compilation checks:
  ```bash
  cd backend
  ./mvnw test-compile -DskipTests
  ```

### TypeScript / Frontend
* Write strict TypeScript — avoid `any` wherever possible.
* Use Tailwind CSS utility classes and Radix UI accessible primitives.
* Run type checks and build verification before opening a PR:
  ```bash
  cd frontend
  npm run build
  ```

### ML / Python
* Keep feature ordering in `ml/predict.py` strictly synchronized with `ml/train_model.py`.
* Ensure fallback weights in `RecoveryPredictionModel.java` remain calibrated with feature importances.

---

## 6. Pull Request Submission Checklist

Before opening a pull request, ensure:
- [ ] Code builds without errors (`npm run build` & `./mvnw test-compile`).
- [ ] All new endpoints have role-based authorization annotations (`@PreAuthorize`).
- [ ] Any database schema modifications include a sequential Flyway migration script in `backend/src/main/resources/db/migration/`.
- [ ] No secrets, `.env` files, or local credentials are committed.
- [ ] Commit messages follow the conventional commits format.
- [ ] Documentation (`README.md` / `SECURITY.md`) is updated if architecture or environment variables changed.
