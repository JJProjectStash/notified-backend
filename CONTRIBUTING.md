# Contributing to Notified Backend

Thank you for your interest in contributing to Notified Backend! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Testing](#testing)

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on constructive feedback
- Prioritize the community and project health

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Git
- Code editor (VS Code recommended)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/notified-backend.git
cd notified-backend

# Add upstream remote
git remote add upstream https://github.com/Java-Project-IM/notified-backend.git
```

### Setup Development Environment

```bash
# Run setup script
./setup.sh

# Or manually:
npm install
cp .env.example .env
# Edit .env with your settings

# Start development server
npm run dev
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code patterns
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Format code
npm run format

# Run tests (when available)
npm test
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Code Style

### JavaScript/Node.js

We use **ESLint** and **Prettier** for code consistency.

**Run before committing:**
```bash
npm run lint:fix
npm run format
```

**Key conventions:**
- Use `const` and `let`, avoid `var`
- Use arrow functions for callbacks
- Use async/await over promises
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused
- Use destructuring when appropriate

**Example:**
```javascript
/**
 * Get student by ID
 * @param {String} studentId - Student ID
 * @returns {Promise<Object>} Student object
 */
const getStudentById = async (studentId) => {
  const student = await Student.findById(studentId);
  
  if (!student) {
    throw new Error(ERROR_MESSAGES.STUDENT_NOT_FOUND);
  }
  
  return student;
};
```

### File Organization

- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data schemas
- **Middleware**: Request processing logic
- **Utils**: Reusable helper functions
- **Config**: Configuration files

### Naming Conventions

- **Files**: camelCase (e.g., `studentService.js`)
- **Classes**: PascalCase (e.g., `StudentService`)
- **Functions**: camelCase (e.g., `getStudentById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `HTTP_STATUS`)
- **Private functions**: prefix with underscore (e.g., `_generateToken`)

---

## Commit Guidelines

We follow **Conventional Commits** specification.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks
- **perf**: Performance improvements

### Examples

```bash
feat(auth): add password reset functionality

fix(student): resolve duplicate student number issue

docs(readme): update API documentation

refactor(services): simplify student service logic

chore(deps): update dependencies to latest versions
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] Code is properly commented
- [ ] Tests pass (when available)
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] No merge conflicts with main branch

### PR Template

When creating a PR, include:

**Description:**
- What changes were made?
- Why were these changes necessary?

**Type of Change:**
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

**Testing:**
- How was this tested?
- What test cases were covered?

**Related Issues:**
- Fixes #123
- Relates to #456

### Review Process

1. Automated checks must pass
2. At least one maintainer review required
3. All feedback must be addressed
4. Maintainer will merge when approved

---

## Project Structure

```
src/
├── config/          # App configuration
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
└── utils/           # Helper functions
```

### Adding New Features

**Example: Adding a new Subject service**

1. **Create Model** (`src/models/Subject.js`)
2. **Create Service** (`src/services/subjectService.js`)
3. **Create Controller** (`src/controllers/subjectController.js`)
4. **Create Routes** (`src/routes/subjectRoutes.js`)
5. **Add Route to App** (`src/app.js`)
6. **Update Documentation**

---

## Testing

### Unit Tests

```javascript
// tests/services/studentService.test.js
describe('StudentService', () => {
  describe('createStudent', () => {
    it('should create a new student', async () => {
      // Test implementation
    });
    
    it('should throw error if student number exists', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

```javascript
// tests/integration/student.test.js
describe('Student API', () => {
  it('POST /api/v1/students - should create student', async () => {
    const response = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token}`)
      .send(studentData);
    
    expect(response.status).toBe(201);
  });
});
```

---

## Common Tasks

### Adding a New Route

1. Create route file in `src/routes/`
2. Add route to `src/app.js`
3. Create corresponding controller
4. Create service logic
5. Update documentation

### Adding Validation

```javascript
// In routes file
const { body } = require('express-validator');
const { validate } = require('../middleware');

const createStudentValidation = [
  body('firstName').trim().notEmpty(),
  body('email').isEmail(),
];

router.post('/', createStudentValidation, validate, controller.create);
```

### Adding Middleware

```javascript
// src/middleware/yourMiddleware.js
const yourMiddleware = (req, res, next) => {
  // Your logic here
  next();
};

module.exports = yourMiddleware;
```

---

## Documentation

### Code Comments

```javascript
/**
 * Service description
 * 
 * @author Your Name
 * @version 1.0.0
 */

/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return description
 * @throws {Error} Error description
 */
```

### API Documentation

Update README.md with:
- Endpoint description
- Request/response examples
- Authentication requirements
- Error responses

---

## Questions?

- **GitHub Discussions**: Ask questions in Discussions
- **Issues**: Report bugs or request features
- **Email**: dev@notified.com

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

---

**Thank you for contributing to Notified Backend! 🎉**
