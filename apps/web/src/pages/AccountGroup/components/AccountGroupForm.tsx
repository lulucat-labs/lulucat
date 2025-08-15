import {
  ModalForm,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, message } from 'antd';
import type { AccountGroupFormData, AccountGroupItemFormData } from '../data.d';
import { createAccountGroup, updateAccountGroup, AccountGroupItem } from '@/services/account/account-group';
import AccountItemsTable from './AccountItemsTable';
import React from 'react';

interface AccountGroupFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  current?: AccountGroupItem;
  onSuccess: () => void;
}

const AccountGroupForm: React.FC<AccountGroupFormProps> = ({
  visible,
  onVisibleChange,
  current,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // 监听 visible 和 current 变化，重置表单
  React.useEffect(() => {
    if (visible) {
      const initialValues = current
        ? {
            name: current.name,
            items: current.items.map((item) => ({
              id: item.id, // 保留id，用于后端识别要更新的项
              discordAccountId: item.discordAccountId,
              emailAccountId: item.emailAccountId,
              evmWalletId: item.evmWalletId,
              twitterAccountId: item.twitterAccountId,
            })),
          }
        : {
            name: '',
            items: [{}], // 默认添加一个空的账号项
          };

      form.setFieldsValue(initialValues);
    }
  }, [visible, current, form]);

  // 表单提交前验证账号项
  const validateItems = (items: AccountGroupItemFormData[]) => {
    // 验证是否至少有一个账号项
    if (!items || items.length === 0) {
      return Promise.reject(new Error('请至少添加一个账号项'));
    }

    // 验证每个账号项是否选择了至少一个账号
    const invalidItems = items.filter(
      (item) => !item.evmWalletId && !item.discordAccountId && !item.emailAccountId && !item.twitterAccountId
    );
    if (invalidItems.length > 0) {
      return Promise.reject(new Error('每个账号项必须至少选择一个账号'));
    }

    return Promise.resolve();
  };

  const handleSubmit = async (values: AccountGroupFormData) => {
    const hide = message.loading('正在提交...');
    try {
      if (current?.id) {
        await updateAccountGroup(current.id, values);
      } else {
        await createAccountGroup(values);
      }
      hide();
      message.success('提交成功');
      onSuccess();
      return true;
    } catch (error) {
      hide();
      message.error('提交失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm<AccountGroupFormData>
      title={current ? '编辑账号组' : '新建账号组'}
      width={1200}
      open={visible}
      onOpenChange={(v) => {
        if (!v) {
          form.resetFields();
        }
        onVisibleChange(v);
      }}
      form={form}
      onFinish={handleSubmit}
    >
      <ProFormText
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      />

      <Form.Item
        name="items"
        label="账号项"
        rules={[
          { required: true, message: '请添加账号项' },
          { validator: (_, value) => validateItems(value) },
        ]}
      >
        <AccountItemsTable />
      </Form.Item>
    </ModalForm>
  );
};

export default AccountGroupForm;
