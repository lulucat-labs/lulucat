---
title: 在 Playwright 中获取剪切板内容
---

### **方法 1：使用 navigator.clipboard.readText()**

```
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // 让页面有焦点，确保能够访问剪切板
    await page.goto('about:blank');

    // 读取剪切板内容
    const clipboardText = await page.evaluate(async () => {
        return await navigator.clipboard.readText();
    });

    console.log('Clipboard content:', clipboardText);

    await browser.close();
})();
```

> **注意**：要在无头模式（headless: false）下运行，或者确保 Playwright 的 context 启用了剪切板权限。

---

### **方法 2：使用 Electron 或其他 API**

如果你的 Playwright 运行环境不支持 navigator.clipboard.readText()（比如某些无头模式），可以考虑用 Node.js 的 clipboardy 这样的库：

```
npm install clipboardy
```

然后：

```
const clipboardy = require('clipboardy');

(async () => {
    const clipboardText = clipboardy.readSync();
    console.log('Clipboard content:', clipboardText);
})();
```

### **方法 3：在 Chromium DevTools 协议中使用 browserContext.grantPermissions**

如果 Playwright 阻止了剪切板访问权限，你可以手动授予：

```
await context.grantPermissions(['clipboard-read']);
```

然后再执行 navigator.clipboard.readText()。