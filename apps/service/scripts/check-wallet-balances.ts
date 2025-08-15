import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getEthBalance } from '@lulucat/tdk/wallet';

// 加载环境变量
config();

interface WalletBalanceCheck {
  exchangeToOkx?: {
    balance: string;
    status: boolean;
    id: string;
    updated: boolean;
  };
  zKBridgeABS?: {
    balance: string;
    status: boolean;
    id: string;
    updated: boolean;
  };
}

interface TaskResultRecord {
  id: number;
  result: any;
}

async function checkAndUpdateWalletBalances(): Promise<void> {
  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    logging: false,
  });

  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 使用原生SQL查询获取任务结果
    const taskResults = await dataSource.query('SELECT id, result FROM task_results');
    console.log(`找到 ${taskResults.length} 条任务结果记录`);

    // 存储结果的数组
    const balanceResults: WalletBalanceCheck[] = [];
    let processedCount = 0;
    let errorCount = 0;
    let successCount = 0;
    let updatedCount = 0;

    // 遍历每个任务结果
    for (const taskResult of taskResults) {
      processedCount++;
      if (processedCount % 10 === 0) {
        console.log(`已处理 ${processedCount}/${taskResults.length} 条记录...`);
      }

      try {
        // MySQL JSON字段可能会被返回为字符串，需要解析
        const result = typeof taskResult.result === 'string' 
          ? JSON.parse(taskResult.result) 
          : taskResult.result;
        
        if (!result) continue;

        const walletBalanceCheck: WalletBalanceCheck = {};
        let hasChanges = false;
        let needDbUpdate = false;
        let updatedResult = { ...result };

        // 检查 exchangeToOkx 状态
        if (result.tasks && result.tasks.exchangeToOkx === false && result.wallet && result.wallet.address) {
          console.log(`检查 exchangeToOkx 状态: ${result.wallet.address}`);
          try {
            // 调用 getEthBalance 检查 arbitrum 和 zksync 余额
            const balanceResult = await getEthBalance(result.wallet.address, ['arbitrum', 'zksync']);
            const totalBalance = balanceResult.totalBalance;
            const hasBalance = totalBalance > 0;
            
            walletBalanceCheck.exchangeToOkx = {
              balance: totalBalance.toString(),
              status: hasBalance,
              id: result.wallet.address,
              updated: false
            };
            
            // 如果有余额，更新任务状态
            if (hasBalance) {
              updatedResult.tasks = {
                ...updatedResult.tasks,
                exchangeToOkx: true
              };
              needDbUpdate = true;
              walletBalanceCheck.exchangeToOkx.updated = true;
              console.log(`exchangeToOkx 检查结果: 余额=${totalBalance}, 状态已更新为true`);
            } else {
              console.log(`exchangeToOkx 检查结果: 余额=${totalBalance}, 状态保持为false`);
            }
            
            hasChanges = true;
          } catch (error) {
            console.error(`检查 exchangeToOkx 余额失败: ${error.message}`);
            errorCount++;
          }
        }

        // 检查 zKBridgeABS 状态
        if (result.tasks && result.tasks.zKBridgeABS === false && result.absWallet && result.absWallet.address) {
          console.log(`检查 zKBridgeABS 状态: ${result.absWallet.address}`);
          try {
            // 调用 getEthBalance 检查 abstract 余额
            const balanceResult = await getEthBalance(result.absWallet.address, ['abstract']);
            const totalBalance = balanceResult.totalBalance;
            const hasBalance = totalBalance > 0;
            
            walletBalanceCheck.zKBridgeABS = {
              balance: totalBalance.toString(),
              status: hasBalance,
              id: result.absWallet.address,
              updated: false
            };
            
            // 如果有余额，更新任务状态
            if (hasBalance) {
              updatedResult.tasks = {
                ...updatedResult.tasks,
                zKBridgeABS: true
              };
              needDbUpdate = true;
              walletBalanceCheck.zKBridgeABS.updated = true;
              console.log(`zKBridgeABS 检查结果: 余额=${totalBalance}, 状态已更新为true`);
            } else {
              console.log(`zKBridgeABS 检查结果: 余额=${totalBalance}, 状态保持为false`);
            }
            
            hasChanges = true;
          } catch (error) {
            console.error(`检查 zKBridgeABS 余额失败: ${error.message}`);
            errorCount++;
          }
        }

        // 如果需要更新数据库
        if (needDbUpdate) {
          try {
            await dataSource.query(
              'UPDATE task_results SET result = ? WHERE id = ?',
              [JSON.stringify(updatedResult), taskResult.id]
            );
            updatedCount++;
            console.log(`已更新数据库记录 ID=${taskResult.id}`);
          } catch (updateError) {
            console.error(`更新数据库记录 ID=${taskResult.id} 失败:`, updateError);
            errorCount++;
          }
        }

        // 如果有变更，添加到结果数组
        if (hasChanges) {
          balanceResults.push(walletBalanceCheck);
          successCount++;
        }
      } catch (error) {
        console.error(`处理记录 ID=${taskResult.id} 时出错:`, error);
        errorCount++;
      }
    }

    // 创建 assets 目录（如果不存在）
    const assetsDir = path.join(__dirname, '..', 'assets');
    try {
      await fs.mkdir(assetsDir, { recursive: true });
    } catch (error) {
      console.error('创建 assets 目录失败:', error);
    }

    // 将结果写入 JSON 文件
    const outputPath = path.join(assetsDir, 'wallet-balances.json');
    await fs.writeFile(outputPath, JSON.stringify(balanceResults, null, 2), 'utf8');
    
    console.log(`检查完成，总记录: ${taskResults.length}, 成功: ${successCount}, 更新: ${updatedCount}, 错误: ${errorCount}`);
    console.log(`结果已保存到: ${outputPath}`);
  } catch (err) {
    console.error('发生错误:', err);
    throw err;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 脚本入口
if (require.main === module) {
  checkAndUpdateWalletBalances()
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('脚本执行失败:', err);
      process.exit(1);
    });
} 