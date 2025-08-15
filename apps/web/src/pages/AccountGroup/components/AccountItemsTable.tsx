import React, { useEffect, useState } from 'react';
import { Button, Select, Table, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { AccountGroupItemFormData } from '../data.d';
import { getDiscordAccounts } from '@/services/account/discord-account';
import { getEmailAccounts } from '@/services/account/email-account';
import { getEvmWallets } from '@/services/wallet/evm-wallet';
import { getTwitterAccounts } from '@/services/account/twitter-account';

interface AccountItemsTableProps {
  value?: AccountGroupItemFormData[];
  onChange?: (value: AccountGroupItemFormData[]) => void;
}

interface AccountOption {
  label: string;
  value: number;
}

const AccountItemsTable: React.FC<AccountItemsTableProps> = ({ value = [], onChange }) => {
  const [discordOptions, setDiscordOptions] = useState<AccountOption[]>([]);
  const [emailOptions, setEmailOptions] = useState<AccountOption[]>([]);
  const [evmWalletOptions, setEvmWalletOptions] = useState<AccountOption[]>([]);
  const [twitterOptions, setTwitterOptions] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 加载所有账号选项
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [discordRes, emailRes, evmWalletRes, twitterRes] = await Promise.all([
          getDiscordAccounts({ pageSize: 1000 }),
          getEmailAccounts({ pageSize: 1000 }),
          getEvmWallets({ pageSize: 1000 }),
          getTwitterAccounts({ pageSize: 1000 }),
        ]);

        setDiscordOptions(
          discordRes.data.items.map((item) => ({
            label: item.username,
            value: item.discordId,
          })),
        );

        setEmailOptions(
          emailRes.data.items.map((item) => ({
            label: item.emailAddress,
            value: item.emailId,
          })),
        );

        setEvmWalletOptions(
          evmWalletRes.data.items.map((item) => ({
            label: item.walletAddress,
            value: item.walletId,
          })),
        );

        setTwitterOptions(
          twitterRes.data.items.map((item) => ({
            label: item.username,
            value: item.twitterId,
          })),
        );
      } catch (error) {
        message.error('加载账号数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // 添加一行
  const handleAdd = () => {
    const newValue = [...value, {}];
    onChange?.(newValue);
  };

  // 删除一行
  const handleRemove = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange?.(newValue);
  };

  // 更新某一行的某个字段
  const handleFieldChange = (index: number, field: keyof AccountGroupItemFormData, fieldValue: number | undefined) => {
    const newValue = [...value];
    newValue[index] = {
      ...newValue[index],
      [field]: fieldValue,
    };
    onChange?.(newValue);
  };

  // 检查是否有重复账号
  const isDuplicate = (index: number, field: keyof AccountGroupItemFormData, fieldValue: number): boolean => {
    if (!fieldValue) return false;

    return value.some(
      (item, idx) => idx !== index && item[field] === fieldValue
    );
  };

  // 表格列定义
  const columns = [
    {
      title: 'EVM钱包',
      dataIndex: 'evmWalletId',
      key: 'evmWalletId',
      render: (text: number, record: AccountGroupItemFormData, index: number) => (
        <Select
          placeholder="选择EVM钱包"
          style={{ width: '100%' }}
          options={evmWalletOptions}
          value={text}
          onChange={(value) => {
            if (isDuplicate(index, 'evmWalletId', value)) {
              message.warning('该EVM钱包已在当前账号组中使用');
              return;
            }
            handleFieldChange(index, 'evmWalletId', value);
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: 'Twitter账号',
      dataIndex: 'twitterAccountId',
      key: 'twitterAccountId',
      render: (text: number, record: AccountGroupItemFormData, index: number) => (
        <Select
          placeholder="选择Twitter账号"
          style={{ width: '100%' }}
          options={twitterOptions}
          value={text}
          onChange={(value) => {
            if (isDuplicate(index, 'twitterAccountId', value)) {
              message.warning('该Twitter账号已在当前账号组中使用');
              return;
            }
            handleFieldChange(index, 'twitterAccountId', value);
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: 'Discord账号',
      dataIndex: 'discordAccountId',
      key: 'discordAccountId',
      render: (text: number, record: AccountGroupItemFormData, index: number) => (
        <Select
          placeholder="选择Discord账号"
          style={{ width: '100%' }}
          options={discordOptions}
          value={text}
          onChange={(value) => {
            if (isDuplicate(index, 'discordAccountId', value)) {
              message.warning('该Discord账号已在当前账号组中使用');
              return;
            }
            handleFieldChange(index, 'discordAccountId', value);
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'emailAccountId',
      key: 'emailAccountId',
      render: (text: number, record: AccountGroupItemFormData, index: number) => (
        <Select
          placeholder="选择邮箱"
          style={{ width: '100%' }}
          options={emailOptions}
          value={text}
          onChange={(value) => {
            if (isDuplicate(index, 'emailAccountId', value)) {
              message.warning('该邮箱已在当前账号组中使用');
              return;
            }
            handleFieldChange(index, 'emailAccountId', value);
          }}
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (text: any, record: AccountGroupItemFormData, index: number) => (
        <Button
          type="text"
          danger
          icon={<MinusCircleOutlined />}
          onClick={() => handleRemove(index)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        rowKey={(record, index) => record.id?.toString() || index?.toString() || '0'}
        dataSource={value}
        columns={columns}
        pagination={false}
        loading={loading}
        locale={{ emptyText: '请添加账号项' }}
      />
      <Button
        type="dashed"
        onClick={handleAdd}
        style={{ width: '100%', marginTop: 16 }}
        icon={<PlusOutlined />}
      >
        添加账号项
      </Button>
    </div>
  );
};

export default AccountItemsTable;
