import { DataSource } from 'typeorm';
import { TaskResult } from '../src/modules/task-results/entities/task-result.entity';
import { AccountGroupItem } from '../src/modules/account-groups/entities/account-group-item.entity';
import { AccountGroup } from '../src/modules/account-groups/entities/account-group.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Project } from '../src/modules/projects/entities/project.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { Script } from '../src/modules/scripts/entities/script.entity';
import { TaskLog } from '../src/modules/task-logs/entities/task-log.entity';
import { DiscordAccount } from '../src/modules/discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../src/modules/email-accounts/entities/email-account.entity';
import { EvmWallet } from '../src/modules/evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../src/modules/twitter-accounts/entities/twitter-account.entity';
import { ProxyIp } from '../src/modules/proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../src/modules/browser-fingerprints/entities/browser-fingerprint.entity';
import { BrowserContext } from '../src/modules/browser-contexts/entities/browser-context.entity';
import { CryptoUtil } from '../src/common/utils/crypto.util';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// 加载环境变量
config();

interface WalletData {
  taskResultId: number;
  accountGroupItemId: number;
  evmWalletAddress: string;
  evmWalletPrivateKey: string;
  absWalletAddress: string;
  absWalletPrivateKey: string;
  resultJson: string;
}

interface TaskResultData {
  wallet?: {
    address: string;
    privateKey: string;
  };
  absWallet?: {
    address: string;
    privateKey: string;
  };
  [key: string]: any;
}

/**
 * 从用户输入获取解密密钥
 */
