---
title: Playwright 页面加载事件：domcontentloaded vs load
---

在 Playwright 中，domcontentloaded 和 load 是两个不同的页面加载事件，**load 事件比 domcontentloaded 事件更晚触发**。具体区别如下：

1. **domcontentloaded**
    - 在 HTML 文档被完全解析（DOM 树构建完成）且 **不等待** CSS、图片、iframe 等外部资源加载完成时触发。
    - 这意味着 JavaScript 代码已经可以安全地操作 DOM，但页面可能还没完全渲染。
2. **load**
    - 在页面 **所有资源**（包括 CSS、图片、iframe 等）都加载完成后触发。
    - 这个事件通常比 domcontentloaded 更晚，因为它需要等待额外的资源下载完成。

### **Playwright 使用示例：**
```
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });  // 只等 DOM 加载完
await page.goto('https://example.com', { waitUntil: 'load' });  // 等待所有资源加载完
```

所以，在正常情况下：
- **domcontentloaded 先触发**
- **load 后触发**（因为它需要等待更多资源加载完成）
如果你需要更早操作 DOM，可以监听 domcontentloaded；如果想确保所有资源都准备好，再执行操作，可以等到 load。