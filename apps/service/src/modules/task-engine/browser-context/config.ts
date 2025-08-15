// 浏览器上下文配置
export const BROWSER_CONTEXT = {
  // 使用的浏览器渠道，默认为chrome
  CHANNEL: 'chrome',
  // 是否禁用安全特性，默认为false
  DISABLE_SECURITY: false,
  // 是否启用确定性渲染，默认为false
  DETERMINISTIC_RENDERING: false,
};

// Chrome禁用的组件列表
export const CHROME_DISABLED_COMPONENTS = [
  // Playwright默认: https://github.com/microsoft/playwright/blob/41008eeddd020e2dee1c540f7c0cdfa337e99637/packages/playwright-core/src/server/chromium/chromiumSwitches.ts#L76
  // See https://github.com/microsoft/playwright/pull/10380
  'AcceptCHFrame', // 禁用AcceptCHFrame功能
  // See https://github.com/microsoft/playwright/pull/10679
  'AutoExpandDetailsElement', // 禁用自动展开details元素
  // See https://github.com/microsoft/playwright/issues/14047
  'AvoidUnnecessaryBeforeUnloadCheckSync', // 禁用不必要的beforeunload检查
  // See https://github.com/microsoft/playwright/pull/12992
  'CertificateTransparencyComponentUpdater', // 禁用证书透明度组件更新
  'DestroyProfileOnBrowserClose', // 在浏览器关闭时销毁配置文件
  // See https://github.com/microsoft/playwright/pull/13854
  'DialMediaRouteProvider', // 禁用媒体路由提供程序
  // Chromium正在禁用manifest版本2。只要Chromium实际上可以运行它，就允许测试它。
  // 在https://chromium-review.googlesource.com/c/chromium/src/+/6265903中禁用。
  'ExtensionManifestV2Disabled', // 禁用扩展清单V2禁用功能
  'GlobalMediaControls', // 禁用全局媒体控件
  // See https://github.com/microsoft/playwright/pull/27605
  'HttpsUpgrades', // 禁用HTTPS升级
  'ImprovedCookieControls', // 禁用改进的Cookie控制
  'LazyFrameLoading', // 禁用惰性框架加载
  // 隐藏URL地址栏中的Lens功能。它在非官方构建中不起作用。
  'LensOverlay', // 禁用镜头覆盖
  // See https://github.com/microsoft/playwright/pull/8162
  'MediaRouter', // 禁用媒体路由器
  // See https://github.com/microsoft/playwright/issues/28023
  'PaintHolding', // 禁用绘制保持
  // See https://github.com/microsoft/playwright/issues/32230
  'ThirdPartyStoragePartitioning', // 禁用第三方存储分区
  // See https://github.com/microsoft/playwright/issues/16126
  'Translate', // 禁用翻译功能
  'AutomationControlled', // 禁用自动化控制标志
  // 由我们添加:
  'OptimizationHints', // 禁用优化提示
  'ProcessPerSiteUpToMainFrameThreshold', // 禁用每站点进程限制
  'InterestFeedContentSuggestions', // 禁用兴趣信息内容建议
  'CalculateNativeWinOcclusion', // chrome通常会停止渲染不可见的标签（被前景窗口或其他应用程序遮挡）
  // 'BackForwardCache',  // 代理确实使用后退/前进导航，但如果我们移除该功能，可以禁用它
  'HeavyAdPrivacyMitigations', // 禁用重广告隐私缓解措施
  'PrivacySandboxSettings4', // 禁用隐私沙盒设置4
  'AutofillServerCommunication', // 禁用自动填充服务器通信
  'CrashReporting', // 禁用崩溃报告
  'OverscrollHistoryNavigation', // 禁用过度滚动历史导航
  'InfiniteSessionRestore', // 禁用无限会话恢复
  'ExtensionDisableUnsupportedDeveloper', // 禁用不支持的开发者扩展
];

// 无头模式的Chrome参数
export const CHROME_HEADLESS_ARGS = [
  '--headless=new', // 使用新的无头模式
];

