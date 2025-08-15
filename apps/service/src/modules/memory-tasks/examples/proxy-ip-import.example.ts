import { MemoryTasksService } from '../memory-tasks.service';
import { MemoryTaskStatus } from '../types/memory-task.type';

/**
 * Example of using MemoryTasksService for proxy IP import
 */
export class ProxyIpImportExample {
  constructor(private readonly memoryTasksService: MemoryTasksService) {}

  /**
   * Starts an import task and returns the task
   */
  startImportTask(filename: string): { taskId: string } {
    const task = this.memoryTasksService.createTask({
      name: `Import proxy IPs from ${filename}`,
      message: 'Processing has started'
    });

    // This would normally be an async operation
    this.processImportInBackground(task.id, filename);

    return { taskId: task.id };
  }

  /**
   * Simulates background processing of the import
   */
  private async processImportInBackground(taskId: string, filename: string): Promise<void> {
    try {
      // Update task to show progress
      this.memoryTasksService.updateTask(taskId, {
        message: 'Reading file...'
      });

      // Simulate file processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update task to show more progress
      this.memoryTasksService.updateTask(taskId, {
        message: 'Validating IPs...'
      });

      // Simulate IP validation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update task to show more progress
      this.memoryTasksService.updateTask(taskId, {
        message: 'Saving to database...'
      });

      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟处理结果
      const totalProcessed = 150;
      const validIPs = 142;
      const invalidIPs = 8;
      const duplicates = 5;

      // Complete the task with results
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.COMPLETED,
        message: `Import completed successfully. Processed: ${totalProcessed}, Valid: ${validIPs}, Invalid: ${invalidIPs}, Duplicates: ${duplicates}`
      });
    } catch (error) {
      // Handle errors by updating the task
      this.memoryTasksService.updateTask(taskId, {
        status: MemoryTaskStatus.FAILED,
        message: `Import failed: ${error.message}`
      });
    }
  }
} 