import React, { useEffect, useState } from 'react';
import { ProTable, ActionType } from '@ant-design/pro-components';
import { message, Tag, Tooltip, theme } from 'antd';
import {
  queryTaskResultsByConditions,
  QueryCondition,
} from '@/services/task/task-results';
import { useRef } from 'react';
import { CheckCircleFilled, CloseCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import { history } from '@umijs/max';

interface ResultsTableProps {
  /** 当前选中的项目ID */
  projectId?: number;
  /** 查询条件 */
  queryConditions: QueryCondition[];
  /** 字段选项（用于显示字段标签） */
  fieldOptions: { name: string; label: string; type: string }[];
  /** 表头标题 */
  headerTitle: React.ReactNode;
  /** 总条数变化回调 */
  onTotalChange: (total: { totalCount: number; currentCount: number }) => void;
}

interface TableDataItem {
  accountGroupItemId: number;
  accountGroupId: number;
  accountGroupName: string;
  projectId: number;
  taskResultId: number;
  taskResult: Record<string, any>;
}

const ResultsTable: React.FC<ResultsTableProps> = ({
  projectId,
  queryConditions,
  fieldOptions,
  headerTitle,
  onTotalChange,
}) => {
  const actionRef = useRef<ActionType>();
  const [loading, setLoading] = useState(false);
  const { token } = theme.useToken();

  // 当项目或查询条件变化时，重新加载数据
  useEffect(() => {
    if (projectId) {
      actionRef.current?.reload();
    }
  }, [projectId, queryConditions]);

  // 获取字段显示标签
  // const getFieldLabel = (fieldName: string) => {
  //   const field = fieldOptions.find(f => f.name === fieldName);
  //   return field ? field.label : fieldName;
  // };

  // 查看详情
  // const handleViewDetail = (record: TableDataItem) => {
  //   console.log('查看详情:', record);
  //   message.info('查看详情功能待实现');
  // };

  // 渲染任务结果值
  const renderTaskResultValue = (value: any, type?: string) => {
    const successColor = token.colorSuccess;
    const errorColor = token.colorError;
    const textQuaternaryColor = token.colorTextQuaternary;

    if (value === null || value === undefined) {
      return <MinusCircleFilled style={{ color: textQuaternaryColor }} />;
    }

    if (type === 'boolean') {
      return value ? (
        <CheckCircleFilled style={{ color: successColor }} />
      ) : (
        <CloseCircleFilled style={{ color: errorColor }} />
      );
    }

    if (typeof value === 'object') {
      return (
        <Tooltip title={JSON.stringify(value, null, 2)}>
          <Tag color="blue">对象</Tag>
        </Tooltip>
      );
    }

    return <span>{String(value)}</span>;
  };

  // 查询数据
  const fetchData = async (params: any) => {
    if (!projectId) {
      return {
        data: [],
        total: 0,
        success: true,
      };
    }

    try {
      setLoading(true);
      const { current, pageSize } = params;

      const response = await queryTaskResultsByConditions(projectId, {
        conditions: queryConditions,
        page: current,
        pageSize,
      });

      onTotalChange({ totalCount: response.statTotal, currentCount: response.total });

      return {
        data: (response.items || []) as TableDataItem[],
        total: response.total || 0,
        success: true,
      };
    } catch (error) {
      console.error('Failed to fetch task results:', error);
      message.error('查询任务结果失败');
      return {
        data: [],
        total: 0,
        success: false,
      };
    } finally {
      setLoading(false);
    }
  };

  // 动态生成表格列
  const generateColumns = () => {
    const baseColumns = [
      {
        title: '账号项ID',
        dataIndex: 'accountGroupItemId',
        key: 'accountGroupItemId',
        width: 100,
      },
      {
        title: '所属账号组',
        dataIndex: 'accountGroupName',
        key: 'accountGroupName',
        render: (_: any, record: TableDataItem) => (
          <Tag
            color="blue"
            onClick={() => {
              history.push(`/account/group/${record.accountGroupId}`);
            }}
            style={{ cursor: 'pointer' }}
          >
              {record.accountGroupName}
          </Tag>
        ),
      },
    ];

    // 根据字段选项动态生成列
    const dynamicColumns = fieldOptions.map((field) => ({
      title: field.label,
      dataIndex: ['taskResult', field.name],
      key: field.name,
      render: (_: any, record: TableDataItem) => {
        // 从 taskResult 中提取对应字段的值
        const fieldValue = record.taskResult?.[field.name];
        return renderTaskResultValue(fieldValue, field.type);
      },
    }));

    const actionColumns = [
      // {
      //   title: '操作',
      //   key: 'action',
      //   width: 100,
      //   fixed: 'right' as const,
      //   render: (_: any, record: TableDataItem) => (
      //     <Space>
      //       <Tooltip title="查看详情">
      //         <Button
      //           type="link"
      //           size="small"
      //           icon={<EyeOutlined />}
      //           onClick={() => handleViewDetail(record)}
      //         />
      //       </Tooltip>
      //     </Space>
      //   ),
      // },
    ];

    return [...baseColumns, ...dynamicColumns, ...actionColumns];
  };

  return (
    <ProTable<TableDataItem>
      actionRef={actionRef}
      rowKey="accountGroupItemId"
      request={fetchData}
      columns={generateColumns()}
      loading={loading}
      scroll={{ x: 1000 }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      }}
      search={false}
      dateFormatter="string"
      toolBarRender={() => []}
      headerTitle={headerTitle}
      options={{
        density: true,
        fullScreen: true,
        reload: true,
        setting: true,
      }}
      rowSelection={false}
      tableAlertRender={false}
    />
  );
};

export default ResultsTable;
