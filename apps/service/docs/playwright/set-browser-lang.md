---
title: 在 Playwright 中设置浏览器语言
---

在 Playwright 中，你可以通过 locale 选项配置浏览器的语言为英文（如 en-US）。可以在 browser.newContext() 或 browserType.launchPersistentContext() 中设置 locale 参数，例如：

### **方法 1：在 browser.newContext() 里设置 locale**

```
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        locale: 'en-US'  // 设置浏览器语言为英文
    });
    const page = await context.newPage();

    await page.goto('https://www.google.com');
    await page.screenshot({ path: 'screenshot.png' });

    await browser.close();
})();
```

---

### **方法 2：在 launchPersistentContext() 里设置 locale**

如果你使用的是**持久化上下文**（即保留用户数据目录），可以这样设置：

```
const { chromium } = require('playwright');

(async () => {
    const userDataDir = './user-data'; // 指定用户数据目录
    const browser = await chromium.launchPersistentContext(userDataDir, {
        locale: 'en-US'  // 设置语言
    });

    const page = await browser.newPage();
    await page.goto('https://www.wikipedia.org');

    await browser.close();
})();
```

---

### **方法 3：使用 --lang 命令行参数**

如果你想要更低层级的控制，可以使用 Chromium 的 --lang 命令行参数：

```
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        args: ['--lang=en-US']  // 设置浏览器语言
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://www.google.com');
    await page.screenshot({ path: 'screenshot.png' });

    await browser.close();
})();
```

---

### **验证浏览器语言**

你可以在 Playwright 中执行 JavaScript 代码来检查浏览器语言：

```
const browserLanguage = await page.evaluate(() => navigator.language);
console.log('Browser Language:', browserLanguage);
```

如果返回的是 "en-US"，说明设置成功。