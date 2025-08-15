import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { message, Form } from 'antd';
import type { DiscordAccount } from '@/services/account/discord-account';
import {
  createDiscordAccount,
  updateDiscordAccount,
} from '@/services/account/discord-account';
import React, { useEffect } from 'react';

export interface DiscordAccountFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: DiscordAccount;
  onSuccess: () => void;
}

const DiscordAccountForm: React.FC<DiscordAccountFormProps> = ({
  open,
  onOpenChange,
  values,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const token = Form.useWatch('token', form);

  useEffect(() => {
    if (open && values) {
      form.setFieldsValue(values);
    } else if (open) {
      form.resetFields();
    }
  }, [form, open, values]);

  console.log('Form values:', values);

  const handleSubmit = async (formData: DiscordAccount) => {
    try {
      if (values?.discordId) {
        await updateDiscordAccount(values.discordId, formData);
        message.success('更新成功');
      } else {
        await createDiscordAccount(formData);
        message.success('创建成功');
      }
      onSuccess();
      return true;
    } catch (error) {
      message.error('操作失败');
      return false;
    }
  };

  return (
    <ModalForm
      title={values ? '编辑Discord账户' : '新建Discord账户'}
      width={600}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
      form={form}
    >
      <ProFormText
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      />
      <ProFormText name="token" label="Token" tooltip="如果提供了Token，密码可以为空" />
      <ProFormText
        name="email"
        label="邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      />
      <ProFormText.Password
        name="password"
        label="密码"
        rules={[
          {
            required: !token,
            message: '请输入密码或提供Token',
          },
        ]}
      />
    </ModalForm>
  );
};

export default DiscordAccountForm;
