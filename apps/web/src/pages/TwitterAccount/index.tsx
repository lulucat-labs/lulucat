import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Upload } from 'antd';
import React, { useRef, useState } from 'react';
import type { TwitterAccount } from '@/services/account/twitter-account';
import {
  getTwitterAccounts,
  deleteTwitterAccount,
  importTwitterAccounts,
  deleteTwitterAccounts,
} from '@/services/account/twitter-account';
import { refreshTaskList } from '@/components/TaskNotification';

const TwitterAccountList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const handleDelete = async (twitterId: number) => {
    try {
      await deleteTwitterAccount(twitterId);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {

    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的账号');
      return;
    }

    try {
      await deleteTwitterAccounts(selectedRowKeys);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await importTwitterAccounts(formData);
      if ((response.code === 0 || response.code === 200) && response.data?.taskId) {
        message.success('导入任务已开始处理，可在右上角通知中心查看进度');
        refreshTaskList();
        actionRef.current?.reload();
        return false;
      } else {
        message.error('导入失败');
        return false;
      }
    } catch (error) {
      message.error('导入失败');
      return false;
    }
  };

  const columns: ProColumns<TwitterAccount>[] = [
    {
      title: 'ID',
      dataIndex: 'twitterId',
      valueType: 'text',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      valueType: 'text',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueEnum: {
        normal: { text: '正常', status: 'success' },
        invalid: { text: '失效', status: 'error' },
      },
    },
    {
      title: 'Token',
      dataIndex: 'token',
      valueType: 'text',
      ellipsis: true,
    },
    {
      title: '2FA验证',
      dataIndex: 'twoFactorAuth',
      valueType: 'text',
      width: 160,
      search: false,
    },
    {
      title: '辅助邮箱',
      dataIndex: 'recoveryEmail',
      valueType: 'text',
      width: 160,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAtRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确认删除"
          description="确定要删除这个推特账号吗？"
          onConfirm={() => handleDelete(record.twitterId)}
          okText="确定"
          cancelText="取消"
        >
          <a key="delete">删除</a>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <ProTable<TwitterAccount>
        headerTitle="Twitter账号列表"
        actionRef={actionRef}
        rowKey="twitterId"
        scroll={{ x: 1000 }}
        search={{
          labelWidth: 120,
        }}
        rowSelection={{
          selectedRowKeys,
          preserveSelectedRowKeys: true,
          onChange: (keys) => setSelectedRowKeys(keys as number[]),
        }}
        toolBarRender={() => [
          <Upload
            key="upload"
            accept=".txt,.csv"
            showUploadList={false}
            customRequest={({ file }) => handleImport(file as File)}
          >
            <Button type="primary">
              <UploadOutlined /> 批量导入
            </Button>
          </Upload>,
          <Popconfirm
            key="batchDelete"
            title="确认删除"
            description={`确定要删除已选择的${selectedRowKeys.length}个账号吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button
              type="primary"
              ghost
              danger
              disabled={selectedRowKeys.length === 0}
              icon={<DeleteOutlined />}
            >
              批量删除
            </Button>
          </Popconfirm>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        request={async (params) => {
          const { current, pageSize, ...restParams } = params;
          const response = await getTwitterAccounts({
            page: current,
            pageSize,
            ...restParams,
          });
          return {
            data: response.data.items,
            total: response.data.total,
            success: response.code === 200,
          };
        }}
        columns={columns}
      />
    </>
  );
};

export default TwitterAccountList;
