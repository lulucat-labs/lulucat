import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Upload, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import { FormattedMessage } from '@umijs/max';
import type { DiscordAccount } from '@/services/account/discord-account';
import {
  getDiscordAccounts,
  deleteDiscordAccount,
} from '@/services/account/discord-account';
import { request } from '@umijs/max';
import DiscordAccountForm from './components/DiscordAccountForm';
import { refreshTaskList } from '@/components/TaskNotification';

const DiscordAccountList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<DiscordAccount>();
  const actionRef = useRef<ActionType>();

  const handleDelete = async (discordId: number) => {
    try {
      await deleteDiscordAccount(discordId);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
    }
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await request('/api/discord-accounts/import', {
        method: 'POST',
        data: formData,
      });
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

  const columns: ProColumns<DiscordAccount>[] = [
    {
      title: 'ID',
      dataIndex: 'discordId',
      valueType: 'text',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      valueType: 'text',
      width: 180,
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
      width: 180,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      valueType: 'text',
      width: 180,
      search: false,
    },
    {
      title: '密码',
      dataIndex: 'password',
      valueType: 'text',
      width: 180,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
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
      width: 180,
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确认删除"
            description="你确定要删除这个 Discord 账户吗？"
            onConfirm={() => handleDelete(record.discordId)}
            okText="确认"
            cancelText="取消"
          >
            <a key="delete" type='danger'>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<DiscordAccount>
        headerTitle="Discord账号列表"
        actionRef={actionRef}
        rowKey="discordId"
        scroll={{ x: 1000 }}
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Upload key="import" accept=".txt" showUploadList={false} beforeUpload={handleImport}>
            <Button type="primary">
              <UploadOutlined /> 批量导入
            </Button>
          </Upload>,
        ]}
        request={async (params) => {
          const response = await getDiscordAccounts(params);
          return {
            data: response.data.items,
            total: response.data.total,
            success: response.code === 200,
          };
        }}
        columns={columns}
      />
      <DiscordAccountForm
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onSuccess={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
      <DiscordAccountForm
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        values={currentRow}
        onSuccess={() => {
          setUpdateModalVisible(false);
          setCurrentRow(undefined);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default DiscordAccountList;
