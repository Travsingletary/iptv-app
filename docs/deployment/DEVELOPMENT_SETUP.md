# 🛠️ Development Environment Setup Guide

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd <project-name>

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Start development server
npm run dev
```

## Detailed Setup

### 1. System Requirements

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher
- **Git**: v2.x or higher
- **Docker**: v24.x or higher (optional)
- **VS Code**: Recommended IDE

### 2. Initial Configuration

#### Install Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

#### Clone and Setup

```bash
# Clone with SSH (recommended)
git clone git@github.com:your-org/your-repo.git

# Or with HTTPS
git clone https://github.com/your-org/your-repo.git

cd your-repo
npm install
```

### 3. Environment Variables

#### Create Local Environment File

```bash
cp .env.example .env.local
```

#### Required Variables

Edit `.env.local` with your development values:

```env
# Supabase (Get from Supabase Dashboard)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Local Development
VITE_API_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags (Development)
VITE_ENABLE_DEBUG=true
VITE_MOCK_API=false
```

### 4. Database Setup

#### Option A: Use Remote Supabase (Recommended)

1. Create account at https://supabase.com
2. Create new project
3. Copy connection details to `.env.local`

#### Option B: Local Supabase with Docker

```bash
# Start local Supabase
docker-compose --profile with-supabase up -d

# Access Supabase Studio
open http://localhost:54323
```

### 5. Git Configuration

#### Setup Git Hooks

```bash
# Install Husky
npm run prepare

# Verify hooks are installed
ls -la .husky/
```

#### Configure Git

```bash
# Set your user info
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Enable helpful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

### 6. VS Code Setup

#### Recommended Extensions

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "github.copilot",
    "eamodio.gitlens"
  ]
}
```

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### 7. Development Workflow

#### Start Development Server

```bash
# Standard development
npm run dev

# With Docker
docker-compose up

# With specific port
PORT=3001 npm run dev
```

#### Run Quality Checks

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Run all checks
npm run check-all
```

### 8. Testing

#### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

#### E2E Testing

```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

### 9. Debugging

#### Browser DevTools

1. Open Chrome DevTools: `Cmd/Ctrl + Shift + I`
2. Install React DevTools extension
3. Use Network tab for API debugging
4. Use Console for runtime errors

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug in Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

### 10. Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run format          # Format with Prettier
npm run type-check      # TypeScript checking

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Deployment
npm run deploy:staging  # Deploy to staging
npm run deploy:prod     # Deploy to production
```

### 11. Troubleshooting

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables Not Loading

1. Check `.env.local` exists
2. Restart dev server
3. Verify variable names start with `VITE_`

#### Build Failures

```bash
# Clear cache
npm run clean
npm run build
```

### 12. Best Practices

1. **Always work in feature branches**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

3. **Use conventional commits**
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   git commit -m "docs: update README"
   ```

4. **Run checks before pushing**
   ```bash
   npm run check-all
   ```

5. **Review your changes**
   ```bash
   git diff --staged
   ```

## Resources

- [Project Documentation](../README.md)
- [API Documentation](../api/README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)