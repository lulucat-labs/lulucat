import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeysToTaskLogs20250517154416
  implements MigrationInterface
{
  // 检查外键是否存在
  private async foreignKeyExists(
    queryRunner: QueryRunner,
    table: string,
    foreignKey: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA = DATABASE() 
      AND TABLE_NAME = '${table}' 
      AND CONSTRAINT_NAME = '${foreignKey}' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `);
    return result[0].count > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // task_id 外键
    const taskForeignKey = 'FK_task_logs_task';
    const taskForeignKeyExists = await this.foreignKeyExists(
      queryRunner,
      'task_logs',
      taskForeignKey,
    );
    if (!taskForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE task_logs 
        ADD CONSTRAINT ${taskForeignKey} 
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
      `);
    }

    // account_group_item_id 外键
    const agiForeignKey = 'FK_task_logs_account_group_item';
    const agiForeignKeyExists = await this.foreignKeyExists(
      queryRunner,
      'task_logs',
      agiForeignKey,
    );
    if (!agiForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE task_logs 
        ADD CONSTRAINT ${agiForeignKey} 
        FOREIGN KEY (account_group_item_id) REFERENCES account_group_items(id) ON DELETE SET NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // account_group_item_id 外键
    const agiForeignKey = 'FK_task_logs_account_group_item';
    const agiForeignKeyExists = await this.foreignKeyExists(
      queryRunner,
      'task_logs',
      agiForeignKey,
    );
    if (agiForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE task_logs 
        DROP FOREIGN KEY ${agiForeignKey};
      `);
    }

    // task_id 外键
    const taskForeignKey = 'FK_task_logs_task';
    const taskForeignKeyExists = await this.foreignKeyExists(
      queryRunner,
      'task_logs',
      taskForeignKey,
    );
    if (taskForeignKeyExists) {
      await queryRunner.query(`
        ALTER TABLE task_logs 
        DROP FOREIGN KEY ${taskForeignKey};
      `);
    }
  }
}
