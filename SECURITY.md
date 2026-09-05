# Security Policy & Compliance Posture

Revive is an autonomous AI-powered revenue recovery engine handling high-stakes payment events and intervention workflows for digital merchants. Security, regulatory compliance, and customer privacy are foundational to our architectural design.

---

## 1. Supported Versions

Security updates and critical patches are actively provided for the following releases:

| Version | Supported | Notes |
| :--- | :---: | :--- |
| `1.0.x` (Current Main) | :white_check_mark: | Full security patch support |
| `< 1.0.0` | :x: | Legacy development prototypes; unsupported |

---

## 2. PCI-DSS Compliance & Cardholder Data Boundary

Revive is strictly architected to minimize PCI-DSS compliance scope for merchants:

* **Zero PAN / CVV Storage (Scope Exemption)**:  
  Revive **never** ingests, transmits, processes, or stores Primary Account Numbers (PANs), Card Verification Values (CVVs), card PINs, or bank authentication credentials.
* **Delegated Gateway Tokenization**:  
  All payment processing and card data entry is strictly delegated to PCI-DSS Level 1 certified payment gateways (e.g., Razorpay, Stripe) via their hosted checkout modals or client-side SDKs.
* **Non-Sensitive Telemetry Only**:  
  Revive only captures payment identifiers (e.g., `pay_xxxx`), masked transaction identifiers, localized error codes (e.g., `GATEWAY_TIMEOUT`, `INSUFFICIENT_FUNDS`), currency, amounts, and customer contact endpoints necessary to deliver recovery links.

---

## 3. Dual-Layer AI Safety & Prompt-Injection Guardrails

Revive employs an architectural principle: **The LLM can diagnose and advise, but it can never bypass deterministic code.**

```
[ Failed Payment Event ]
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Machine Learning Recovery Scorer (scikit-learn)         │
│    Calculates probability P(recovery) based on telemetry   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AI Failure Diagnostic Engine (Groq LLM)                  │
│    Analyzes root cause & suggests recovery channel/delay   │
└─────────────────────────────┬───────────────────────────────┘
                              │ Suggested Action
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Deterministic Policy Engine (Hard Java Rules)           │
│    Enforces: Cooldowns, Max Retries, Quiet Hours, Budget    │
│    ❌ LLM CANNOT OVERRIDE POLICY RULES                     │
└─────────────────────────────┬───────────────────────────────┘
                              │ Approved Action Only
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Bounded Recovery Execution & Immutable Audit Trail       │
└─────────────────────────────────────────────────────────────┘
```

* **Prompt Injection Defense**:  
  Diagnostic LLM prompts are structured with strict system prompts, rigid schema validation (JSON only), and untrusted input sanitization. Customer names and error codes are stripped of executable tokens before prompt synthesis.
* **Deterministic Policy Engine Override**:  
  Regardless of what the AI diagnoses, the bounded execution layer checks database-backed recovery policies:
  * Maximum retry attempts per transaction
  * Mandatory cooldown windows (e.g., minimum 6 hours between retries)
  * Local banking quiet hours (no outreach between 9 PM and 8 AM)
  * Workspace budget and maximum intervention cost caps

---

## 4. Authentication, Authorization & Cryptography

* **Role-Based Access Control (RBAC)**:  
  All backend endpoints enforce explicit authorization:
  * `ROLE_ADMIN`: Full platform governance, user management, merchant account activation/deactivation, and system audit oversight.
  * `ROLE_MERCHANT`: Payment recovery orchestration, gateway webhook integration, manual triggers, and policy guardrail configuration.
* **Stateless JWT Authentication**:  
  Tokens are signed using HMAC-SHA256 with strong secrets (`JWT_SECRET`). Expirations are enforced with automatic token invalidation.
* **Webhook Signature Verification**:  
  Inbound gateway webhooks (e.g., `/api/webhooks/razorpay`) require cryptographic HMAC-SHA256 signature verification matching gateway secret keys before any event is accepted into the pipeline.
* **Data in Transit & Rest**:  
  All external communication requires TLS 1.3 encryption. Production databases utilize encrypted storage volumes with secure connection pooling.

---

## 5. Secret Management & Git Hygiene

* Secrets (database credentials, gateway API keys, LLM tokens) must reside exclusively in environment variables or cloud secret managers.
* No private keys, credentials, or `.env` files are tracked in source control (strictly enforced via repository `.gitignore`).
* A sanitized template is provided at `.env.example` with zero live credentials.

---

## 6. Vulnerability Disclosure & Reporting Protocol

We take security vulnerabilities seriously. If you discover a vulnerability in Revive, please report it responsibly:

### How to Report
* **Email**: Please send vulnerability details to **`security@revive.app`** (or directly contact repository maintainers).
* **Please Do Not**:
  * Disclose the issue publicly on GitHub Issues, forums, or social media before it has been resolved.
  * Attempt denial-of-service attacks or disrupt live production systems.
  * Access or modify data belonging to other workspaces or accounts.

### What to Include in Your Report
1. Description of the vulnerability and its potential impact.
2. Step-by-step reproduction steps or proof-of-concept (PoC).
3. Any affected components (e.g., endpoint URL, request payload, frontend view).
4. Proposed mitigation or patch if available.

### Response SLA
* **Initial Acknowledgment**: Within 24 hours.
* **Triage & Assessment**: Within 72 hours.
* **Resolution & Public Advisory**: Coordinated release schedule following verification.
