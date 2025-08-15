import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Popconfirm, Modal, InputNumber } from 'antd';
import React, { useRef, useState } from 'react';
import type { EvmWallet } from '@/services/wallet/evm-wallet';
import {
  getEvmWallets,
  deleteEvmWallet,
  updateWalletBalance,
  batchUpdateWalletBalances,
} from '@/services/wallet/evm-wallet';
import GenerateModal from './components/GenerateModal';

const EvmWalletList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [updatingBalance, setUpdatingBalance] = useState<boolean>(false);
  const [batchUpdating, setBatchUpdating] = useState<boolean>(false);

  const handleDelete = async (walletId: number) => {
    try {
      await deleteEvmWallet(walletId);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {

    }
  };

  // 更新单个钱包余额
  const handleUpdateBalance = async (walletId: number) => {
    try {
      setUpdatingBalance(true);
      await updateWalletBalance(walletId);
      message.success('钱包余额更新成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('钱包余额更新失败');
    } finally {
      setUpdatingBalance(false);
    }
  };

  // 批量更新所有钱包余额
  const handleBatchUpdateBalance = async () => {
    Modal.confirm({
      title: '批量更新钱包余额',
      content: '确定要更新所有钱包余额吗？此操作将在后台异步执行，每秒最多处理3个请求。',
      onOk: async () => {
        try {
          setBatchUpdating(true);
          // 简化API调用，不传递任何参数
          const response = await batchUpdateWalletBalances();
          message.success(response.message || '批量更新请求已提交，正在后台处理');
        } catch (error) {
          message.error('批量更新请求失败');
        } finally {
          setBatchUpdating(false);
        }
      },
    });
  };

  const columns: ProColumns<EvmWallet>[] = [
    {
      title: 'ID',
      dataIndex: 'walletId',
      valueType: 'text',
      width: 80,
      fixed: 'left',
      search: false,
    },
    {
      title: '钱包地址',
      dataIndex: 'walletAddress',
      valueType: 'text',
      copyable: true,
      width: 420,
      ellipsis: true,
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
      title: '余额 (ETH)',
      dataIndex: 'balance',
      valueType: 'text',
      width: 150,
      search: false,
      render: (_, record) => (record.balance ? `${record.balance} ETH` : '-'),
    },
    {
      title: '最小余额 (ETH)',
      dataIndex: 'minBalance',
      key: 'minBalance',
      hideInTable: true,
      renderFormItem: () => (
        <InputNumber placeholder="最小值" style={{ width: '100%' }} min={0} stringMode />
      ),
    },
    {
      title: '最大余额 (ETH)',
      dataIndex: 'maxBalance',
      key: 'maxBalance',
      hideInTable: true,
      renderFormItem: () => (
        <InputNumber placeholder="最大值" style={{ width: '100%' }} min={0} stringMode />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {updatingBalance ? (
            <span style={{ marginRight: 8, color: '#ccc' }}>更新余额</span>
          ) : (
            <a
              key="update-balance"
              onClick={() => handleUpdateBalance(record.walletId)}
            >
              更新余额
            </a>
          )}
          <Popconfirm
            title="确认删除"
            description="你确定要删除这个 EVM 钱包吗？"
            onConfirm={() => handleDelete(record.walletId)}
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
      <ProTable<EvmWallet>
        headerTitle="EVM钱包列表"
        actionRef={actionRef}
        rowKey="walletId"
        scroll={{ x: 1000 }}
        search={{
          labelWidth: 120,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        toolBarRender={() => [
          <Button key="batch-update" onClick={handleBatchUpdateBalance} loading={batchUpdating}>
            <ReloadOutlined /> 批量更新余额
          </Button>,
          <Button type="primary" key="generate" onClick={() => setGenerateModalVisible(true)}>
            <PlusOutlined /> 批量生成
          </Button>,
        ]}
        request={async (params) => {
          // 转换分页参数
          const { current, pageSize, walletAddress, minBalance, maxBalance, ...rest } = params;

          // 计算 skip (从0开始的索引)
          const skip = ((current || 1) - 1) * (pageSize || 10);

          // 构建请求参数，过滤掉空字符串值
          const requestParams: Record<string, any> = {
            current,
            pageSize,
            skip,
            take: pageSize || 10,
            ...rest,
          };

          // 只有当钱包地址不为空时才添加到请求参数
          if (walletAddress && walletAddress.trim()) {
            // 确保钱包地址格式正确
            const trimmed = walletAddress.trim();
            if (trimmed.startsWith('0x') && /^0x[a-fA-F0-9]+$/.test(trimmed)) {
              requestParams.walletAddress = trimmed;
            } else {
              console.warn('钱包地址格式不正确，不添加到查询条件');
            }
          }

          // 添加余额范围参数
          if (minBalance !== undefined && minBalance !== null) {
            // 确保小数点数字正确，使用字符串避免精度损失
            requestParams.minBalance = String(minBalance);
          }

          if (maxBalance !== undefined && maxBalance !== null) {
            // 确保小数点数字正确，使用字符串避免精度损失
            requestParams.maxBalance = String(maxBalance);
          }

          console.log('Requesting with params:', requestParams);

          try {
            const response = await getEvmWallets(requestParams);
            return {
              data: response.data.items,
              total: response.data.total,
              success: response.code === 200,
            };
          } catch (error) {
            message.error('获取钱包列表失败');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
      />
      <GenerateModal
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        onSuccess={() => {
          setGenerateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default EvmWalletList;
