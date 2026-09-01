# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- AI Agent `update_transaction` tool - Update existing transactions with confirmation
- AI Agent `delete_transaction` tool - Delete transactions permanently with confirmation
- RBAC-based tool filtering in AgentToolRegistry (Viewers: 4 read tools, Editors/Owners: 7 tools)
- Enhanced AgentToolExecutorService with update and delete handlers
- `.gitattributes` for consistent file handling across platforms
- `CONTRIBUTING.md` with development guidelines and contribution process
- `SECURITY.md` with security policies and vulnerability reporting process
- `CHANGELOG.md` to track project changes

### Changed
- Updated AI Agent from 6 to 7 tools (added update and delete capabilities)
- Improved AI Agent tool descriptions and parameter documentation
- Enhanced README.md with comprehensive AI Agent documentation

## [1.1.0] - 2026-07-27

### Added

#### AI Agent with Tool-Calling
- Autonomous AI agent loop using Groq Llama 3.3 70B with multi-step reasoning
- 7 registered agent tools for comprehensive financial operations:
  - `get_transactions` - Query and filter financial records with advanced parameters
  - `get_spending_summary` - Analyze spending patterns by category
  - `search_records` - Semantic search across transaction descriptions using pgvector
  - `get_monthly_trends` - Track income/expense trends over time periods
  - `create_transaction` - Create new transactions (requires user confirmation)
  - `update_transaction` - Update existing transactions (requires user confirmation)
  - `delete_transaction` - Delete transactions permanently (requires user confirmation)
- Write-confirmation flow with TTL-based pending action store (5-minute expiry)
- RBAC-based tool filtering: Viewers get 4 read tools, Editors/Owners get all 7 tools
- AgentController with `/api/ai/agent`, `/confirm`, and `/cancel` endpoints
- AgentOrchestrationService for autonomous agent loop execution
- AgentToolRegistry for centralized tool registration and metadata
- AgentToolExecutorService for secure tool invocation with permission checks
- PendingActionStore for managing user confirmations with TTL
- DTOs: AgentRequest, AgentResponse, ConfirmActionRequest, PendingAction
- Frontend AgentChat component with tabbed UI (AI Advisor + AI Agent)
- AgentConfirmModal with overlay-click blocking for secure confirmations
- GeminiToolCallingService as alternative AI agent provider

#### UI/UX Improvements
- Tabbed AdvisorPage with AI Advisor and AI Agent tabs on same page
- Enhanced landing page with AI Agent feature card
- Improved modal interactions with proper click-outside handling
- Better loading states and error handling for agent responses

### Changed
- Updated README.md with AI Agent documentation and architecture
- Updated repository structure section with new agent-related files
- Expanded API endpoints section with agent endpoints
- Enhanced feature descriptions to include AI Agent capabilities

### Fixed
- UTF-8 encoding issues throughout the project:
  - Added `project.build.sourceEncoding=UTF-8` to pom.xml
  - Fixed rupee symbol (₹) encoding in all responses and DTOs
  - Updated StringEntity and EntityUtils to use UTF-8 explicitly
  - Ensured consistent character encoding across all AI services
- AgentConfirmModal overlay click-through preventing accidental cancellations

## [1.0.0] - 2024-01-XX

### Added

#### AI Financial Advisor
- AI-powered financial advisor with RAG (Retrieval-Augmented Generation)
- Vector search capabilities using pgvector for semantic search of financial data
- Conversation management for advisor chat history
- Financial insights generation based on transaction history
- Embedding service for vectorizing financial data
- AI model fallback service for improved reliability across providers
- Quick question suggestions for user guidance

#### Backend Features
- `FinancialAdvisorController` for advisor chat endpoints
- `FinancialAdvisorService` implementing RAG-based advice generation
- `EmbeddingService` for creating vector embeddings of financial records
- `VectorSearchService` for semantic search across financial data
- `AiModelFallbackService` for seamless failover between AI providers
- `AdvisorConversationRepository` for chat history persistence
- `FinancialInsightRepository` for storing generated insights
- `FinancialEmbeddingRepository` for vector storage
- New entities: `AdvisorConversation`, `FinancialInsight`, `FinancialEmbedding`
- PostgreSQL extensions support (pgvector, uuid-ossp)
- Flyway migration for RAG tables and vector indexes
- Financial record filtering by category in repository
- Enhanced error handling in AI services

#### Frontend Features
- Financial Advisor page with interactive chat interface
- Advisor components: `AdvisorChat`, `FinancialInsights`, chat messages
- `useAdvisor` custom hook for advisor state management
- `advisorApi` for backend communication
- Smooth animations and transitions using framer-motion
- Mobile-responsive advisor interface
- Loading states and error handling for AI responses

