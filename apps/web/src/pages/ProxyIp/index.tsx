import { UploadOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Popconfirm, Upload } from 'antd';
import React, { useRef, useState } from 'react';
import type { ProxyIp } from '@/services/proxy/proxy-ip';
import {
  getProxyIps,
  deleteProxyIp,
  importProxyIps,
  updateProxyIpsInfo,
  batchDeleteProxyIps,
} from '@/services/proxy/proxy-ip';
import { refreshTaskList } from '@/components/TaskNotification';

const ProxyIpList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleUpdateIpInfo = async () => {
    if (isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);
      const proxyIds =
        selectedRowKeys.length > 0 ? selectedRowKeys.map((id) => Number(id)) : undefined;
      const response = await updateProxyIpsInfo({ proxyIds });
      if ((response.code === 0 || response.code === 200) && response.data?.taskId) {
        message.success('IP信息更新任务已开始处理，可在右上角通知中心查看进度');
        refreshTaskList();
      } else {
        message.error('更新失败');
      }
      actionRef.current?.reload();
    } catch (error) {
      message.error('更新失败');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await importProxyIps(formData);
      if ((response.code === 0 || response.code === 200) && response.data?.taskId) {
        message.success('导入任务已开始处理，可在右上角通知中心查看进度');
        actionRef.current?.reload();
        refreshTaskList();
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

  const handleDelete = async (proxyId: number) => {
    try {
      await deleteProxyIp(proxyId);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {}
  };

  const handleBatchDelete = async () => {
    if (isDeleting || selectedRowKeys.length === 0) {
      return;
    }

    try {
      setIsDeleting(true);
      const ids = selectedRowKeys.map((id) => Number(id));
      await batchDeleteProxyIps(ids);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ProColumns<ProxyIp>[] = [
    {
      title: 'ID',
      dataIndex: 'proxyId',
      valueType: 'text',
      width: 80,
      search: false,
      fixed: 'left',
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      valueType: 'text',
      width: 140,
    },
    {
      title: '关联账号组',
      dataIndex: 'hasAccountGroup',
      valueType: 'select',
      width: 120,
      valueEnum: {
        true: { text: '是' },
        false: { text: '否' },
      },
      render: (_, record) => (
        <span>{record.hasAccountGroup ? '是' : '否'}</span>
      ),
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
      title: '端口',
      dataIndex: 'port',
      valueType: 'digit',
      width: 80,
      search: false,
    },
    {
      title: '代理类型',
      dataIndex: 'proxyType',
      valueType: 'select',
      width: 100,
      valueEnum: {
        http: { text: 'HTTP' },
        socks5: { text: 'SOCKS5' },
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      valueType: 'text',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '地理位置',
      dataIndex: 'location',
      valueType: 'text',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '城市',
      dataIndex: 'city',
      valueType: 'text',
      width: 100,
      search: false,
      ellipsis: true,
    },
    {
      title: '地区',
      dataIndex: 'region',
      valueType: 'text',
      width: 100,
      search: false,
      ellipsis: true,
    },
    {
      title: '国家',
      dataIndex: 'country',
      valueType: 'text',
      width: 100,
      search: false,
      ellipsis: true,
    },
    {
      title: '组织',
      dataIndex: 'org',
      valueType: 'text',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '邮政编码',
      dataIndex: 'postal',
      valueType: 'text',
      width: 100,
      search: false,
    },
    {
      title: '时区',
      dataIndex: 'timezone',
      valueType: 'text',
      width: 120,
      search: false,
      ellipsis: true,
    },
    {
      title: '纬度',
      dataIndex: 'latitude',
      valueType: 'text',
      width: 100,
      search: false,
    },
    {
      title: '经度',
      dataIndex: 'longitude',
      valueType: 'text',
      width: 100,
      search: false,
    },
    {
      title: 'IP信息更新时间',
      dataIndex: 'ipInfoUpdatedAt',
      valueType: 'dateTime',
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
        <Space>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条代理IP记录吗？"
            onConfirm={() => handleDelete(record.proxyId)}
            okText="确定"
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
      <ProTable<ProxyIp>
        headerTitle="代理IP列表"
        actionRef={actionRef}
        rowKey="proxyId"
        scroll={{ x: 2200 }}
        search={{
          labelWidth: 120,
        }}
        rowSelection={{
          preserveSelectedRowKeys: true,
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
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
            key="update"
            title="确认更新"
            description={
              selectedRowKeys.length > 0
                ? `确定要更新选中的${selectedRowKeys.length}条IP信息吗？`
                : '确定要更新所有IP信息吗？'
            }
            onConfirm={handleUpdateIpInfo}
            okText="确定"
            cancelText="取消"
          >
            <Button loading={isUpdating}>
              <ReloadOutlined /> 更新信息
            </Button>
          </Popconfirm>,

          <Popconfirm
            key="batchDelete"
            title="确认批量删除"
            description={`确定要删除选中的${selectedRowKeys.length}条代理IP记录吗？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button danger disabled={selectedRowKeys.length === 0} loading={isDeleting}>
              <DeleteOutlined /> 批量删除
            </Button>
          </Popconfirm>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        request={async (params) => {
          const { current, pageSize, hasAccountGroup, ...restParams } = params;
          
          // 调试输出
          console.log('查询参数:', { current, pageSize, hasAccountGroup, ...restParams });
          
          const response = await getProxyIps({
            page: current,
            pageSize,
            hasAccountGroup: hasAccountGroup !== undefined ? hasAccountGroup === 'true' : undefined,
            ...restParams,
          });
          
          console.log('API响应:', response);
          
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

export default ProxyIpList;