// Docker环境中Chrome参数
export const CHROME_DOCKER_ARGS = [
  '--no-sandbox', // 禁用沙箱
  '--disable-gpu-sandbox', // 禁用GPU沙箱
  '--disable-setuid-sandbox', // 禁用setuid沙箱
  '--disable-dev-shm-usage', // 禁用/dev/shm使用
  '--no-xshm', // 禁用X共享内存
  '--no-zygote', // 禁用zygote进程
  '--single-process', // 使用单进程模式
];

// 禁用安全相关的Chrome参数
export const CHROME_DISABLE_SECURITY_ARGS = [
  '--disable-web-security', // 禁用Web安全
  '--disable-site-isolation-trials', // 禁用站点隔离试验
  '--disable-features=IsolateOrigins,site-per-process', // 禁用源隔离和每进程站点
  '--allow-running-insecure-content', // 允许运行不安全内容
  '--ignore-certificate-errors', // 忽略证书错误
  '--ignore-ssl-errors', // 忽略SSL错误
  '--ignore-certificate-errors-spki-list', // 忽略特定SPKI证书错误
];

// 确定性渲染的Chrome参数
export const CHROME_DETERMINISTIC_RENDERING_ARGS = [
  '--deterministic-mode', // 确定性模式
  '--js-flags=--random-seed=1157259159', // 设置JS随机种子
  '--force-device-scale-factor=2', // 强制设备缩放因子
  '--enable-webgl', // 启用WebGL
  // '--disable-skia-runtime-opts', // 禁用Skia运行时选项
  // '--disable-2d-canvas-clip-aa', // 禁用2D画布剪辑抗锯齿
  '--font-render-hinting=none', // 禁用字体渲染提示
  '--force-color-profile=srgb', // 强制使用sRGB颜色配置文件
];

// Chrome默认参数
export const CHROME_DEFAULT_ARGS = [
  // 由playwright默认提供: https://github.com/microsoft/playwright/blob/41008eeddd020e2dee1c540f7c0cdfa337e99637/packages/playwright-core/src/server/chromium/chromiumSwitches.ts#L76
  // 我们不需要在自己的配置中两次包含它们，但这是无害的
  '--disable-field-trial-config', // https://source.chromium.org/chromium/chromium/src/+/main:testing/variations/README.md
  '--disable-background-networking', // 禁用后台网络
  '--disable-background-timer-throttling', // 禁用后台计时器节流
  '--disable-backgrounding-occluded-windows', // 禁用背景遮挡窗口
  '--disable-back-forward-cache', // 避免在page.goBack()期间主请求未被拦截等意外情况
  '--disable-breakpad', // 禁用崩溃报告
  '--disable-client-side-phishing-detection', // 禁用客户端钓鱼检测
  '--disable-component-extensions-with-background-pages', // 禁用带有后台页面的组件扩展
  '--disable-component-update', // 避免启动后不必要的网络活动
  '--no-default-browser-check', // 不检查默认浏览器
  // '--disable-default-apps', // 禁用默认应用
  '--disable-dev-shm-usage', // 禁用/dev/shm使用
  // '--disable-extensions', // 禁用扩展
  // '--disable-features=' + disabledFeatures(assistantMode).join(','), // 禁用功能
  '--allow-pre-commit-input', // 在GPU渲染完成前允许页面JS稍早运行
  '--disable-hang-monitor', // 禁用挂起监视器
  '--disable-ipc-flooding-protection', // 禁用IPC洪水保护
  '--disable-popup-blocking', // 禁用弹出窗口阻止
  '--disable-prompt-on-repost', // 禁用重新发布提示
  '--disable-renderer-backgrounding', // 禁用渲染器后台处理
  // '--force-color-profile=srgb',  // 移至CHROME_DETERMINISTIC_RENDERING_ARGS
  '--metrics-recording-only', // 仅度量记录
  '--no-first-run', // 不显示首次运行对话框
  '--password-store=basic', // 使用基本密码存储
  '--use-mock-keychain', // 使用模拟钥匙链
  // See https://chromium-review.googlesource.com/c/chromium/src/+/2436773
  '--no-service-autorun', // 不自动运行服务
  '--export-tagged-pdf', // 导出标记PDF
  // https://chromium-review.googlesource.com/c/chromium/src/+/4853540
  '--disable-search-engine-choice-screen', // 禁用搜索引擎选择屏幕
  // https://issues.chromium.org/41491762
  '--unsafely-disable-devtools-self-xss-warnings', // 不安全地禁用DevTools自XSS警告
  '--enable-features=NetworkService,NetworkServiceInProcess', // 启用网络服务和进程内网络服务
  '--enable-network-information-downlink-max', // 启用网络信息下行最大值
  // 由我们添加:
  '--test-type=gpu', // GPU测试类型
  '--disable-sync', // 禁用同步
  '--allow-legacy-extension-manifests', // 允许旧版扩展清单
  '--allow-pre-commit-input', // 允许预提交输入
  '--disable-blink-features=AutomationControlled', // 禁用Blink自动化控制功能
  '--install-autogenerated-theme=0,0,0', // 安装自动生成的主题
  '--hide-scrollbars', // 隐藏滚动条
  '--log-level=2', // 设置日志级别
  // '--enable-logging=stderr', // 启用stderr日志
  '--disable-focus-on-load', // 禁用加载时聚焦
  '--disable-window-activation', // 禁用窗口激活
  '--generate-pdf-document-outline', // 生成PDF文档大纲
  '--no-pings', // 禁用ping
  '--ash-no-nudges', // 禁用ash提示
  '--disable-infobars', // 禁用信息栏
  '--simulate-outdated-no-au="Tue, 31 Dec 2099 23:59:59 GMT"', // 模拟过期无自动更新
  '--hide-crash-restore-bubble', // 隐藏崩溃恢复气泡
  '--suppress-message-center-popups', // 抑制消息中心弹出窗口
  '--disable-domain-reliability', // 禁用域可靠性
  '--disable-datasaver-prompt', // 禁用数据保存程序提示
  '--disable-speech-synthesis-api', // 禁用语音合成API
  '--disable-speech-api', // 禁用语音API
  '--disable-print-preview', // 禁用打印预览
  '--safebrowsing-disable-auto-update', // 禁用安全浏览自动更新
  '--disable-external-intent-requests', // 禁用外部意图请求
  '--disable-desktop-notifications', // 禁用桌面通知
  '--noerrdialogs', // 禁用错误对话框
  '--silent-debugger-extension-api', // 静默调试器扩展API
  `--disable-features=${CHROME_DISABLED_COMPONENTS.join(',')}`, // 禁用所有指定的Chrome功能
];

