import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskResultsTable1711030000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS task_results (
        id INT NOT NULL AUTO_INCREMENT,
        project_id INT NOT NULL,
        account_group_item_id INT NOT NULL,
        result JSON NOT NULL,
        created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_project_id (project_id),
        INDEX idx_account_group_item_id (account_group_item_id),
        INDEX idx_project_account (project_id, account_group_item_id),
        CONSTRAINT FK_task_results_project 
          FOREIGN KEY (project_id) 
          REFERENCES projects(id) 
          ON DELETE CASCADE,
        CONSTRAINT FK_task_results_account_group_item 
          FOREIGN KEY (account_group_item_id) 
          REFERENCES account_group_items(id) 
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS task_results;
    `);
  }
} 