import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  MemoryTask,
  MemoryTaskStatus,
  CreateTaskDto,
  UpdateTaskDto,
  GetAllTasksResponse,
} from './types/memory-task.type';

@Injectable()
export class MemoryTasksService {
  private tasks: Map<string, MemoryTask> = new Map();

  constructor() {
    console.log('MemoryTasksService initialized');
  }

  /**
   * Create a new memory task
   */
  createTask(createTaskDto: CreateTaskDto): MemoryTask {
    const id = uuidv4();
    const now = new Date();
    
    const task: MemoryTask = {
      id,
      name: createTaskDto.name,
      status: MemoryTaskStatus.IN_PROGRESS,
      message: createTaskDto.message || '',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return task;
  }

  /**
   * Update an existing task (except id)
   */
  updateTask(id: string, updateTaskDto: UpdateTaskDto): MemoryTask {
    const task = this.getTask(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: MemoryTask = {
      ...task,
      ...updateTaskDto,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Get a single task by id
   */
  getTask(id: string): MemoryTask | undefined {
    return this.tasks.get(id);
  }

  /**
   * Get all tasks with optional status filter
   */
  getAllTasks(status?: MemoryTaskStatus): GetAllTasksResponse {
    let items = Array.from(this.tasks.values());
    
    if (status) {
      items = items.filter(task => task.status === status);
    }

    // Sort by updated date (newest first)
    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    
    return {
      items,
      total: items.length
    };
  }

  /**
   * Delete a task by id
   */
  deleteTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  /**
   * Get count of tasks by status
   */
  getTasksCountByStatus(status: MemoryTaskStatus): number {
    return Array.from(this.tasks.values()).filter(
      task => task.status === status
    ).length;
  }
} 