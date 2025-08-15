import { BrowserContext } from 'playwright';

export interface ScriptExecutionContext {
  context: BrowserContext;
  taskContext: Record<string, any>;
  accountGroupItemId: number;
  accountDetail?: Record<string, any>;
  baseDir: string;
  userId: number;
  projectId: number;
  taskId: number;
}

export interface ScriptExecutionResult {
  success?: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export interface ScriptInterface {
  execute(context: ScriptExecutionContext): Promise<ScriptExecutionResult>;
}
