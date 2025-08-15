import { useEffect, useRef, useState } from 'react';
import { Space, Button, Badge, Select, message, Modal, Radio, Checkbox, Alert, Tooltip, Divider } from 'antd';
import { useParams } from '@umijs/max';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProCard, ProTable, ProForm, ProDescriptions } from '@ant-design/pro-components';
import { getAccountGroupItems, replaceAccountItemsResource, replaceAllAccountItemsResource } from '@/services/account/account-group';
import type { AccountGroup, AccountGroupItem } from '../data.d';
import { AccountItemType } from '@/services/common/enums';
import {  ArrowLeftOutlined } from '@ant-design/icons';

const AccountGroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [accountType, setAccountType] = useState<string>('');
  const [accountStatus, setAccountStatus] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<AccountGroupItem[]>([]);
  const [replaceModalVisible, setReplaceModalVisible] = useState<boolean>(false);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [replaceType, setReplaceType] = useState<string>('');
  const [addType, setAddType] = useState<string>('');
  const [excludeOptions, setExcludeOptions] = useState<{
    excludeAssociated: boolean;
    excludeInvalid: boolean;
  }>({
    excludeAssociated: true,
    excludeInvalid: true,
  });
  const [replacing, setReplacing] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [accountGroupDetail, setAccountGroupDetail] = useState<AccountGroup>();
  const [accountGroupItems, setAccountGroupDetailItems] = useState<AccountGroupItem[]>([]);
  const tableRef = useRef<ActionType>();

  useEffect(() => {
    if (!replaceModalVisible) {
      setReplaceType('')
    }
    if (addModalVisible) {
      setAddType('')
    }
  }, [addModalVisible,replaceModalVisible])

  const accountTypeOptions = [
    { label: 'EVM钱包', value: AccountItemType.EVM_WALLET },
    { label: 'Twitter账号', value: AccountItemType.TWITTER },
    { label: 'Discord账号', value: AccountItemType.DISCORD },
    { label: '邮箱', value: AccountItemType.EMAIL },
    { label: '代理IP', value: AccountItemType.PROXY_IP },
    { label: '浏览器指纹', value: AccountItemType.BROWSER_FINGERPRINT },
  ];

  // 获取已选行中可更换的账号类型
  const getAvailableResourceTypes = (items: AccountGroupItem[]) => {
    const types = new Set<string>();

    items.forEach(item => {
      if (item.evmWallet?.walletAddress) types.add(AccountItemType.EVM_WALLET);
      if (item.twitterAccount?.username) types.add(AccountItemType.TWITTER);
      if (item.discordAccount?.username) types.add(AccountItemType.DISCORD);
      if (item.emailAccount?.emailAddress) types.add(AccountItemType.EMAIL);
      if (item.proxyIp?.ipAddress) types.add(AccountItemType.PROXY_IP);
      if (item.browserFingerprint?.userAgent) types.add(AccountItemType.BROWSER_FINGERPRINT);
    });

    return accountTypeOptions.filter(opt => types.has(opt.value));
  };

  // 获取可追加的账号类型（未被关联的账号类型）
  const getAvailableAddTypes = () => {
    const types = new Set<string>();

    accountGroupItems.forEach((item: AccountGroupItem) => {
      if (!item.evmWallet?.walletAddress) types.add(AccountItemType.EVM_WALLET);
      if (!item.twitterAccount?.username) types.add(AccountItemType.TWITTER);
      if (!item.discordAccount?.username) types.add(AccountItemType.DISCORD);
      if (!item.emailAccount?.emailAddress) types.add(AccountItemType.EMAIL);
      if (!item.proxyIp?.ipAddress) types.add(AccountItemType.PROXY_IP);
      if (!item.browserFingerprint?.userAgent) types.add(AccountItemType.BROWSER_FINGERPRINT);
    });

    return accountTypeOptions.filter(opt => types.has(opt.value));
  };

  // 处理替换账号资源
  const handleReplaceResource = async () => {
    if (!replaceType || selectedRows.length === 0) {
      message.error('请选择要更换的账号类型');
      return;
    }

    try {
      setReplacing(true);

      const response = await replaceAccountItemsResource({
        accountItemIds: selectedRows.map(row => row.id),
        accountType: replaceType,
        excludeAssociated: excludeOptions.excludeAssociated,
        excludeInvalid: excludeOptions.excludeInvalid,
      });
      console.log("🚀 ~ handleReplaceResource ~ response:", response)

      if (response.data?.success) {
        message.success(`成功更换 ${response.data.success} 个账号资源`);
        // 刷新表格数据
        tableRef.current?.reload();
        // 关闭弹窗
        setReplaceModalVisible(false);
        // 清空选择
        setSelectedRows([]);
      } else {
        message.error(response.message || '更换账号资源失败');
      }
    } catch (error) {
      console.error('更换账号资源出错:', error);
      message.error('更换账号资源失败');
    } finally {
      setReplacing(false);
    }
  };

  // 处理追加账号资源
  const handleAddResource = async () => {
    if (!addType || !id) {
      message.error('请选择要追加的账号类型');
      return;
    }

    try {
      setAdding(true);

      const response = await replaceAllAccountItemsResource({
        accountGroupId: parseInt(id),
        accountType: addType,
        excludeAssociated: excludeOptions.excludeAssociated,
        excludeInvalid: excludeOptions.excludeInvalid,
      });

      if (response.data?.success) {
        message.success(`成功追加 ${response.data.success} 个账号资源`);
        // 刷新表格数据
        tableRef.current?.reload();
        // 关闭弹窗
        setAddModalVisible(false);
      } else {
        message.error(response.message || '追加账号资源失败');
      }
    } catch (error) {
      console.error('追加账号资源出错:', error);
      message.error('追加账号资源失败');
    } finally {
      setAdding(false);
    }
  };

  const columns: ProColumns<AccountGroupItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
      fixed: 'left',
    },
    {
      title: 'EVM钱包',
      dataIndex: ['evmWallet', 'walletAddress'],
      width: 400,
      search: false,
      render: (_, record) => {
        if (!record.evmWallet?.walletAddress) return '-';
        const status = record.evmWallet.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {record.evmWallet.walletAddress}
          </Space>
        );
      },
      ellipsis: true,
    },
    {
      title: 'Twitter账号',
      dataIndex: ['twitterAccount', 'username'],
      width: 200,
      search: false,
      render: (_, record) => {
        if (!record.twitterAccount?.username) return '-';
        const status = record.twitterAccount.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {record.twitterAccount.username}
          </Space>
        );
      },
    },
    {
      title: 'Discord账号',
      dataIndex: ['discordAccount', 'username'],
      width: 200,
      search: false,
      render: (_, record) => {
        if (!record.discordAccount?.username) return '-';
        const status = record.discordAccount.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {record.discordAccount.username}
          </Space>
        );
      },
    },
    {
      title: '邮箱',
      dataIndex: ['emailAccount', 'emailAddress'],
      width: 260,
      search: false,
      render: (_, record) => {
        if (!record.emailAccount?.emailAddress) return '-';
        const status = record.emailAccount.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {record.emailAccount.emailAddress}
          </Space>
        );
      },
      ellipsis: true,
    },
    {
      title: '代理IP',
      dataIndex: ['proxyIp', 'ipAddress'],
      width: 200,
      search: false,
      render: (_, record) => {
        if (!record.proxyIp?.ipAddress) return '-';
        const status = record.proxyIp.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {`${record.proxyIp.ipAddress} (${record.proxyIp.proxyType})`}
          </Space>
        );
      },
    },
    {
      title: '浏览器指纹',
      dataIndex: ['browserFingerprint', 'userAgent'],
      width: 200,
      search: false,
      render: (_, record) => {
        if (!record.browserFingerprint?.userAgent) return '-';
        const status = record.browserFingerprint.status === 'invalid' ? 'error' : 'success';
        return (
          <Space>
            <Badge status={status} />
            {record.browserFingerprint.userAgent}
          </Space>
        );
      },
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
      search: false,
    },
  ];

  const detailColumns = [
    {
      title: '账号组 ID',
      dataIndex: 'id',
    },
    {
      title: '账号组名称',
      dataIndex: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
    },
  ]

  // 更换账号资源弹窗
  const renderReplaceModal = () => {
    const availableTypes = getAvailableResourceTypes(selectedRows);
    return (
      <Modal
        title="更换账号资源"
        open={replaceModalVisible}
        onCancel={() => setReplaceModalVisible(false)}
        onOk={handleReplaceResource}
        confirmLoading={replacing}
        destroyOnClose
      >
        <Alert style={{ marginBottom: 16 }} showIcon message="将所选账号更换成新的账号资源，操作不可逆。" type="info" />
        <ProForm
          layout="vertical"
          submitter={false}
          initialValues={{
            excludeOptions: ['excludeAssociated', 'excludeInvalid'],
          }}
        >
          <ProForm.Item
            name="accountType"
            label="请选择要更换的账号类型"
            rules={[{ required: true, message: '请选择要更换的账号类型' }]}
          >
            <Radio.Group
              onChange={(e) => setReplaceType(e.target.value)}
              options={availableTypes}
            />
          </ProForm.Item>

          <ProForm.Item
            name="excludeOptions"
            label="过滤条件"
          >
            <Checkbox.Group
              options={[
                { label: '排除已被账号组关联的账号', value: 'excludeAssociated' },
                { label: '排除失效状态的账号', value: 'excludeInvalid' },
              ]}
              onChange={(values) => {
                setExcludeOptions({
                  excludeAssociated: values.includes('excludeAssociated'),
                  excludeInvalid: values.includes('excludeInvalid'),
                });
              }}
              defaultValue={['excludeAssociated', 'excludeInvalid']}
            />
          </ProForm.Item>
        </ProForm>
      </Modal>
    );
  };

  // 追加账号资源弹窗
  const renderAddModal = () => {
    const availableTypes = getAvailableAddTypes();
    return (
      <Modal
        title="追加账号资源"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={handleAddResource}
        confirmLoading={adding}
        destroyOnClose
      >
        <Alert style={{ marginBottom: 16 }} showIcon message="为当前账号组追加新的账号资源，操作不可逆。" type="info" />
        <ProForm
          layout="vertical"
          submitter={false}
          initialValues={{
            excludeOptions: ['excludeAssociated', 'excludeInvalid'],
          }}
        >
          <ProForm.Item
            name="accountType"
            label="请选择要追加的账号类型"
            rules={[{ required: true, message: '请选择要追加的账号类型' }]}
          >
            <Radio.Group
              onChange={(e) => setAddType(e.target.value)}
              options={availableTypes}
            />
          </ProForm.Item>

          <ProForm.Item
            name="excludeOptions"
            label="过滤条件"
          >
            <Checkbox.Group
              options={[
                { label: '排除已被账号组关联的账号', value: 'excludeAssociated' },
                { label: '排除失效状态的账号', value: 'excludeInvalid' },
              ]}
              onChange={(values) => {
                setExcludeOptions({
                  excludeAssociated: values.includes('excludeAssociated'),
                  excludeInvalid: values.includes('excludeInvalid'),
                });
              }}
              defaultValue={['excludeAssociated', 'excludeInvalid']}
            />
          </ProForm.Item>
        </ProForm>
      </Modal>
    );
  };

  const addAccountButtonDisabled = getAvailableAddTypes().length === 0;

  return (
    <ProCard split={'horizontal'}>
      <ProCard
        title={
          <>
            <Space style={{ cursor: 'pointer' }} onClick={() => history.back()}>
              <ArrowLeftOutlined /> 返回
            </Space>{' '}
            <Divider type="vertical" />
            <span>账号组详情</span>
          </>
        }
      >
        <ProDescriptions
          column={4}
          title={false}
          dataSource={accountGroupDetail}
          columns={detailColumns}
        />
      </ProCard>
      <ProCard
        title="账号列表"
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => setReplaceModalVisible(true)}
              disabled={selectedRows.length === 0}
            >
              更换账号
            </Button>
            <Tooltip title={addAccountButtonDisabled ? '当前账号组已关联全部类型的账号资源' : ''}>
              <Button
                type="primary"
                onClick={() => setAddModalVisible(true)}
                disabled={addAccountButtonDisabled}
              >
                追加账号
              </Button>
            </Tooltip>
          </Space>
        }
      >
        <ProTable<AccountGroupItem>
          actionRef={tableRef}
          scroll={{ x: 1500 }}
          rowKey="id"
          search={false}
          rowSelection={{
            onChange: (_, rows) => setSelectedRows(rows),
            selectedRowKeys: selectedRows.map(row => row.id),
            preserveSelectedRowKeys: true,
          }}
          headerTitle={
            <Space>
              <span>类型：</span>
              <Select
                style={{ width: 120 }}
                value={accountType}
                options={[
                  { label: '全部', value: '' },
                  { label: 'EVM钱包', value: 'evmWallet' },
                  { label: 'Twitter账号', value: 'twitter' },
                  { label: 'Discord账号', value: 'discord' },
                  { label: '邮箱', value: 'email' },
                  { label: '代理IP', value: 'proxyIp' },
                  { label: '浏览器指纹', value: 'browserFingerprint' },
                ]}
                onChange={(value) => {
                  setAccountType(value);
                  setAccountStatus('');
                  tableRef.current?.reloadAndRest?.();
                }}
              />
              {accountType !== '' && (
                <>
                  <span style={{ marginLeft: 10 }}>状态：</span>
                  <Select
                    style={{ width: 120 }}
                    value={accountStatus}
                    options={[
                      { label: '全部', value: '' },
                      { label: '正常', value: 'normal' },
                      { label: '失效', value: 'invalid' },
                    ]}
                    onChange={(value) => {
                      setAccountStatus(value);
                      tableRef.current?.reloadAndRest?.();
                    }}
                  />
                </>
              )}
              {accountType !== '' && (
                <Button
                  type="link"
                  onClick={() => {
                    setAccountType('');
                    setAccountStatus('');
                    tableRef.current?.reloadAndRest?.();
                  }}
                >
                  重置
                </Button>
              )}
            </Space>
          }
          request={async (params) => {
            if (!id) return { data: [], success: true, total: 0 };
            const response = await getAccountGroupItems(Number(id), {
              page: params.current,
              pageSize: params.pageSize,
              accountType: accountType !== '' ? accountType : undefined,
              accountStatus: accountStatus !== '' ? accountStatus : undefined,
            });
            setAccountGroupDetail(response.data.accountGroup)
            setAccountGroupDetailItems(response.data.items)
            return {
              data: response.data.items,
              success: true,
              total: response.data.total,
            };
          }}
          columns={columns}
          pagination={{
            showSizeChanger: true,
            defaultPageSize: 10,
          }}
        />
      </ProCard>
      {renderReplaceModal()}
      {renderAddModal()}
    </ProCard>
  );
};

export default AccountGroupDetail;
