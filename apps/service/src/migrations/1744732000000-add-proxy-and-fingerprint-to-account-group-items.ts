import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProxyAndFingerprintToAccountGroupItems1744732000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 检查代理IP列是否存在
    const proxyColumnExists = await this.columnExists(queryRunner, 'account_group_items', 'proxy_ip_id');
    if (!proxyColumnExists) {
      // 添加代理IP外键
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        ADD COLUMN proxy_ip_id INT NULL COMMENT '代理IP ID';
      `);
    }
    
    // 检查外键是否存在
    const proxyForeignKeyExists = await this.foreignKeyExists(queryRunner, 'account_group_items', 'FK_account_group_items_proxy_ip');
    if (!proxyForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        ADD CONSTRAINT FK_account_group_items_proxy_ip 
        FOREIGN KEY (proxy_ip_id) REFERENCES proxy_ips(proxy_id) 
        ON DELETE SET NULL;
      `);
    }
    
    // 检查浏览器指纹列是否存在
    const fingerprintColumnExists = await this.columnExists(queryRunner, 'account_group_items', 'browser_fingerprint_id');
    if (!fingerprintColumnExists) {
      // 添加浏览器指纹外键
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        ADD COLUMN browser_fingerprint_id INT NULL COMMENT '浏览器指纹ID';
      `);
    }
    
    // 检查外键是否存在
    const fingerprintForeignKeyExists = await this.foreignKeyExists(queryRunner, 'account_group_items', 'FK_account_group_items_browser_fingerprint');
    if (!fingerprintForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        ADD CONSTRAINT FK_account_group_items_browser_fingerprint 
        FOREIGN KEY (browser_fingerprint_id) REFERENCES browser_fingerprints(id) 
        ON DELETE SET NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 检查外键约束是否存在
    const fingerprintForeignKeyExists = await this.foreignKeyExists(queryRunner, 'account_group_items', 'FK_account_group_items_browser_fingerprint');
    if (fingerprintForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        DROP FOREIGN KEY FK_account_group_items_browser_fingerprint;
      `);
    }
    
    const proxyForeignKeyExists = await this.foreignKeyExists(queryRunner, 'account_group_items', 'FK_account_group_items_proxy_ip');
    if (proxyForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE account_group_items 
        DROP FOREIGN KEY FK_account_group_items_proxy_ip;
      `);
    }
    
    // 检查列是否存在
    const fingerprintColumnExists = await this.columnExists(queryRunner, 'account_group_items', 'browser_fingerprint_id');
    const proxyColumnExists = await this.columnExists(queryRunner, 'account_group_items', 'proxy_ip_id');
    
    // 删除列
    if (fingerprintColumnExists || proxyColumnExists) {
      let dropQuery = `ALTER TABLE account_group_items`;
      
      if (fingerprintColumnExists) {
        dropQuery += ` DROP COLUMN browser_fingerprint_id`;
      }
      
      if (proxyColumnExists) {
        dropQuery += fingerprintColumnExists ? `,` : ``;
        dropQuery += ` DROP COLUMN proxy_ip_id`;
      }
      
      await queryRunner.query(dropQuery + `;`);
    }
  }

  // 辅助方法：检查列是否存在
  private async columnExists(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${table}' 
      AND COLUMN_NAME = '${column}'
    `);
    return result[0].count > 0;
  }

  // 辅助方法：检查外键约束是否存在
  private async foreignKeyExists(queryRunner: QueryRunner, table: string, foreignKey: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${table}' 
      AND CONSTRAINT_NAME = '${foreignKey}' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    return result[0].count > 0;
  }
} 