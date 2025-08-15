import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTaskLogsErrorFields1744731855000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 先添加新列
    await queryRunner.query(`
      ALTER TABLE task_logs 
      ADD COLUMN error_message TEXT NULL AFTER error,
      ADD COLUMN error_code VARCHAR(50) NULL AFTER error_message;
    `);

    // 复制现有数据
    await queryRunner.query(`
      UPDATE task_logs
      SET error_message = error
      WHERE error IS NOT NULL;
    `);

    // 删除旧列
    await queryRunner.query(`
      ALTER TABLE task_logs
      DROP COLUMN error;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 先添加旧列
    await queryRunner.query(`
      ALTER TABLE task_logs
      ADD COLUMN error TEXT NULL AFTER error_code;
    `);

    // 复制数据回旧列
    await queryRunner.query(`
      UPDATE task_logs
      SET error = error_message
      WHERE error_message IS NOT NULL;
    `);

    // 删除新列
    await queryRunner.query(`
      ALTER TABLE task_logs
      DROP COLUMN error_message,
      DROP COLUMN error_code;
    `);
  }
} 