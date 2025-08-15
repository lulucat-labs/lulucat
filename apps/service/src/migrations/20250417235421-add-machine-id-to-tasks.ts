import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMachineIdToTasks20250417235421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE tasks ADD COLUMN machine_id VARCHAR(255) NULL COMMENT '硬件ID'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE tasks DROP COLUMN machine_id`);
  }
} 