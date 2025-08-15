# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 NestJS 的后端服务，使用 TypeScript 开发，主要用于管理任务执行引擎和相关资源。项目包含账户管理、代理 IP、浏览器指纹、任务执行等功能模块。

## 常用命令

### 开发环境
```bash
# 安装依赖
pnpm install

# 开发模式启动（自动重启）
pnpm run start:dev

# 本地开发模式
pnpm run start:local

# 测试环境启动
pnpm run start:test

# 生产环境构建和启动
pnpm run build
pnpm run start:prod
```

### 构建与部署
```bash
# 生产构建（包含代码混淆）
pnpm run build

# 只进行代码混淆
pnpm run obfuscate

# 格式化代码
pnpm run format

# 代码检查和修复
pnpm run lint
```

### 测试
```bash
# 运行单元测试
pnpm run test

# 监听模式运行测试
pnpm run test:watch

# 生成测试覆盖率报告
pnpm run test:cov

# 运行 E2E 测试
pnpm run test:e2e

# 调试模式运行测试
pnpm run test:debug
```

### 数据库操作
```bash
# 生成数据库迁移文件
pnpm run migration:generate

# 运行数据库迁移
pnpm run migration:run

# 回滚数据库迁移
pnpm run migration:revert

# 解密数据库数据
pnpm run decrypt-db
```

### 工具脚本
```bash
# 代理 IP 测试
pnpm run test:proxy-ips

# 导入任务结果
pnpm run import:task-results

# 批量修改代理类型
pnpm run batch-modify-proxy-types

# 同步账户组项目
pnpm run sync-account-group-items
```

## 项目架构

### 核心模块结构
- **src/modules/**: 功能模块目录
  - **account-groups/**: 账户组管理
  - **auth/**: 认证和授权
  - **browser-contexts/**: 浏览器上下文管理
  - **browser-fingerprints/**: 浏览器指纹管理
  - **discord-accounts/**: Discord 账户管理
  - **email-accounts/**: 邮箱账户管理
  - **evm-wallets/**: EVM 钱包管理
  - **proxy-ips/**: 代理 IP 管理
  - **twitter-accounts/**: Twitter 账户管理
  - **task-engine/**: 任务执行引擎（核心模块）
  - **tasks/**: 任务管理
  - **task-logs/**: 任务日志
  - **task-results/**: 任务结果

### 任务执行引擎 (task-engine)
这是项目的核心模块，包含：
- **browser-context/**: 浏览器上下文服务
- **queues/**: 任务队列管理
- **scripts/**: 任务脚本集合
  - **abs/**: ABS 相关任务脚本
  - **somnia/**: Somnia 相关任务脚本
  - **stork/**: Stork 相关任务脚本
  - **tdk/**: 任务开发工具包
- **workers/**: 任务工作进程
- **exceptions/**: 异常处理

### 数据库和配置
- **src/config/**: 配置文件
- **src/migrations/**: 数据库迁移文件
- **src/common/**: 公共模块（装饰器、DTO、过滤器、守卫、拦截器等）

### 技术栈
- **NestJS**: 后端框架
- **TypeORM**: ORM 数据库操作
- **MySQL**: 数据库
- **Redis**: 缓存和队列
- **Playwright**: 浏览器自动化
- **Winston**: 日志记录
- **JWT**: 身份验证

### 部署
- 使用 PM2 进行进程管理（ecosystem.config.js）
- 支持集群模式部署
- 生产环境包含代码混淆

### 开发注意事项
- 项目使用 pnpm 作为包管理器
- 代码风格使用 Prettier + ESLint
- 数据库操作统一通过 TypeORM
- 日志统一使用 Winston
- 异常处理有统一的过滤器
- API 响应有统一的转换拦截器