---
title: Playwright 常用 API 与最佳实践
---

## 目录
- [简介](#简介)
- [安装与设置](#安装与设置)
- [核心API](#核心api)
  - [浏览器与上下文](#浏览器与上下文)
  - [页面操作](#页面操作)
  - [定位器](#定位器)
  - [操作与交互](#操作与交互)
  - [等待与断言](#等待与断言)
  - [网络请求与响应](#网络请求与响应)
- [最佳实践](#最佳实践)
  - [定位策略](#定位策略)
  - [测试隔离](#测试隔离)
  - [调试技巧](#调试技巧)
  - [性能优化](#性能优化)
  - [CI/CD集成](#cicd集成)
- [常见问题与解决方案](#常见问题与解决方案)

## 简介

Playwright 是一个强大的端到端测试工具，支持 Chromium、Firefox 和 WebKit 浏览器。本文档旨在提供 Playwright 的常用 API 参考和最佳实践，帮助团队构建可靠、高效的自动化测试。

## 安装与设置

### 安装 Playwright

```bash
# 使用 npm
npm init playwright@latest

# 使用 yarn
yarn create playwright

# 使用 pnpm
pnpm create playwright
```

安装完成后，Playwright 会自动下载所需的浏览器。如需单独安装特定浏览器：

```bash
npx playwright install chromium
```

### 配置文件

Playwright 使用 `playwright.config.ts` (或 `.js`) 文件进行配置：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests',
  
  // 超时设置
  timeout: 30000,
  
  // 并发运行
  fullyParallel: true,
  
  // 失败重试
  retries: 2,
  
  // 报告
  reporter: 'html',
  
  // 项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
});
```

## 核心API

### 浏览器与上下文

#### 启动浏览器

```typescript
// 在测试中使用
import { test } from '@playwright/test';

test('浏览器操作', async ({ browser, page }) => {
  // browser 和 page 自动创建和管理
});

// 在非测试环境中使用
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
```

#### 浏览器上下文

```typescript
// 创建特定设备的上下文
import { devices } from '@playwright/test';

const context = await browser.newContext({
  ...devices['iPhone 12'],
});

// 创建带持久性存储的上下文
const context = await browser.newContext({
  storageState: 'auth.json',
});

// 保存身份验证状态
await context.storageState({ path: 'auth.json' });
```

### 页面操作

#### 导航

```typescript
// 导航到URL
await page.goto('https://example.com');

// 使用选项
await page.goto('https://example.com', {
  timeout: 30000,
  waitUntil: 'networkidle',
});

// 刷新页面
await page.reload();

// 后退/前进
await page.goBack();
await page.goForward();
```

#### 获取信息

```typescript
// 获取页面标题
const title = await page.title();

// 获取当前URL
const url = await page.url();

// 获取页面内容
const content = await page.content();
```

### 定位器

定位器是 Playwright 的核心功能，支持自动等待和重试机制。

#### 基于角色的定位

优先使用，更符合用户访问方式：

```typescript
// 按钮
await page.getByRole('button', { name: '登录' }).click();

// 文本框
await page.getByRole('textbox', { name: '用户名' }).fill('user');

// 复选框
await page.getByRole('checkbox', { name: '记住我' }).check();

// 下拉框
await page.getByRole('combobox', { name: '选择国家' }).selectOption('中国');

// 表格
const table = page.getByRole('table', { name: '用户数据' });
```

#### 文本和标签定位

```typescript
// 文本定位
await page.getByText('欢迎使用').click();

// 标签定位
await page.getByLabel('密码').fill('12345');

// 占位符定位
await page.getByPlaceholder('电子邮件').fill('test@example.com');

// 标题定位
await page.getByTitle('帮助').hover();

// Alt文本定位（常用于图片）
await page.getByAltText('公司徽标').click();
```

#### 测试ID定位

适合稳定性测试，不依赖于UI文本：

```typescript
await page.getByTestId('submit-button').click();
```

#### CSS和XPath定位

当其他方法不适用时的备选方案：

```typescript
// CSS选择器
await page.locator('.submit-button').click();

// XPath选择器（尽量避免使用）
await page.locator('//button[contains(text(), "提交")]').click();
```

#### 链式定位和过滤

```typescript
// 链式定位
const form = page.getByRole('form');
await form.getByLabel('用户名').fill('user');

// 文本过滤
await page.getByRole('listitem').filter({ hasText: '产品2' }).click();

// 过滤具有特定子元素的元素
await page.getByRole('listitem')
  .filter({ has: page.getByRole('button', { name: '删除' }) })
  .click();

// 组合过滤器
await page
  .getByRole('listitem')
  .filter({ hasText: '产品2' })
  .filter({ has: page.getByRole('button', { name: '添加到购物车' }) })
  .click();
```

### 操作与交互

#### 点击操作

```typescript
// 基本点击
await page.getByRole('button', { name: '提交' }).click();

// 修饰键点击
await page.getByText('链接').click({ modifiers: ['Shift'] });

// 右键点击
await page.getByText('项目').click({ button: 'right' });

// 双击
await page.getByText('编辑').dblclick();
```

#### 输入操作

```typescript
// 填充表单
await page.getByLabel('用户名').fill('user');

// 清除并填充
await page.getByLabel('搜索').clear();
await page.getByLabel('搜索').fill('查询词');

// 按键输入
await page.getByLabel('评论').press('Tab');

// 输入带延迟的文本（模拟真实用户）
await page.getByLabel('消息').fill('Hello', { delay: 100 });
```

#### 选择操作

```typescript
// 复选框
await page.getByLabel('同意条款').check();
await page.getByRole('checkbox').uncheck();

// 单选按钮
await page.getByLabel('选项A').check();

// 下拉选择
await page.getByLabel('国家').selectOption('中国');
await page.getByLabel('城市').selectOption({ label: '上海' });
await page.getByRole('combobox').selectOption({ value: 'option-1' });
```

#### 上传文件

```typescript
// 单文件上传
await page.getByLabel('上传照片').setInputFiles('path/to/file.jpg');

// 多文件上传
await page.getByLabel('上传文档').setInputFiles([
  'path/to/file1.pdf',
  'path/to/file2.pdf'
]);

// 清除上传
await page.getByLabel('上传文档').setInputFiles([]);
```

#### 拖放操作

```typescript
await page.getByText('源项目').dragTo(page.getByText('目标区域'));
```

### 等待与断言

#### 元素状态等待

Playwright 有内置的自动等待机制，但有时需要明确等待：

```typescript
// 等待元素可见
await page.getByRole('dialog').waitFor({ state: 'visible' });

// 等待元素不可见
await page.getByRole('spinner').waitFor({ state: 'hidden' });

// 等待元素被挂载到DOM
await page.getByText('结果').waitFor();
```

#### 条件等待

```typescript
// 等待URL变化
await page.waitForURL('**/success');

// 等待导航完成
await Promise.all([
  page.waitForNavigation(),
  page.getByRole('button', { name: '提交' }).click()
]);

// 等待网络请求
await page.waitForRequest('**/api/data');
await page.waitForResponse('**/api/data');

// 等待特定函数返回true
await page.waitForFunction(() => window.scrollY > 0);
```

#### 断言

```typescript
import { expect } from '@playwright/test';

// 元素是否可见
await expect(page.getByText('提交成功')).toBeVisible();

// 元素是否包含文本
await expect(page.getByRole('alert')).toContainText('验证失败');

// 元素数量
await expect(page.getByRole('listitem')).toHaveCount(5);

// 属性值
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByLabel('记住我')).toBeChecked();

// 元素状态
await expect(page.getByLabel('密码')).toHaveValue('');

// 页面状态
await expect(page).toHaveTitle(/首页/);
await expect(page).toHaveURL(/\/dashboard/);
```

#### 软断言

不立即终止测试执行，而是收集所有失败的断言：

```typescript
// 软断言
await expect.soft(page.getByText('状态')).toHaveText('成功');
await page.getByRole('link', { name: '下一页' }).click();
```

### 网络请求与响应

#### 监听网络请求

```typescript
// 监听所有请求
page.on('request', request => {
  console.log('>>', request.method(), request.url());
});

// 监听所有响应
page.on('response', response => {
  console.log('<<', response.status(), response.url());
});
```

#### 拦截和修改请求

```typescript
// 请求拦截
await page.route('**/api/users', route => {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ name: 'John' }])
  });
});

// 修改请求
await page.route('**/api/submit', route => {
  const request = route.request();
  // 修改请求体
  return route.continue({
    postData: JSON.stringify({
      ...JSON.parse(request.postData()),
      extra: 'data'
    })
  });
});
```

#### API测试

```typescript
// 使用APIRequestContext进行API测试
const request = await playwright.request.newContext({
  baseURL: 'https://api.example.com',
  extraHTTPHeaders: {
    'Authorization': `Bearer ${token}`,
  },
});

const response = await request.get('/users');
expect(response.ok()).toBeTruthy();
const body = await response.json();
expect(body.users).toHaveLength(3);
```

## 最佳实践

### 定位策略

1. **优先使用对用户可见的属性**
   
   选择与用户实际交互方式最接近的定位器，按优先级：

   ```
   1. 角色 (getByRole)
   2. 标签 (getByLabel)
   3. 文本 (getByText)
   4. 占位符 (getByPlaceholder)
   5. 测试ID (getByTestId)
   6. CSS选择器 (locator)
   ```

2. **避免使用XPath**
   
   XPath选择器容易受DOM结构更改影响，维护成本高。

3. **使用定位器生成工具**

   ```bash
   # 使用代码生成器生成定位器
   npx playwright codegen example.com
   ```
4. **避免使用 waitForTimeout()**

   ```typescript
    // 不推荐
    await page.waitForTimeout(3000); // 强制等待3秒

    // 推荐
    await page.waitForSelector('button#submit', { state: 'attached' }); // 等待元素出现
   ```

### 测试隔离

每个测试应该相互独立，不依赖于其他测试的状态。

1. **使用beforeEach优化重复工作**

   ```typescript
   test.beforeEach(async ({ page }) => {
     // 在每个测试前执行登录
     await page.goto('https://example.com/login');
     await page.getByLabel('用户名').fill('user');
     await page.getByLabel('密码').fill('password');
     await page.getByRole('button', { name: '登录' }).click();
   });
   ```

2. **共享身份验证状态**

   ```typescript
   test.beforeAll(async ({ browser }) => {
     // 登录并保存身份验证状态
     const context = await browser.newContext();
     const page = await context.newPage();
     await page.goto('https://example.com/login');
     await page.getByLabel('用户名').fill('user');
     await page.getByLabel('密码').fill('password');
     await page.getByRole('button', { name: '登录' }).click();
     
     // 保存状态到文件
     await context.storageState({ path: 'auth.json' });
     await context.close();
   });
   
   // 在测试项目中使用已保存的身份验证状态
   test.use({ storageState: 'auth.json' });
   ```

3. **避免测试第三方依赖**

   使用请求拦截模拟第三方服务：

   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.route('**/api/third-party', route => {
       return route.fulfill({
         status: 200,
         body: JSON.stringify({ data: 'mock data' })
       });
     });
   });
   ```

### 调试技巧

1. **使用调试模式**

   ```bash
   # 调试特定测试
   npx playwright test example.spec.ts:10 --debug
   ```

2. **使用跟踪查看器**

   ```typescript
   // 在配置中启用跟踪
   use: {
     trace: 'on-first-retry', // 或 'on', 'retain-on-failure'
   }
   
   // 查看跟踪
   npx playwright show-trace trace.zip
   ```

3. **屏幕截图和视频**

   ```typescript
   // 测试失败时自动截图
   use: {
     screenshot: 'only-on-failure',
   }
   
   // 手动截图
   await page.screenshot({ path: 'screenshot.png' });
   
   // 录制视频
   use: {
     video: 'on-first-retry', // 或 'on', 'retain-on-failure'
   }
   ```

4. **查看控制台日志**

   ```typescript
   // 监听控制台消息
   page.on('console', message => {
     console.log(`页面日志 [${message.type()}]: ${message.text()}`);
   });
   ```

### 性能优化

1. **并行测试执行**

   在配置文件中启用并行执行：

   ```typescript
   export default defineConfig({
     fullyParallel: true,
     workers: 4, // 或 'max'
   });
   ```

2. **单文件内并行**

   ```typescript
   test.describe.configure({ mode: 'parallel' });
   
   test('测试1', async ({ page }) => {
     // ...
   });
   
   test('测试2', async ({ page }) => {
     // ...
   });
   ```

3. **分片执行**

   在CI环境中分布式运行测试：

   ```bash
   npx playwright test --shard=1/3
   ```

4. **仅安装必要的浏览器**

   ```bash
   # 仅安装Chromium
   npx playwright install chromium
   ```

### CI/CD集成

1. **GitHub Actions 配置**

   ```yaml
   name: Playwright Tests
   on:
     push:
       branches: [ main, master ]
     pull_request:
       branches: [ main, master ]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v3
       - uses: actions/setup-node@v3
         with:
           node-version: 18
       - name: Install dependencies
         run: npm ci
       - name: Install Playwright
         run: npx playwright install --with-deps
       - name: Run Playwright tests
         run: npx playwright test
       - uses: actions/upload-artifact@v3
         if: always()
         with:
           name: playwright-report
           path: playwright-report/
           retention-days: 30
   ```

2. **Docker中运行测试**

   ```Dockerfile
   FROM mcr.microsoft.com/playwright:v1.40.0-jammy
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   CMD npx playwright test
   ```

## 常见问题与解决方案

### 1. 元素未找到

**问题**：`TimeoutError: waiting for locator('...') failed: timeout exceeded`

**解决方案**：
- 检查定位器是否正确
- 增加超时时间：`await page.getByText('加载中').waitFor({ timeout: 60000 })`
- 使用自动等待：`await expect(page.getByText('加载中')).toBeVisible({ timeout: 60000 })`

### 2. 隐藏元素无法点击

**问题**：`Element is not visible`

**解决方案**：
- 检查元素是否真的可见：`await expect(element).toBeVisible()`
- 强制点击（不推荐）：`await element.click({ force: true })`
- 使用JavaScript点击：`await element.evaluate(el => el.click())`

### 3. iframe中的元素操作

**解决方案**：
```typescript
const frame = page.frameLocator('#my-iframe');
await frame.getByRole('button', { name: '提交' }).click();
```

### 4. 处理弹窗和对话框

```typescript
// 处理alert/confirm/prompt
page.on('dialog', dialog => dialog.accept('输入文本'));

// 处理新窗口
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.getByText('在新窗口打开').click()
]);
```

### 5. 移动端测试特有问题

```typescript
// 模拟触摸/滑动
await page.getByText('轮播').tap();
await page.getByText('列表').swipe({ deltaX: 0, deltaY: 100 });

// 模拟地理位置
await context.setGeolocation({ latitude: 31.2304, longitude: 121.4737 });

// 模拟设备方向
await context.setOrientation('landscape');
``` 