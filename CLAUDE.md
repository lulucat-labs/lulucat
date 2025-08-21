# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Root-level Commands (using pnpm workspaces)
- `pnpm dev` - Start both web and service in parallel
- `pnpm dev:web` - Start only the web frontend
- `pnpm dev:service` - Start only the service backend

### Service (Backend) Commands
Located in `apps/service/`:
- `pnpm dev` - Start development server (alias for start:local)
- `pnpm build` - Build production bundle with obfuscation
- `pnpm start:local` - Start with local environment configuration
- `pnpm start:prod` - Start production server
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm test` - Run Jest tests
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm migration:generate` - Generate new database migration
- `pnpm migration:run` - Run pending migrations
- `pnpm format` - Format code with Prettier

### Web (Frontend) Commands  
Located in `apps/web/`:
- `pnpm dev` - Start development server (alias for start:dev)
- `pnpm build` - Build production bundle
- `pnpm lint` - Run full linting (ESLint + Prettier + TypeScript)
- `pnpm lint:fix` - Auto-fix ESLint issues
- `pnpm test` - Run Jest tests
- `pnpm tsc` - TypeScript type checking only

## High-Level Architecture

### Project Structure
This is a **monorepo** using pnpm workspaces with three main parts:
- `apps/service/` - NestJS backend API server
- `apps/web/` - Ant Design Pro React frontend
- `packages/` - Shared libraries (tdk, exceptions)

### Backend (Service) Architecture
**Framework**: NestJS with TypeScript, TypeORM, MySQL
**Key Concepts**:
- **Task Engine**: Core automation system using Playwright for browser automation
- **Queue System**: Uses better-queue for task execution management
- **Multi-Account Management**: Unified management of Twitter, Discord, email accounts
- **Browser Isolation**: Fingerprinting and context management for account protection
- **Blockchain Integration**: EVM wallet management and interactions

**Module Organization**:
- `task-engine/` - Core task execution with browser contexts, queues, and workers
- Account modules: `discord-accounts/`, `twitter-accounts/`, `email-accounts/`, `evm-wallets/`
- Infrastructure: `browser-contexts/`, `browser-fingerprints/`, `proxy-ips/`
- Data: `tasks/`, `task-results/`, `task-logs/`, `projects/`, `scripts/`

### Frontend (Web) Architecture  
**Framework**: UmiJS v4 + React 18 + Ant Design v5 + TypeScript
**Key Patterns**:
- Uses Ant Design Pro Components for consistent UI
- Service layer in `src/services/` for API integration
- Custom hooks for complex state management (e.g., `useTaskPolling`)
- Page-level components organized by business domain

### Shared Packages
- `@lulucat/tdk` - Task Development Kit with browser automation utilities, social media helpers, DeFi operations
- `@lulucat/exceptions` - Common exception classes for network, social, and wallet operations

### Development Environment
- **Database**: MySQL with TypeORM migrations
- **Browser Automation**: Playwright with Chromium
- **Task Queue**: better-queue for concurrent task processing  
- **Security**: Private key encryption, browser fingerprinting for account isolation
- **Logging**: Winston with daily log rotation

### Key Business Flows
1. **Account Management**: Import/manage social accounts and wallets in groups
2. **Task Creation**: Define automation scripts for blockchain projects (ABS, Somnia, Stork)
3. **Task Execution**: Queue-driven execution with browser contexts and proxy rotation
4. **Result Tracking**: Real-time monitoring and result aggregation across accounts

### Code Conventions
- TypeScript strict mode enabled across all apps
- NestJS decorators and dependency injection patterns
- Database entities use TypeORM decorators
- Frontend follows Ant Design Pro conventions
- Shared utilities in TDK package for task script development