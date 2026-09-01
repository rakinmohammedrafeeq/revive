# Contributing to Ledgera

First off, thank you for considering contributing to Ledgera! It's people like you that make Ledgera such a great tool for financial management.

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. Please be respectful and constructive in your interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples** to demonstrate the steps
* **Describe the behavior you observed** and what you expected
* **Include screenshots or animated GIFs** if applicable
* **Include your environment details** (OS, browser, Java version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

* **Use a clear and descriptive title**
* **Provide a detailed description** of the suggested enhancement
* **Explain why this enhancement would be useful**
* **List any alternative solutions** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** outlined below
3. **Write clear commit messages** following our commit message conventions
4. **Include tests** for new features
5. **Update documentation** as needed
6. **Ensure all tests pass** before submitting

## Development Process

### Setting Up Your Development Environment

#### Backend (Java/Spring Boot)
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

#### Frontend (React/TypeScript)
```bash
cd frontend
npm install
npm run dev
```

### Branch Naming Convention

* `feat/feature-name` - New features
* `fix/bug-description` - Bug fixes
* `docs/documentation-update` - Documentation changes
* `refactor/refactoring-description` - Code refactoring
* `test/test-description` - Adding or updating tests
* `chore/maintenance-task` - Maintenance tasks

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
* `feat`: A new feature
* `fix`: A bug fix
* `docs`: Documentation only changes
* `style`: Code style changes (formatting, missing semicolons, etc.)
* `refactor`: Code refactoring without changing functionality
* `perf`: Performance improvements
* `test`: Adding or updating tests
* `chore`: Maintenance tasks, dependency updates
* `ci`: CI/CD changes

**Example:**
```
feat(advisor): Add AI-powered financial insights

Implement RAG-based financial advisor that provides
personalized insights based on user's transaction history.

Closes #123
```

## Coding Standards

### Java/Backend

* Follow [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
* Use meaningful variable and method names
* Write Javadoc comments for public APIs
* Keep methods focused and under 50 lines when possible
* Use Spring Boot best practices
* Write unit tests for services and integration tests for controllers
* Minimum 80% code coverage for new code

**Example:**
```java
/**
 * Retrieves financial insights for a specific workspace.
 *
 * @param workspaceId the unique identifier of the workspace
 * @param userId the user requesting the insights
 * @return list of financial insights
 * @throws UnauthorizedException if user doesn't have access
 */
public List<FinancialInsight> getInsights(Long workspaceId, Long userId) {
    validateAccess(workspaceId, userId);
    return insightRepository.findByWorkspaceId(workspaceId);
}
```

### TypeScript/Frontend

* Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
* Use TypeScript strict mode
* Write clear type definitions
* Use functional components with hooks
* Keep components under 200 lines
* Extract reusable logic into custom hooks
* Write unit tests for utilities and integration tests for components

**Example:**
```typescript
interface AdvisorChatProps {
  workspaceId: number;
  onClose: () => void;
}

export const AdvisorChat: React.FC<AdvisorChatProps> = ({
  workspaceId,
  onClose,
}) => {
  const { messages, sendMessage, isLoading } = useAdvisor(workspaceId);
  
  // Component implementation
};
```

### SQL/Database

* Use descriptive table and column names
* Include migration scripts for schema changes
* Add appropriate indexes for query performance
* Document complex queries
* Use prepared statements to prevent SQL injection

## Testing Guidelines

### Backend Testing

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=FinancialAdvisorServiceTest

# Run with coverage
./mvnw test jacoco:report
```

### Frontend Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

## Documentation

* Update README.md for user-facing changes
* Update inline code documentation
* Add JSDoc/Javadoc for public APIs
* Update API documentation for endpoint changes
* Include examples in documentation

## Database Migrations

* Create Flyway migrations for schema changes
* Follow naming convention: `V{number}__{description}.sql`
* Test migrations on clean database
* Include rollback instructions in comments
* Never modify existing migrations

## Security

* Never commit sensitive data (API keys, passwords)
* Use environment variables for configuration
* Follow OWASP security best practices
* Report security vulnerabilities privately (see SECURITY.md)
* Validate and sanitize all user inputs
* Use parameterized queries for database access

## Performance

* Optimize database queries
* Use pagination for large datasets
* Implement caching where appropriate
* Monitor and optimize bundle sizes
* Use lazy loading for heavy components

## Accessibility

* Follow WCAG 2.1 Level AA guidelines
* Use semantic HTML
* Ensure keyboard navigation works
* Add appropriate ARIA labels
* Test with screen readers

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## Recognition

Contributors will be recognized in our README.md and release notes.

Thank you for contributing to Ledgera! 🚀
