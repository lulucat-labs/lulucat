import { useState, useRef } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { getAccountGroupList, deleteAccountGroup } from '@/services/account/account-group';
import CreateAccountGroupModal from './components/CreateAccountGroupModal';
import type { AccountGroup } from './data.d';

const AccountGroupList: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountGroup>();
  const actionRef = useRef<ActionType>();

  const handleDelete = async (id: number) => {
    const hide = message.loading('正在删除');
    try {
      await deleteAccountGroup(id);
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

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingRecord(undefined);
  };

  const columns: ProColumns<AccountGroup>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <a
          onClick={() => {
            history.push(`/account/group/${record.id}`);
          }}
        >
          {record.name}
        </a>
      ),
    },
    {
      title: '账号配额',
      dataIndex: 'items',
      width: 100,
      search: false,
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            history.push(`/account/group/${record.id}`);
          }}
        >
          查看
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个账号组吗？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AccountGroup>
        headerTitle="账号组列表"
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            key="button"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingRecord(undefined);
              setIsCreateModalOpen(true);
            }}
            type="primary"
          >
            新建
          </Button>,
        ]}
        request={async (params) => {
          const response = await getAccountGroupList(params);
          return {
            data: response.data.items,
            success: true,
            total: response.data.total,
          };
        }}
        columns={columns}
      />

      <CreateAccountGroupModal
        open={isCreateModalOpen}
        onCancel={handleModalClose}
        onSuccess={() => {
          handleModalClose();
          actionRef.current?.reload();
        }}
        editingRecord={editingRecord}
      />
    </>
  );
};

export default AccountGroupList;