// 国家代码到locale的映射表
export const COUNTRY_TO_LOCALE = {
  US: 'en-US',
  GB: 'en-GB',
  CA: 'en-CA',
  AU: 'en-AU',
  CN: 'zh-CN',
  TW: 'zh-TW',
  HK: 'zh-HK',
  JP: 'ja-JP',
  KR: 'ko-KR',
  FR: 'fr-FR',
  DE: 'de-DE',
  IT: 'it-IT',
  ES: 'es-ES',
  RU: 'ru-RU',
  BR: 'pt-BR',
  PT: 'pt-PT',
  NL: 'nl-NL',
  SE: 'sv-SE',
  NO: 'nb-NO',
  DK: 'da-DK',
  FI: 'fi-FI',
  PL: 'pl-PL',
  TR: 'tr-TR',
  IN: 'en-IN',
  TH: 'th-TH',
  VN: 'vi-VN',
  ID: 'id-ID',
  MY: 'ms-MY',
  SG: 'en-SG',
  AE: 'ar-AE',
  SA: 'ar-SA',
  IL: 'he-IL',
  GR: 'el-GR',
  CZ: 'cs-CZ',
  HU: 'hu-HU',
  RO: 'ro-RO',
  UA: 'uk-UA',
  ZA: 'en-ZA',
  EG: 'ar-EG',
  AR: 'es-AR',
  MX: 'es-MX',
  CL: 'es-CL',
  CO: 'es-CO',
  PE: 'es-PE',
};

// 获取默认的locale
export const getDefaultLocale = (countryCode?: string): string => {
  if (!countryCode) return 'en-US';
  return COUNTRY_TO_LOCALE[countryCode] || 'en-US';
};
