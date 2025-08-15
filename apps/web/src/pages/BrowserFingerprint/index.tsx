import { PlusOutlined } from '@ant-design/icons';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { useRef, useState } from 'react';
import {
  getBrowserFingerprintList,
  deleteBrowserFingerprint,
} from '@/services/browser/browser-fingerprint';
import BrowserFingerprintForm from './components/BrowserFingerprintForm';
import GenerateFingerprintForm from './components/GenerateFingerprintForm';

const BrowserFingerprintList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [generateModalVisible, setGenerateModalVisible] = useState<boolean>(false);
  const [currentRow] = useState<API.BrowserFingerprintListItem>();
  const actionRef = useRef<ActionType>();

  const handleDelete = async (id: number) => {
    const hide = message.loading('正在删除');
    try {
      await deleteBrowserFingerprint(id);
      hide();
      message.success('删除成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('删除失败，请重试');
      return false;
    }
  };

  const columns: ProColumns<API.BrowserFingerprintListItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      search: false,
    },
    {
      title: 'User Agent',
      dataIndex: 'userAgent',
      width: 300,
      ellipsis: true,
      search: false,
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
      title: '浏览器类型',
      dataIndex: 'browserType',
      width: 120,
      hideInTable: true,
    },
    {
      title: 'WebGL供应商',
      dataIndex: 'webglVendor',
      width: 150,
    },
    {
      title: 'WebGL渲染器',
      dataIndex: 'webglRenderer',
      width: 200,
      ellipsis: true,
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      width: 180,
    },
    {
      title: 'MAC地址',
      dataIndex: 'macAddress',
      width: 180,
    },
    {
      title: 'CPU核心数',
      dataIndex: 'cpuCores',
      width: 90,
    },
    {
      title: '设备内存(GB)',
      dataIndex: 'deviceMemory',
      width: 110,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateTime',
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
      width: 160,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确定要删除这个浏览器指纹吗？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<API.BrowserFingerprintListItem>
        headerTitle="浏览器指纹列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1500 }}
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setGenerateModalVisible(true);
            }}
          >
            <PlusOutlined /> 批量生成
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        request={async (params) => {
          const { current, pageSize, ...restParams } = params;
          const response = await getBrowserFingerprintList({
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
      <BrowserFingerprintForm
        visible={createModalVisible}
        onVisibleChange={setCreateModalVisible}
        current={currentRow}
        onSuccess={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
      <GenerateFingerprintForm
        visible={generateModalVisible}
        onVisibleChange={setGenerateModalVisible}
        onSuccess={() => {
          setGenerateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default BrowserFingerprintList;
