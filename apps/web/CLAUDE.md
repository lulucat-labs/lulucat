# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

### 核心开发命令
- `npm run start:dev` - 启动开发服务器（推荐，设置 REACT_APP_ENV=dev 和 MOCK=none）
- `npm run dev` - 启动开发服务器的快捷方式
- `npm run build` - 构建生产版本
- `npm run preview` - 预览构建后的应用

### 代码质量检查
- `npm run lint` - 运行完整的代码检查（包括 ESLint, Prettier 和 TypeScript 检查）
- `npm run lint:fix` - 自动修复 ESLint 问题
- `npm run tsc` - 仅运行 TypeScript 类型检查
- `npm run prettier` - 格式化代码

### 测试
- `npm run test` - 运行 Jest 测试
- `npm run test:coverage` - 生成测试覆盖率报告
- `npm run jest` - 直接运行 Jest

## 技术架构

### 核心框架和依赖
- **UmiJS v4.1.1** + @umijs/max - 基于 React 的企业级前端框架
- **React 18** + TypeScript - 严格类型检查模式
- **Ant Design v5.13.2** + Pro Components - UI 组件库
- **ethers.js v5.7.2** - 以太坊区块链集成

### 项目结构
- `src/app.tsx` - 应用入口点和布局配置
- `src/access.ts` - 权限访问控制
- `config/config.ts` - UmiJS 应用配置
- `config/routes.ts` - 路由定义
- `src/pages/` - 页面组件（按功能模块组织）
- `src/components/` - 共享组件
- `src/services/ant-design-pro/` - API 服务层

### 业务领域概念
这是一个自动化任务管理平台，主要管理：
- **Task System**: 任务创建、执行和结果统计
- **Account Management**: Twitter、Discord、Email 等账号管理和分组
- **Blockchain**: EVM 钱包生成和管理
- **Browser Automation**: 浏览器指纹、上下文和代理IP配置
- **Project Management**: 项目和脚本管理

### 代码约定（基于 .cursor/rules）
- 使用函数式组件 + Hooks，避免类组件
- 组件名采用 PascalCase，文件名对应
- 自定义 Hook 以 "use" 开头
- 服务文件使用 kebab-case 命名
- 严格的 TypeScript 类型检查
- 使用 Ant Design Form 组件处理表单
- API 调用隔离在服务层，使用类型化的请求/响应接口
- 总是使用 @ant-design/pro-components 内的组件编写页面

### 开发环境配置
- 支持多环境配置：dev、test、pre
- Mock 数据在 `mock/` 目录
- 国际化支持多语言（zh-CN、en-US 等）
- 使用 Less 进行样式开发

### 状态管理
- 主要使用 React Hooks 和 Context
- 自定义 Hooks 用于复杂逻辑（如 `useTaskPolling.ts`）
- 组件状态尽量本地化

### 测试配置
- Jest 配置在 `jest.config.ts`
- 测试设置文件：`tests/setupTests.jsx`
- 测试文件与组件同目录放置
