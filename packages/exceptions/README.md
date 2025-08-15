# 任务引擎异常系统设计与使用文档

## 1. 概述

任务引擎异常系统用于在任务脚本执行过程中规范化错误处理流程，提供一套统一的异常定义和处理机制。通过使用预定义的异常类型，可以使任务脚本中的错误处理更加清晰、可预测，并且便于日志记录和问题分析。

## 2. 系统架构

异常系统主要包含以下组件：

- **TaskExceptionCode**: 异常代码枚举，定义所有支持的错误类型及其对应的代码
- **TaskEngineException**: 所有任务引擎异常的基类
- **特定领域异常类**: 针对不同功能域（如钱包、社交媒体等）的具体异常类型

### 2.1 目录结构

异常系统按照功能领域组织为清晰的目录结构：

```
exceptions/
├── common/                     # 通用异常基础设施
│   ├── base.exception.ts       # 异常基类
│   ├── codes.enum.ts           # 异常代码枚举
│   ├── fallback.exception.ts   # 通用/兜底异常
│   └── index.ts                # 通用模块导出
├── wallet/                     # 钱包相关异常
│   ├── wallet.exception.ts     # 钱包异常类
│   └── index.ts                # 钱包模块导出
├── social/                     # 社交平台相关异常
│   ├── discord.exception.ts    # Discord 异常类
│   ├── x.exception.ts          # X(Twitter) 异常类
│   └── index.ts                # 社交模块导出
├── network/                    # 网络相关异常
│   ├── email.exception.ts      # 邮箱异常类
│   ├── ip.exception.ts         # IP/代理异常类
│   └── index.ts                # 网络模块导出
├── index.ts                    # 总导出文件
└── README.md                   # 文档说明
```

### 2.2 异常代码设计

异常代码按照功能域进行分组，每个功能域占用1000个代码范围：

- 10000-10999: 通用异常
- 11000-11999: 钱包相关异常
- 12000-12999: X(Twitter)相关异常
- 13000-13999: Discord相关异常
- 14000-14999: 邮箱相关异常
- 15000-15999: IP/代理相关异常

这种设计允许根据错误代码快速识别问题所属的功能域，并且预留了足够的空间以添加新的错误类型。

### 2.3 异常类层次结构

```
TaskEngineException (基类)
├── FallbackException (通用/兜底异常)
├── WalletException (钱包异常)
├── XException (X/Twitter异常)
├── DiscordException (Discord异常)
├── EmailException (邮箱异常)
└── IpException (IP/代理异常)
```

每个异常类都提供了一系列静态工厂方法，用于创建特定类型的错误实例。

## 3. 使用指南

### 3.1 引入异常类

```typescript
// 引入所有异常类
import { 
  TaskExceptionCode, 
  WalletException, 
  XException,
  // ... 其他需要的异常类
} from '@lulucat/exceptions';

// 或者按需引入特定领域的异常
import { WalletException } from '@lulucat/exceptions/wallet';
import { XException } from '@lulucat/exceptions/social';
```

### 3.2 在任务脚本中抛出异常

```typescript
// 在任务脚本中使用
async function exampleTask() {
  try {
    // 钱包操作失败时抛出特定异常
    if (!wallet.isConnected) {
      throw WalletException.connectionFailed('无法连接钱包', { walletAddress });
    }
    
    // X操作失败时抛出特定异常
    if (xAccount.isSuspended) {
      throw XException.accountSuspended('账号已被暂停', { accountId: xAccount.id });
    }

    // 也可以直接抛出错误，无需提供 message（静态方法中已提供默认的错误说明字符串） 和 details
    if (xAccount.isNotFound) {
      throw XException.accountNotFound();
    }

    // 其他操作...
  } catch (error) {
    // 错误处理逻辑
    // 可以捕获特定类型的异常或者重新抛出
    throw error;
  }
}
```

### 3.3 处理异常

```typescript
try {
  await executeTask();
} catch (error) {
  if (error instanceof WalletException) {
    // 处理钱包相关异常
    console.error(`钱包错误 [${error.code}]: ${error.message}`);
    // 可能的恢复策略
  } else if (error instanceof XException) {
    // 处理X相关异常
    console.error(`X错误 [${error.code}]: ${error.message}`);
    // 可能的恢复策略
  } else {
    // 处理其他类型的异常
    console.error('未知错误:', error);
  }
}
```

### 3.4 错误详情数据

所有异常类都支持通过第三个参数传入详细的错误信息：

```typescript
throw EmailException.sendFailed(
  '发送邮件失败', 
  {
    recipient: 'user@example.com',
    subject: '验证邮件',
    errorCode: 'SMTP_CONNECTION_FAILED',
    attemptCount: 3
  }
);
```

这些详情数据会被包含在异常对象中，可通过 `error.details` 访问，也会在调用 `toJSON()` 方法时包含在结果中。

### 3.5 将异常序列化

所有异常类都实现了 `toJSON()` 方法，便于将异常信息转换为可序列化的对象，用于日志记录或API响应：

```typescript
try {
  // 可能抛出异常的代码
} catch (error) {
  if (error instanceof TaskEngineException) {
    const serialized = error.toJSON();
    // 记录到日志系统
    logger.error('任务执行失败', serialized);
    // 或者返回给调用方
    return { success: false, error: serialized };
  }
}
```

## 4. 扩展指南

如需添加新的异常类型，请遵循以下步骤：

1. 在 `common/codes.enum.ts` 中添加新的异常代码，遵循现有的代码范围分配
2. 确定新异常所属的功能领域，如有必要，创建新的子目录
3. 创建新的异常类文件，继承 `TaskEngineException` 基类
4. 实现相应的静态工厂方法
5. 在对应目录的 index.ts 中导出新的异常类

示例：
```typescript
// 在 codes.enum.ts 中添加新的异常代码
export enum TaskExceptionCode {
  // 现有代码...
  
  // 添加新的功能域代码范围
  NEW_DOMAIN_ERROR = 16000,
  NEW_DOMAIN_SPECIFIC_ERROR = 16001,
  // ...
}

// 创建新的子目录和异常类
// new-domain/new-domain.exception.ts
import { TaskEngineException } from '../common/base.exception';
import { TaskExceptionCode } from '../common/codes.enum';

export class NewDomainException extends TaskEngineException {
  public static specificError(
    message = '特定错误发生',
    details?: Record<string, any>,
  ): NewDomainException {
    return new NewDomainException(
      TaskExceptionCode.NEW_DOMAIN_SPECIFIC_ERROR,
      message,
      details,
    );
  }
}

// 在 new-domain/index.ts 中导出
export { NewDomainException } from './new-domain.exception';

// 在主索引文件中添加新目录的导出
// 在 exceptions/index.ts 中添加
export * from './new-domain';
```

## 5. 最佳实践

1. **始终使用预定义的异常类**：避免直接抛出通用 Error 对象
2. **提供有意义的错误消息**：清晰描述错误原因
3. **包含相关的上下文信息**：通过 details 参数提供更多诊断信息
4. **在适当的抽象级别处理异常**：不要过早捕获异常，让它传播到能够有效处理它的代码层
5. **记录所有未处理的异常**：确保所有异常都被适当记录
6. **避免吞没异常**：如果捕获异常后无法恢复，应重新抛出或记录后抛出新的更具体的异常
7. **按领域组织异常**：利用目录结构使代码组织更清晰

通过遵循这些最佳实践，可以使任务脚本的错误处理更加健壮和可维护。 