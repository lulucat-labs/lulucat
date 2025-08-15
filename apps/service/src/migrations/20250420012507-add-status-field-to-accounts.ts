import { MigrationInterface, QueryRunner } from 'typeorm';
import { AccountStatus } from '../common/types/account-status.enum';

export class AddStatusFieldToAccounts20250420012507
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 为所有表添加status字段

    // 检查浏览器指纹表中是否存在status列，不存在则添加
    const browserFingerprintColumns = await queryRunner.query(
      `SHOW COLUMNS FROM browser_fingerprints LIKE 'status'`,
    );
    if (browserFingerprintColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE browser_fingerprints
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }

    // 检查Discord账号表中是否存在status列，不存在则添加
    const discordAccountColumns = await queryRunner.query(
      `SHOW COLUMNS FROM discord_accounts LIKE 'status'`,
    );
    if (discordAccountColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE discord_accounts
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }

    // 检查邮箱账号表中是否存在status列，不存在则添加
    const emailAccountColumns = await queryRunner.query(
      `SHOW COLUMNS FROM email_accounts LIKE 'status'`,
    );
    if (emailAccountColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE email_accounts
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }

    // 检查EVM钱包表中是否存在status列，不存在则添加
    const evmWalletColumns = await queryRunner.query(
      `SHOW COLUMNS FROM evm_wallets LIKE 'status'`,
    );
    if (evmWalletColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE evm_wallets
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }

    // 处理代理IP表
    // 1. 检查并移除is_active字段
    const proxyIpIsActiveColumn = await queryRunner.query(
      `SHOW COLUMNS FROM proxy_ips LIKE 'is_active'`,
    );

    // 如果存在is_active字段，直接移除
    if (proxyIpIsActiveColumn.length > 0) {
      await queryRunner.query(`
        ALTER TABLE proxy_ips DROP COLUMN is_active
      `);
    }

    // 2. 添加status字段
    const proxyIpStatusColumn = await queryRunner.query(
      `SHOW COLUMNS FROM proxy_ips LIKE 'status'`,
    );

    if (proxyIpStatusColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE proxy_ips
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }

    // 检查Twitter账号表中是否存在status列，不存在则添加
    const twitterAccountColumns = await queryRunner.query(
      `SHOW COLUMNS FROM twitter_accounts LIKE 'status'`,
    );
    if (twitterAccountColumns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE twitter_accounts
        ADD COLUMN status ENUM('${AccountStatus.NORMAL}', '${AccountStatus.INVALID}')
        NOT NULL DEFAULT '${AccountStatus.NORMAL}'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除所有表中的状态字段
    await queryRunner.query(`
      ALTER TABLE browser_fingerprints DROP COLUMN status
    `);
    await queryRunner.query(`
      ALTER TABLE discord_accounts DROP COLUMN status
    `);
    await queryRunner.query(`
      ALTER TABLE email_accounts DROP COLUMN status
    `);
    await queryRunner.query(`
      ALTER TABLE evm_wallets DROP COLUMN status
    `);

    // 处理代理IP表：移除status字段，恢复is_active字段
    await queryRunner.query(`
      ALTER TABLE proxy_ips DROP COLUMN status
    `);

    // 恢复is_active字段
    const proxyIpIsActiveColumn = await queryRunner.query(
      `SHOW COLUMNS FROM proxy_ips LIKE 'is_active'`,
    );

    if (proxyIpIsActiveColumn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE proxy_ips
        ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
      `);
    }

    await queryRunner.query(`
      ALTER TABLE twitter_accounts DROP COLUMN status
    `);
  }
}
