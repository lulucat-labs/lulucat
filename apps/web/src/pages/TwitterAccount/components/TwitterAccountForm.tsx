import {
  ModalForm,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import type { TwitterAccount } from '@/services/account/twitter-account';
import { createTwitterAccount, updateTwitterAccount } from '@/services/account/twitter-account';

export interface TwitterAccountFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: TwitterAccount;
  onSuccess: () => void;
}

const TwitterAccountForm: React.FC<TwitterAccountFormProps> = ({
  open,
  onOpenChange,
  values,
  onSuccess,
}) => {
  const handleSubmit = async (formData: TwitterAccount) => {
    try {
      if (values?.id) {
        await updateTwitterAccount(values.id, formData);
        message.success('更新成功');
      } else {
        await createTwitterAccount(formData);
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
      title={values ? '编辑Twitter账户' : '新建Twitter账户'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
    >
      <ProFormText
        name="username"
        label="用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      />
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
        rules={[{ required: true, message: '请输入密码' }]}
      />
      <ProFormText
        name="token"
        label="Token"
      />
      <ProFormSelect
        name="status"
        label="状态"
        options={[
          { label: '活跃', value: 'active' },
          { label: '未活跃', value: 'inactive' },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
      />
    </ModalForm>
  );
};

export default TwitterAccountForm;
