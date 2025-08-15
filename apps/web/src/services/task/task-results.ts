import { request } from '@umijs/max';

/** 任务结果类型定义（基于服务端 TaskResult 实体） */
export interface TaskResult {
  id: number;
  projectId: number;
  accountGroupItemId: number;
  result: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/** 项目信息类型定义（基于服务端 Project 实体） */
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 查询条件类型定义（基于服务端 ConditionDto） */
export interface QueryCondition {
  name: string;
  operator: string;
  value: any;
  type: string; // 'string' | 'number' | 'boolean'
}

/** 按条件查询任务结果的请求参数（基于服务端 QueryTaskResultByConditionsDto） */
export interface QueryTaskResultsByConditionsParams {
  conditions: QueryCondition[];
  page?: number;
  pageSize?: number;
}

/** API 响应类型 */
interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/** 分页响应类型 */
interface PaginatedResponse<T> {
  total: number;
  items: T[];
  statTotal: number;
}

/** 获取当前用户执行过任务的项目列表 */
export async function getUserProjects(): Promise<Project[]> {
  const response = await request<ApiResponse<Project[]>>('/api/task-results/user-projects', {
    method: 'GET',
  });
  return response.data;
}

/** 获取项目任务结果数据结构 */
export async function getProjectTaskSchema(projectName: string): Promise<Record<string, any>> {
  const response = await request<ApiResponse<Record<string, any>>>(`/api/task-results/schema/${projectName}`, {
    method: 'GET',
  });
  return response.data;
}

/** 按条件查询任务结果 */
export async function queryTaskResultsByConditions(
  projectId: number,
  params: QueryTaskResultsByConditionsParams
): Promise<PaginatedResponse<TaskResult>> {
  const response = await request<ApiResponse<PaginatedResponse<TaskResult>>>(`/api/task-results/query/${projectId}`, {
    method: 'POST',
    data: params,
  });
  return response.data;
}

/** 获取任务结果详情 */
export async function getTaskResult(id: number): Promise<TaskResult> {
  const response = await request<ApiResponse<TaskResult>>(`/api/task-results/${id}`, {
    method: 'GET',
  });
  return response.data;
}