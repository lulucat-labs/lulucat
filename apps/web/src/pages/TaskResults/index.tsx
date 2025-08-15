import React, { useState, useEffect, useCallback } from 'react';
import { ProCard } from '@ant-design/pro-components';
import { message, Space } from 'antd';
import ProjectList from './components/ProjectList';
import ResultsTable from './components/ResultsTable';
import LogicalQueryForm, { FieldOption } from '@/components/LogicalQueryForm';
import {
  Project,
  QueryCondition,
  getProjectTaskSchema,
} from '@/services/task/task-results';

const TaskResults: React.FC = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [queryConditions, setQueryConditions] = useState<QueryCondition[]>([]);
  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);
  const [total, setTotal] = useState({ totalCount: 0, currentCount: 0 });
  const [loading, setLoading] = useState(false);

  // 从 schema 中提取字段信息
  const extractFieldsFromSchema = (schema: Record<string, any>): FieldOption[] => {
    const fields: FieldOption[] = [];

    const extractFields = (obj: any, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object') {
          // 检查是否有类型定义
          if (value.type) {
            let fieldType: 'string' | 'number' | 'boolean' = 'string';

            switch (value.type) {
              case 'number':
              case 'integer':
                fieldType = 'number';
                break;
              case 'boolean':
                fieldType = 'boolean';
                break;
              default:
                fieldType = 'string';
            }

            fields.push({
              name: fieldName,
              label: value.title || key,
              type: fieldType,
            });
          } else if (value.properties) {
            // 递归处理嵌套对象
            extractFields(value.properties, fieldName);
          } else {
            // 普通对象，继续递归
            extractFields(value, fieldName);
          }
        }
      });
    };

    // 如果 schema 有 properties 字段，从中提取
    if (schema.properties) {
      extractFields(schema.properties);
    } else {
      // 否则直接从 schema 提取
      extractFields(schema);
    }

    return fields;
  };

  // 加载项目数据结构
  const loadProjectSchema = async (projectName: string) => {
    try {
      setLoading(true);
      const schema = await getProjectTaskSchema(projectName);

      // 从 schema 中提取字段信息，生成字段选项
      const fields = extractFieldsFromSchema(schema);
      setFieldOptions(fields);
    } catch (error) {
      console.error('Failed to load project schema:', error);
      message.error(`加载项目 ${projectName} 的数据结构失败`);
      setFieldOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 当选中项目变化时，获取项目的数据结构
  useEffect(() => {
    if (selectedProject) {
      loadProjectSchema(selectedProject.name);
      // 重置查询条件
      setQueryConditions([]);
    }
  }, [selectedProject]);

  // 处理项目选择
  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
  };

  // 处理查询
  const handleQuery = useCallback((conditions: QueryCondition[]) => {
    setQueryConditions(conditions);
  }, []);

  // 处理重置
  const handleReset = useCallback(() => {
    setQueryConditions([]);
  }, []);

  // 生成 localStorage 存储键名
  const storageKey = selectedProject
    ? `task_results_query_conditions_${selectedProject.id}`
    : undefined;

  return (
    <ProCard split="vertical">
      {/* 左侧项目列表 */}
      <ProCard title="项目列表" colSpan="20%">
        <ProjectList
          selectedProjectId={selectedProject?.id}
          onProjectSelect={handleProjectSelect}
        />
      </ProCard>

      {/* 右侧内容区域 */}
      <ProCard split="horizontal">
        {/* 上方：逻辑查询组件 */}
        {/* <ProCard
          title="查询条件"
          colSpan="auto"
          extra={
            selectedProject &&
            fieldOptions.length > 0 && (
              <Space>
                <LogicalQueryForm
                  fieldOptions={fieldOptions}
                  onQuery={handleQuery}
                  onReset={handleReset}
                  storageKey={storageKey}
                  showResetButton={true}
                />
              </Space>
            )
          }
        >
          {selectedProject ? (
            <div style={{ padding: '16px 0' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>当前项目：</strong>
                {selectedProject.name}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {selectedProject.description || '暂无项目描述'}
              </div>
              {queryConditions.length > 0 && (
                <div style={{ marginTop: '12px', color: '#1890ff' }}>
                  已应用 {queryConditions.length} 个查询条件
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: '#999',
              }}
            >
              请先选择一个项目
            </div>
          )}
        </ProCard> */}

        {/* 下方：查询结果表格 */}
        <ProCard title={`任务结果 (${total.currentCount}/${total.totalCount})`} bodyStyle={{ padding: 0 }}>
          <ResultsTable
            projectId={selectedProject?.id}
            queryConditions={queryConditions}
            fieldOptions={fieldOptions}
            onTotalChange={setTotal}
            headerTitle={
              <Space>
                <LogicalQueryForm
                  fieldOptions={fieldOptions}
                  onQuery={handleQuery}
                  onReset={handleReset}
                  storageKey={storageKey}
                  showResetButton={true}
                />
              </Space>
            }
          />
        </ProCard>
      </ProCard>
    </ProCard>
  );
};

export default TaskResults;
