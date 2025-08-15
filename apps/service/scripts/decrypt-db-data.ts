/**
# 数据库账号解密脚本

## 背景
这个脚本用于将数据库中的加密账号信息转换为明文存储。这是系统架构更新的一部分，不再使用加密/解密机制来存储敏感字段。

## 特点
- 处理Twitter账号、Discord账号和邮箱账号的加密字段
- 解密现有数据并更新为明文
- 对无法解密的数据提供警告并保留原值
- 输出处理统计信息

## 使用方法

### 准备工作
确保已经设置正确的环境变量。脚本依赖于 `.env` 文件中的以下变量：
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `ENCRYPTION_KEY`（用于解密数据）

### 运行脚本
```bash
# 直接运行解密脚本，无需编译
npm run decrypt-db
```


### 建议操作步骤
1. 在运行脚本前备份数据库
2. 在非生产环境中先测试脚本
3. 在维护窗口期间运行脚本
4. 验证应用程序能否正常工作

## 注意事项
- 脚本执行过程中会输出详细日志
- 对于无法解密的数据会保留原始加密值并输出警告
- 完成后会显示成功/失败的统计信息 
 */
import { DataSource } from 'typeorm';
import { getStandaloneDatabaseConfig } from '../src/config/database.config';
import { CryptoUtil } from '../src/common/utils/crypto.util';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function main() {
  console.log('开始数据库账号密码解密过程...');

  // 获取加密密钥
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error('错误: 未找到加密密钥，请确保环境变量 ENCRYPTION_KEY 已设置');
    process.exit(1);
  }

  // 创建数据库连接
  console.log('正在连接数据库...');
  const dataSource = new DataSource(
    getStandaloneDatabaseConfig({
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    }),
  );

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 处理 Twitter 账号数据
    await processTwitterAccounts(dataSource, encryptionKey);

    // 处理 Discord 账号数据
    await processDiscordAccounts(dataSource, encryptionKey);

    // 处理邮箱账号数据
    await processEmailAccounts(dataSource, encryptionKey);

    // 处理代理IP数据
    await processProxyIps(dataSource, encryptionKey);

    console.log('所有解密操作已完成');
  } catch (error) {
    console.error('发生错误:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

/**
 * 解密 Twitter 账号数据
 */
async function processTwitterAccounts(
  dataSource: DataSource,
  encryptionKey: string,
) {
  console.log('\n开始处理 Twitter 账号数据...');
  const twitterAccounts = await dataSource.query(
    'SELECT twitter_id, password, recovery_email_password, token FROM twitter_accounts',
  );
  console.log(`找到 ${twitterAccounts.length} 个 Twitter 账号记录`);

  let successCount = 0;
  let errorCount = 0;

  for (const account of twitterAccounts) {
    try {
      // 解密密码
      let password = account.password;
      if (password && password.includes(':')) {
        try {
          password = CryptoUtil.decrypt(password, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: Twitter账号 ID=${account.twitter_id} 的密码解密失败，保持原值`,
          );
        }
      }

      // 解密辅助邮箱密码
      let recoveryEmailPassword = account.recovery_email_password;
      if (recoveryEmailPassword && recoveryEmailPassword.includes(':')) {
        try {
          recoveryEmailPassword = CryptoUtil.decrypt(
            recoveryEmailPassword,
            encryptionKey,
          );
        } catch (e) {
          console.warn(
            `警告: Twitter账号 ID=${account.twitter_id} 的辅助邮箱密码解密失败，保持原值`,
          );
        }
      }

      // 解密令牌
      let token = account.token;
      if (token && token.includes(':')) {
        try {
          token = CryptoUtil.decrypt(token, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: Twitter账号 ID=${account.twitter_id} 的令牌解密失败，保持原值`,
          );
        }
      }

      // 更新数据库
      await dataSource.query(
        'UPDATE twitter_accounts SET password = ?, recovery_email_password = ?, token = ? WHERE twitter_id = ?',
        [password, recoveryEmailPassword, token, account.twitter_id],
      );

      successCount++;
    } catch (error) {
      console.error(
        `处理 Twitter 账号 ID=${account.twitter_id} 时出错:`,
        error,
      );
      errorCount++;
    }
  }

  console.log(`Twitter 账号处理完成: 成功 ${successCount}, 错误 ${errorCount}`);
}

/**
 * 解密 Discord 账号数据
 */
async function processDiscordAccounts(
  dataSource: DataSource,
  encryptionKey: string,
) {
  console.log('\n开始处理 Discord 账号数据...');
  const discordAccounts = await dataSource.query(
    'SELECT discord_id, password, email_password, token FROM discord_accounts',
  );
  console.log(`找到 ${discordAccounts.length} 个 Discord 账号记录`);

  let successCount = 0;
  let errorCount = 0;

  for (const account of discordAccounts) {
    try {
      // 解密密码
      let password = account.password;
      if (password && password.includes(':')) {
        try {
          password = CryptoUtil.decrypt(password, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: Discord账号 ID=${account.discord_id} 的密码解密失败，保持原值`,
          );
        }
      }

      // 解密邮箱密码
      let emailPassword = account.email_password;
      if (emailPassword && emailPassword.includes(':')) {
        try {
          emailPassword = CryptoUtil.decrypt(emailPassword, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: Discord账号 ID=${account.discord_id} 的邮箱密码解密失败，保持原值`,
          );
        }
      }

      // 解密令牌
      let token = account.token;
      if (token && token.includes(':')) {
        try {
          token = CryptoUtil.decrypt(token, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: Discord账号 ID=${account.discord_id} 的令牌解密失败，保持原值`,
          );
        }
      }

      // 更新数据库
      await dataSource.query(
        'UPDATE discord_accounts SET password = ?, email_password = ?, token = ? WHERE discord_id = ?',
        [password, emailPassword, token, account.discord_id],
      );

      successCount++;
    } catch (error) {
      console.error(
        `处理 Discord 账号 ID=${account.discord_id} 时出错:`,
        error,
      );
      errorCount++;
    }
  }

  console.log(`Discord 账号处理完成: 成功 ${successCount}, 错误 ${errorCount}`);
}

/**
 * 解密邮箱账号数据
 */
async function processEmailAccounts(
  dataSource: DataSource,
  encryptionKey: string,
) {
  console.log('\n开始处理邮箱账号数据...');
  const emailAccounts = await dataSource.query(
    'SELECT email_id, email_password, refresh_token FROM email_accounts',
  );
  console.log(`找到 ${emailAccounts.length} 个邮箱账号记录`);

  let successCount = 0;
  let errorCount = 0;

  for (const account of emailAccounts) {
    try {
      // 解密邮箱密码
      let emailPassword = account.email_password;
      if (emailPassword && emailPassword.includes(':')) {
        try {
          emailPassword = CryptoUtil.decrypt(emailPassword, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: 邮箱账号 ID=${account.email_id} 的密码解密失败，保持原值`,
          );
        }
      }

      // 解密刷新令牌
      let refreshToken = account.refresh_token;
      if (refreshToken && refreshToken.includes(':')) {
        try {
          refreshToken = CryptoUtil.decrypt(refreshToken, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: 邮箱账号 ID=${account.email_id} 的刷新令牌解密失败，保持原值`,
          );
        }
      }

      // 更新数据库
      await dataSource.query(
        'UPDATE email_accounts SET email_password = ?, refresh_token = ? WHERE email_id = ?',
        [emailPassword, refreshToken, account.email_id],
      );

      successCount++;
    } catch (error) {
      console.error(`处理邮箱账号 ID=${account.email_id} 时出错:`, error);
      errorCount++;
    }
  }

  console.log(`邮箱账号处理完成: 成功 ${successCount}, 错误 ${errorCount}`);
}

/**
 * 解密代理IP数据
 */
async function processProxyIps(dataSource: DataSource, encryptionKey: string) {
  console.log('\n开始处理代理IP数据...');
  const proxyIps = await dataSource.query(
    'SELECT proxy_id, password FROM proxy_ips WHERE password IS NOT NULL',
  );
  console.log(`找到 ${proxyIps.length} 个代理IP记录`);

  let successCount = 0;
  let errorCount = 0;

  for (const proxy of proxyIps) {
    try {
      // 解密密码
      let password = proxy.password;
      if (password && password.includes(':')) {
        try {
          password = CryptoUtil.decrypt(password, encryptionKey);
        } catch (e) {
          console.warn(
            `警告: 代理IP ID=${proxy.proxy_id} 的密码解密失败，保持原值`,
          );
        }
      }

      // 更新数据库
      await dataSource.query(
        'UPDATE proxy_ips SET password = ? WHERE proxy_id = ?',
        [password, proxy.proxy_id],
      );

      successCount++;
    } catch (error) {
      console.error(`处理代理IP ID=${proxy.proxy_id} 时出错:`, error);
      errorCount++;
    }
  }

  console.log(`代理IP处理完成: 成功 ${successCount}, 错误 ${errorCount}`);
}

// 执行脚本
if (require.main === module) {
  main().catch(console.error);
}
