import { DataSource } from 'typeorm';
import { AccountGroupItem } from '../src/modules/account-groups/entities/account-group-item.entity';
import { AccountGroup } from '../src/modules/account-groups/entities/account-group.entity';
import { DiscordAccount } from '../src/modules/discord-accounts/entities/discord-account.entity';
import { EmailAccount } from '../src/modules/email-accounts/entities/email-account.entity';
import { EvmWallet } from '../src/modules/evm-wallets/entities/evm-wallet.entity';
import { TwitterAccount } from '../src/modules/twitter-accounts/entities/twitter-account.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { Project } from '../src/modules/projects/entities/project.entity';
import { Script } from '../src/modules/scripts/entities/script.entity';
import { TaskLog } from '../src/modules/task-logs/entities/task-log.entity';
import { ProxyIp } from '../src/modules/proxy-ips/entities/proxy-ip.entity';
import { BrowserFingerprint } from '../src/modules/browser-fingerprints/entities/browser-fingerprint.entity';
import { BrowserContext } from '../src/modules/browser-contexts/entities/browser-context.entity';

import { config } from 'dotenv';
import { Between, FindOptionsWhere } from 'typeorm';

// 加载环境变量
config();

interface CreateAccountGroupItemsOptions {
  accountGroupId: number;
  startEmailAccountId: number;
  endEmailAccountId: number;
}

async function createAccountGroupItems(
  options: CreateAccountGroupItemsOptions,
): Promise<void> {
  const { accountGroupId, startEmailAccountId, endEmailAccountId } = options;

  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      AccountGroupItem,
      AccountGroup,
      DiscordAccount,
      EmailAccount,
      EvmWallet,
      TwitterAccount,
      User,
      Task,
      Project,
      Script,
      TaskLog,
      ProxyIp,
      BrowserFingerprint,
      BrowserContext,
    ],
    synchronize: false,
    logging: true,
  });

  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 验证账号组是否存在
    const accountGroup = await dataSource.manager.findOne(AccountGroup, {
      where: { id: accountGroupId } as FindOptionsWhere<AccountGroup>,
    });

    if (!accountGroup) {
      throw new Error(`账号组 ID ${accountGroupId} 不存在`);
    }

    // 验证邮箱账号ID范围是否存在
    const emailAccountCount = await dataSource.manager.count(EmailAccount, {
      where: {
        emailId: Between(startEmailAccountId, endEmailAccountId),
      } as FindOptionsWhere<EmailAccount>,
    });

    if (emailAccountCount !== endEmailAccountId - startEmailAccountId + 1) {
      throw new Error(
        `邮箱账号ID范围 ${startEmailAccountId} - ${endEmailAccountId} 中有不存在的账号`,
      );
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 批量创建账号项数据
      for (
        let emailAccountId = startEmailAccountId;
        emailAccountId <= endEmailAccountId;
        emailAccountId++
      ) {
        const accountGroupItem = new AccountGroupItem();
        accountGroupItem.accountGroupId = accountGroupId;
        accountGroupItem.emailAccountId = emailAccountId;
        accountGroupItem.discordAccountId = null;
        accountGroupItem.evmWalletId = null;
        accountGroupItem.twitterAccountId = null;

        await queryRunner.manager.save(accountGroupItem);
        console.log(
          `创建账号项成功: accountGroupId=${accountGroupId}, emailAccountId=${emailAccountId}`,
        );
      }

      await queryRunner.commitTransaction();
      console.log('所有账号项创建成功');
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  } catch (err) {
    console.error('发生错误:', err);
    throw err;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// 使用示例
if (require.main === module) {
  const options: CreateAccountGroupItemsOptions = {
    accountGroupId: parseInt(process.argv[2] || '8'),
    startEmailAccountId: parseInt(process.argv[3] || '20'),
    endEmailAccountId: parseInt(process.argv[4] || '119'),
  };

  if (
    !options.accountGroupId ||
    !options.startEmailAccountId ||
    !options.endEmailAccountId
  ) {
    console.error(
      '请提供必要的参数: accountGroupId startEmailAccountId endEmailAccountId',
    );
    process.exit(1);
  }

  createAccountGroupItems(options)
    .then(() => {
      console.log('脚本执行完成');
      process.exit(0);
    })
    .catch((err) => {
      console.error('脚本执行失败:', err);
      process.exit(1);
    });
}