async function getDecryptionKey(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('请输入解密密钥: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * 安全解密私钥
 */
function safeDecrypt(encryptedKey: string, secret: string): string {
  try {
    return CryptoUtil.decrypt(encryptedKey, secret);
  } catch (error) {
    console.error(`解密失败: ${error.message}`);
    return '';
  }
}

/**
 * 转换为CSV安全字符串
 */
function toCsvSafeString(value: string): string {
  // 如果包含逗号、引号或换行符，需要用引号包围并转义引号
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 导出用户钱包数据
 */
async function exportUserWallets(userId: number): Promise<void> {
  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      TaskResult,
      AccountGroupItem,
      AccountGroup,
      User,
      Project,
      Task,
      Script,
      TaskLog,
      DiscordAccount,
      EmailAccount,
      EvmWallet,
      TwitterAccount,
      ProxyIp,
      BrowserFingerprint,
      BrowserContext,
    ],
    synchronize: false,
    logging: false,
  });

  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 验证用户是否存在
    const user = await dataSource.manager.findOne(User, {
      where: { userId: userId },
    });

    if (!user) {
      console.error(`用户ID ${userId} 不存在`);
      return;
    }

    console.log(`找到用户: ${user.userId}`);

    // 查找用户的账号组
    const accountGroups = await dataSource.manager.find(AccountGroup, {
      where: { userId },
      relations: ['items'],
    });

    if (accountGroups.length === 0) {
      console.log('该用户没有账号组');
      return;
    }

    console.log(`找到 ${accountGroups.length} 个账号组:`);
    accountGroups.forEach((group) => {
      console.log(`- ${group.name} (ID: ${group.id}, 包含 ${group.items.length} 个条目)`);
    });

    // 收集所有账号组条目ID
    const accountGroupItemIds: number[] = [];
    accountGroups.forEach((group) => {
      group.items.forEach((item) => {
        accountGroupItemIds.push(item.id);
      });
    });

    if (accountGroupItemIds.length === 0) {
      console.log('账号组中没有条目');
      return;
    }

    console.log(`总共 ${accountGroupItemIds.length} 个账号组条目`);

    // 查找相关的任务结果
    const taskResults = await dataSource.manager
      .createQueryBuilder(TaskResult, 'tr')
      .where('tr.account_group_item_id IN (:...itemIds)', { itemIds: accountGroupItemIds })
      .getMany();

    if (taskResults.length === 0) {
      console.log('没有找到相关的任务结果');
      return;
    }

    console.log(`找到 ${taskResults.length} 条任务结果`);

    // 过滤包含钱包数据的结果
    const walletResults = taskResults.filter((result) => {
      try {
        const resultData: TaskResultData = result.result;
        return resultData.wallet || resultData.absWallet;
      } catch {
        return false;
      }
    });

    if (walletResults.length === 0) {
      console.log('没有找到包含钱包数据的任务结果');
      return;
    }

    console.log(`找到 ${walletResults.length} 条包含钱包数据的任务结果`);

    // 获取解密密钥
    const decryptionKey = await getDecryptionKey();
    
    if (!decryptionKey) {
      console.error('解密密钥不能为空');
      return;
    }

    // 处理数据
    const walletDataList: WalletData[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const taskResult of walletResults) {
      try {
        const resultData: TaskResultData = taskResult.result;
        
        const walletData: WalletData = {
          taskResultId: taskResult.id,
          accountGroupItemId: taskResult.accountGroupItemId,
          evmWalletAddress: '',
          evmWalletPrivateKey: '',
          absWalletAddress: '',
          absWalletPrivateKey: '',
          resultJson: JSON.stringify(resultData),
        };

        // 处理 EVM 钱包
        if (resultData.wallet) {
          walletData.evmWalletAddress = resultData.wallet.address || '';
          if (resultData.wallet.privateKey) {
            const decryptedKey = safeDecrypt(resultData.wallet.privateKey, decryptionKey);
            walletData.evmWalletPrivateKey = decryptedKey;
          }
        }

        // 处理 ABS 钱包
        if (resultData.absWallet) {
          walletData.absWalletAddress = resultData.absWallet.address || '';
          if (resultData.absWallet.privateKey) {
            const decryptedKey = safeDecrypt(resultData.absWallet.privateKey, decryptionKey);
            walletData.absWalletPrivateKey = decryptedKey;
          }
        }

        walletDataList.push(walletData);
        successCount++;
      } catch (error) {
        console.error(`处理任务结果 ${taskResult.id} 时出错:`, error.message);
        failCount++;
      }
    }

    console.log(`数据处理完成: 成功 ${successCount} 条, 失败 ${failCount} 条`);

    if (walletDataList.length === 0) {
      console.log('没有可导出的数据');
      return;
    }

    // 生成CSV文件
    const csvHeader = [
      'task_result_id',
      'account_group_item_id',
      'evm_wallet_address',
      'evm_wallet_private_key',
      'abs_wallet_address',
      'abs_wallet_private_key',
      'result_json'
    ].join(',');

    const csvRows = walletDataList.map((data) => {
      return [
        data.taskResultId.toString(),
        data.accountGroupItemId.toString(),
        toCsvSafeString(data.evmWalletAddress),
        toCsvSafeString(data.evmWalletPrivateKey),
        toCsvSafeString(data.absWalletAddress),
        toCsvSafeString(data.absWalletPrivateKey),
        toCsvSafeString(data.resultJson),
      ].join(',');
    });

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // 创建输出目录
    const outputDir = path.join(__dirname, '..', 'task-result');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `user_${userId}_wallets_${timestamp}.csv`;
    const filePath = path.join(outputDir, filename);

    // 写入文件
    fs.writeFileSync(filePath, csvContent, 'utf8');

    console.log(`\n导出完成!`);
    console.log(`文件路径: ${filePath}`);
    console.log(`总记录数: ${walletDataList.length}`);
    
    // 统计信息
    const evmWalletCount = walletDataList.filter(d => d.evmWalletAddress).length;
    const absWalletCount = walletDataList.filter(d => d.absWalletAddress).length;
    console.log(`包含EVM钱包: ${evmWalletCount} 条`);
    console.log(`包含ABS钱包: ${absWalletCount} 条`);

  } catch (error) {
    console.error('执行过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error('使用方法: npm run export:user-wallets <userId>');
    console.error('示例: npm run export:user-wallets 1');
    process.exit(1);
  }

  const userId = parseInt(args[0]);
  
  if (isNaN(userId) || userId <= 0) {
    console.error('用户ID必须是正整数');
    process.exit(1);
  }

  await exportUserWallets(userId);
}

// 执行主函数
if (require.main === module) {
  main().catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
} 