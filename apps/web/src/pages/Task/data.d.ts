export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  STOPPED = 'stopped',
}

export interface Task {
  id: number;
  name: string;
  threadCount: number;
  status: TaskStatus;
  projectId: number;
  project?: {
    id: number;
    name: string;
  };
  accountGroups?: {
    id: number;
    name: string;
  }[];
  scripts?: {
    id: number;
    name: string;
    content: string;
  }[];
  taskLogs?: {
    id: number;
    status: TaskStatus;
    startTime: Date;
    endTime?: Date;
    logs: string;
    accountGroupItemId?: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFormData {
  name: string;
  threadCount: number;
  projectId: number;
  accountGroupIds: number[];
  scriptIds: number[];
}

export interface TaskLog {
  result(result: any): string;
  id: number;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
  logs: string;
  taskId: number;
  task?: {
    id: number;
    name: string;
  };
  accountGroupItemId?: number;
  accountGroupItem?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