#### Workspace Features
- Enhanced workspace switcher with improved UI
- Smooth workspace transitions
- Better visual feedback for workspace selection
- Workspace member permission management

#### UI/UX Improvements
- Updated navigation with advisor link
- Improved mobile responsiveness across all pages
- Enhanced sidebar with better icons and layout
- Redesigned landing page with modern styling
- Updated footer with better spacing and layout
- Custom mobile styles for better touch interactions
- Sheet component improvements for mobile drawers

#### Developer Experience
- `docker-compose.dev.yml` for local PostgreSQL development
- Database initialization scripts (`init-db.sql`)
- Neon database setup scripts (`neon-setup.sql`)
- Database state checking utilities (`check-db-state.sql`)
- Cleanup scripts for insights and embeddings
- Keep-alive scripts for Neon database (`.cmd` and `.ps1`)
- Development database startup script (`start-dev-db.cmd`)
- Comprehensive `.env.example` with all configuration options

#### Dependencies
- Added `pgvector-java` for vector database support
- Added `framer-motion` for React animations
- Updated Spring Boot dependencies
- Updated frontend React and TypeScript dependencies

### Changed

#### Backend
- Enhanced `GroqAiService` with better error handling and streaming
- Improved `GeminiAiService` with structured output and error recovery
- Updated `FinancialRecordService` with category filtering
- Refactored `FinancialRecordRepository` with new query methods
- Updated `application.properties` with new AI service configurations
- Enhanced `application-h2.properties` for local development
- Updated `pom.xml` with new dependencies and versions

#### Frontend
- Refactored `WorkspaceSwitcher` with improved state management
- Updated `Navbar` with advisor navigation and better mobile support
- Enhanced `AppSidebar` with advisor link and icons
- Improved `DashboardLayout` for better responsive behavior
- Updated `AppFooter` with better styling
- Enhanced `sheet.tsx` component with improved animations
- Updated `index.css` with new utility classes and mobile styles
- Improved `LandingPage` layout and content

#### Configuration
- Updated `.env.example` with comprehensive documentation
- Enhanced README.md with new features and setup instructions
- Updated `site.webmanifest` with proper configuration

### Fixed
- Line ending consistency issues in application properties
- Mobile navigation drawer behavior
- Workspace switching UI glitches
- API error handling edge cases
- TypeScript type definitions for new features

### Security
- Implemented proper error handling to avoid exposing system details
- Added input validation for advisor chat messages
- Secured vector search queries against injection
- Protected advisor endpoints with authentication and authorization

## [0.9.0] - 2024-XX-XX

### Added
- Multi-workspace support
- Workspace member management
- Role-based access control (Owner, Admin, Member)
- Workspace invitation system
- OAuth 2.0 authentication (Google, GitHub)
- Email-based OTP authentication
- Two-factor authentication
- Dashboard with financial summaries
- Category-based expense tracking
- Monthly trend analysis
- Receipt upload and processing
- AI-powered transaction categorization
- Groq AI integration for categorization
- Gemini AI integration for receipt processing
- Rate limiting for API endpoints
- Admin panel for user management
- User status management (Active/Suspended)
- Change password functionality
- Forgot password with email reset
- H2 database support for development
- PostgreSQL support for production
- Docker support for deployment
- Health check endpoints
- Diagnostics endpoints

### Backend Stack
- Java 17
- Spring Boot 3.2.x
- Spring Security with JWT
- Spring Data JPA
- PostgreSQL / H2
- Flyway migrations
- Maven build system

### Frontend Stack
- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- Tailwind CSS
- Shadcn UI components
- Recharts for data visualization

### Infrastructure
- Docker and Docker Compose
- GitHub Actions CI/CD
- Neon PostgreSQL hosting

## [0.1.0] - 2024-XX-XX

### Added
- Initial project setup
- Basic authentication system
- User registration and login
- Financial record CRUD operations
- Basic dashboard
- REST API structure
- Database schema design

---

## Version History

### Version Format
- **Major** (1.x.x): Breaking changes, major new features
- **Minor** (x.1.x): New features, backward compatible
- **Patch** (x.x.1): Bug fixes, minor improvements

### Release Notes
Detailed release notes for each version are available in the [Releases](https://github.com/rakinmohammedrafeeq/ledgera/releases) section.

### Upgrade Guides
For breaking changes and upgrade instructions, see [UPGRADING.md](./UPGRADING.md) (coming soon).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## Security

See [SECURITY.md](./SECURITY.md) for our security policy and how to report vulnerabilities.
