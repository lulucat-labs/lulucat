# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

LuluCat is an open-source Web3 airdrop task automation platform that supports high-concurrency task script execution in fingerprint browser environments, with integrated management capabilities for X, Discord, email, wallet accounts, and proxy IPs.

## Development Commands

### Root Level (Workspace Management)
```bash
# Install all dependencies across workspace
pnpm install

# Start all apps in development mode (parallel)
pnpm dev

# Start specific applications
pnpm dev:web    # Frontend only
pnpm dev:service # Backend only
```

### Backend Service Commands (apps/service)
```bash
# Development
pnpm --filter @lulucat/service start:local    # Local development with hot reload
pnpm --filter @lulucat/service start:dev      # Development mode with watch
pnpm --filter @lulucat/service start:test     # Test environment
pnpm --filter @lulucat/service start:prod     # Production mode

# Building and Production
pnpm --filter @lulucat/service build          # Build with code obfuscation
pnpm --filter @lulucat/service obfuscate      # Code obfuscation only

# Testing
pnpm --filter @lulucat/service test           # Unit tests
pnpm --filter @lulucat/service test:watch     # Watch mode
pnpm --filter @lulucat/service test:cov       # Coverage report
pnpm --filter @lulucat/service test:e2e       # End-to-end tests

# Database Operations
pnpm --filter @lulucat/service migration:generate  # Generate migration
pnpm --filter @lulucat/service migration:run       # Run migrations
pnpm --filter @lulucat/service migration:revert    # Revert migration
pnpm --filter @lulucat/service decrypt-db          # Decrypt database data

# Utility Scripts
pnpm --filter @lulucat/service test:proxy-ips           # Test proxy IPs
pnpm --filter @lulucat/service import:task-results      # Import task results
pnpm --filter @lulucat/service sync-account-group-items # Sync account groups
pnpm --filter @lulucat/service batch-modify-proxy-types # Batch modify proxy types

# Code Quality
pnpm --filter @lulucat/service lint    # ESLint check and fix
pnpm --filter @lulucat/service format  # Prettier formatting
```

### Frontend Web Commands (apps/web)
```bash
# Development
pnpm --filter @lulucat/web start:dev     # Development mode (recommended)
pnpm --filter @lulucat/web start:test    # Test environment
pnpm --filter @lulucat/web start:pre     # Pre-production environment

# Building and Preview
pnpm --filter @lulucat/web build         # Production build
pnpm --filter @lulucat/web preview       # Preview built app
pnpm --filter @lulucat/web analyze       # Bundle analysis

# Testing
pnpm --filter @lulucat/web test          # Jest tests
pnpm --filter @lulucat/web test:coverage # Coverage report

# Code Quality
pnpm --filter @lulucat/web lint          # Full lint check (ESLint + Prettier + TypeScript)
pnpm --filter @lulucat/web lint:fix      # Auto-fix ESLint issues
pnpm --filter @lulucat/web prettier      # Format code
pnpm --filter @lulucat/web tsc           # TypeScript type check
```

### Workspace Packages
```bash
# Build TDK (Task Development Kit)
pnpm --filter @lulucat/tdk build
pnpm --filter @lulucat/tdk dev      # Watch mode

# Build Exceptions package
pnpm --filter @lulucat/exceptions build
pnpm --filter @lulucat/exceptions dev  # Watch mode
```

## High-Level Architecture

### Monorepo Structure
- **apps/service**: NestJS backend API server with task execution engine
- **apps/web**: React frontend built with UmiJS and Ant Design Pro
- **apps/desktop**: Desktop application (placeholder)
- **packages/tdk**: Task Development Kit - shared utilities for script development
- **packages/exceptions**: Common exception classes shared across workspace

### Backend Service Architecture (apps/service)

**Core Technologies**: NestJS, TypeORM, MySQL, Redis, Playwright, Winston

**Key Modules**:
- **task-engine/**: Core task execution system
  - **browser-context/**: Browser session management with fingerprinting
  - **queues/**: Task queue management using better-queue
  - **scripts/**: Project-specific automation scripts (ABS, Somnia, Stork)
  - **workers/**: Task worker processes for concurrent execution
- **account management**: Twitter, Discord, email account handling
- **evm-wallets/**: Ethereum wallet generation and management
- **proxy-ips/**: Proxy IP management and rotation
- **browser-fingerprints/**: Browser fingerprinting for account isolation

**Data Flow**: 
1. Tasks created through web interface
2. Queued in Redis-backed task queues
3. Workers spawn isolated browser contexts with unique fingerprints
4. Scripts executed via Playwright automation
5. Results stored and logged for monitoring

### Frontend Web Architecture (apps/web)

**Core Technologies**: React 18, UmiJS v4, Ant Design Pro v2, TypeScript

**Key Features**:
- Multi-environment support (dev, test, pre, production)
- Ethereum wallet integration via ethers.js
- Real-time task monitoring and result visualization
- Account management interfaces for social media and blockchain accounts
- Project and script management dashboards

### Shared Packages

**@lulucat/tdk** (Task Development Kit):
- Modular exports for wallet, browser, DeFi, network, and social media utilities
- Ethereum/blockchain interaction helpers
- Browser automation utilities for task scripts
- Common networking and API interaction tools

**@lulucat/exceptions**:
- Standardized exception classes across the platform
- Error handling utilities

### Development Environment

**Database**: MySQL with TypeORM migrations
**Caching**: Redis for task queues and session storage
**Browser Automation**: Playwright with custom fingerprinting
**Process Management**: PM2 for production deployment (cluster mode)
**Code Quality**: ESLint, Prettier, TypeScript strict mode

### Task Script Development

Scripts are organized by project (ABS, Somnia, Stork) within the task-engine module. The TDK package provides utilities for:
- Wallet operations and blockchain interactions
- Social media automation (Twitter, Discord)
- Browser context management with anti-detection
- Network requests with proxy rotation
- DeFi protocol interactions

### Security Features

- Private key encryption for wallet storage
- Account execution environment isolation via browser contexts
- Fingerprint browser environments for account protection
- Proxy IP integration for geographic and network isolation
