import { UploadOutlined, SyncOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Upload, Popconfirm } from 'antd';
import React, { useRef, useState } from 'react';
import type { EmailAccount } from '@/services/account/email-account';
import {
  getEmailAccounts,
  deleteEmailAccount,
  checkRefreshTokens,
  exportEmailAccounts,
  exportInvalidEmailAccounts,
} from '@/services/account/email-account';
import { request } from '@umijs/max';
import EmailAccountForm from './components/EmailAccountForm';
import { refreshTaskList } from '@/components/TaskNotification';

const EmailAccountList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<EmailAccount>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [checkLoading, setCheckLoading] = useState<boolean>(false);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();

  const handleDelete = async (emailId: number) => {
    try {
      await deleteEmailAccount(emailId);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {}
  };

  const handleCheckRefreshTokens = async () => {
    try {
      setCheckLoading(true);
      const ids = selectedRowKeys.length > 0 ? selectedRowKeys.map((key) => Number(key)) : [];
      await checkRefreshTokens(ids);
      setCheckLoading(false);
      message.success('检测邮箱任务已开始处理，可在右上角通知中心查看进度');
      refreshTaskList();
      actionRef.current?.reload();
    } catch (error) {
      setCheckLoading(false);
      message.error('检测失败');
    }
  };

  const handleExport = async (type: 'all' | 'invalid') => {
    try {
      setExportLoading(true);
      const ids = selectedRowKeys.length > 0 ? selectedRowKeys.map((key) => Number(key)) : [];
      const response =
        type === 'all'
          ? await exportEmailAccounts(ids)
          : await exportInvalidEmailAccounts();
      setExportLoading(false);

      if (response.code === 200 && response.data) {
        // 获取导出内容
        let content = response.data.content;

        // 如果内容是Buffer格式的JSON对象（有type和data属性），转换为实际内容
        if (
          typeof content === 'object' &&
          content.type === 'Buffer' &&
          Array.isArray(content.data)
        ) {
          content = String.fromCharCode.apply(null, content.data);
        }

        // 创建一个Blob对象
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        message.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      setExportLoading(false);
      message.error('导出失败');
    }
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await request('/api/email-accounts/import', {
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

  const columns: ProColumns<EmailAccount>[] = [
    {
      title: 'ID',
      dataIndex: 'emailId',
      valueType: 'text',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: '邮箱地址',
      dataIndex: 'emailAddress',
      valueType: 'text',
      width: 300,
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
      title: '刷新令牌',
      dataIndex: 'refreshToken',
      valueType: 'text',
      width: 180,
      ellipsis: true,
      search: false,
    },
    {
      title: '客户端ID',
      dataIndex: 'clientId',
      valueType: 'text',
      width: 180,
      ellipsis: true,
      search: false,
    },
    // {
    //   title: '验证邮箱',
    //   dataIndex: 'verificationEmail',
    //   valueType: 'text',
    //   width: 180,
    //   search: false,
    // },
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
            description="你确定要删除这个邮箱账户吗？"
            onConfirm={() => handleDelete(record.emailId)}
            okText="确认"
            cancelText="取消"
          >
            <a key="delete">删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<EmailAccount>
        headerTitle="邮箱列表"
        actionRef={actionRef}
        rowKey="emailId"
        scroll={{ x: 1000 }}
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Popconfirm
            key="check"
            title="批量检测令牌"
            description={`确认${
              selectedRowKeys.length > 0 ? '检测选中的' + selectedRowKeys.length + '个' : '检测所有'
            }邮箱账号的令牌有效性？`}
            onConfirm={handleCheckRefreshTokens}
            okText="确认"
            cancelText="取消"
          >
            <Button type="primary" loading={checkLoading} icon={<SyncOutlined />}>
              批量检测
            </Button>
          </Popconfirm>,

          <Upload key="import" accept=".txt" showUploadList={false} beforeUpload={handleImport}>
            <Button>
              <UploadOutlined /> 批量导入
            </Button>
          </Upload>,

          <Popconfirm
            key="export"
            title="批量导出邮箱"
            description={`确认${
              selectedRowKeys.length > 0 ? '导出选中的' + selectedRowKeys.length + '个' : '导出所有'
            }邮箱账号？`}
            onConfirm={() => handleExport('all')}
            okText="确认"
            cancelText="取消"
          >
            <Button loading={exportLoading} icon={<DownloadOutlined />}>
              批量导出
            </Button>
          </Popconfirm>,

          <Popconfirm
            key="export-invalid"
            title="批量导出无效邮箱"
            description={`确认导出所有无效邮箱账号？`}
            onConfirm={() => handleExport('invalid')}
            okText="确认"
            cancelText="取消"
          >
            <Button loading={exportLoading} icon={<DownloadOutlined />}>
              导出无效
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
          const response = await getEmailAccounts({
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
      <EmailAccountForm
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onSuccess={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
      <EmailAccountForm
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

export default EmailAccountList;
