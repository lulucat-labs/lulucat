import { ActionType, ProTable } from '@ant-design/pro-components';
import { Space, Tag, Select, Button } from 'antd';
import React, { MutableRefObject } from 'react';

interface AccountListProps {
  taskId: number | undefined;
  taskDetail: API.TaskListItem | undefined;
  polling: number | undefined;
  tableRef: MutableRefObject<ActionType | undefined>;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  errorCodeFilter: string;
  setErrorCodeFilter: (code: string) => void;
  selectedRowKeys: React.Key[];
  selectedRows: any[];
  onSelectChange: (keys: React.Key[], rows: any[]) => void;
  handleStatusChange: (useSelectedRows: boolean) => Promise<boolean | undefined>;
  taskActionLoading: boolean;
  headless: boolean;
  setHeadless: (checked: boolean) => void;
  handleViewLogs: (taskData: any) => void;
  queryAccountGroup: (params: any) => Promise<{
    data: any[];
    total: number;
    success: boolean;
  }>;
}

const AccountList: React.FC<AccountListProps> = ({
  polling,
  tableRef,
  statusFilter,
  setStatusFilter,
  errorCodeFilter,
  setErrorCodeFilter,
  selectedRowKeys,
  onSelectChange,
  handleViewLogs,
  queryAccountGroup,
}) => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '账号',
      dataIndex: ['evmWallet', 'walletAddress'],
    },
    {
      title: '状态',
      dataIndex: ['taskLogs', 0, 'status'],
      width: 80,
      valueEnum: {
        pending: { text: '等待中', status: 'default' },
        running: { text: '运行中', status: 'processing' },
        completed: { text: '已完成', status: 'success' },
        failed: { text: '失败', status: 'error' },
        stopped: { text: '已停止', status: 'warning' },
      },
    },
    {
      title: '异常信息',
      width: 180,
      render: (dom: any, entity: any) =>
        entity['taskLogs'] &&
        entity['taskLogs'].length > 0 &&
        entity['taskLogs'][0]['errorCode'] ? (
          <Tag color="red">
            {entity['taskLogs'][0]['errorCode']} {entity['taskLogs'][0]['errorMessage']}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '执行时间',
      dataIndex: ['taskLogs', 0, 'updatedAt'],
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 60,
      fixed: 'right',
      render: (_: any, entity: any) => [
        <a key="edit" onClick={() => handleViewLogs(entity)}>
          日志
        </a>,
      ],
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: onSelectChange,
  };

  return (
    <ProTable
      rowKey="id"
      search={false}
      actionRef={tableRef}
      polling={polling}
      rowSelection={rowSelection}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      headerTitle={
        <Space>
          <span>状态：</span>
          <Select
            style={{ width: 100 }}
            value={statusFilter}
            options={[
              { label: '全部', value: 'all' },
              { label: '失败', value: 'failed' },
              { label: '已完成', value: 'completed' },
              { label: '运行中', value: 'running' },
              { label: '已停止', value: 'stopped' },
              { label: '等待中', value: 'pending' },
            ]}
            onChange={(value) => {
              setStatusFilter(value);
              // 重置错误码筛选
              setErrorCodeFilter('all');
              // 刷新表格
              tableRef.current?.reloadAndRest?.();
            }}
          />
          {statusFilter === 'failed' && (
            <>
              <span style={{ marginLeft: 10 }}>错误类型：</span>
              <Select
                style={{ width: 120 }}
                value={errorCodeFilter}
                options={[
                  { label: '全部', value: 'all' },
                  { label: 'EVM钱包', value: 'wallet' },
                  { label: 'Twitter账号', value: 'twitter' },
                  { label: 'Discord账号', value: 'discord' },
                  { label: '邮箱', value: 'email' },
                  { label: '代理IP', value: 'ip' },
                  { label: '其他', value: 'other' },
                ]}
                onChange={(value) => {
                  setErrorCodeFilter(value);
                  tableRef.current?.reloadAndRest?.();
                }}
              />
            </>
          )}
          {statusFilter !== 'all' && (
            <Button
              type="link"
              onClick={() => {
                setErrorCodeFilter('all');
                setStatusFilter('all');
                tableRef.current?.reloadAndRest?.();
              }}
            >
              重置
            </Button>
          )}
        </Space>
      }
      columns={columns}
      request={queryAccountGroup}
    />
  );
};

export default AccountList;
