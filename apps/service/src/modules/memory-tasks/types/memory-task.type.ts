export enum MemoryTaskStatus {
  IN_PROGRESS = 'in_progress',
  FAILED = 'failed',
  COMPLETED = 'completed',
}

export interface MemoryTask {
  id: string;
  name: string;
  status: MemoryTaskStatus;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllTasksResponse {
  items: MemoryTask[];
  total: number;
}

export interface CreateTaskDto {
  name: string;
  message?: string;
}

export interface UpdateTaskDto {
  name?: string;
  status?: MemoryTaskStatus;
  message?: string;
} 