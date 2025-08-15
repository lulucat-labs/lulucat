import {
  ModalForm,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import type { EmailAccount } from '@/services/account/email-account';
import { createEmailAccount, updateEmailAccount } from '@/services/account/email-account';

export interface EmailAccountFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: EmailAccount;
  onSuccess: () => void;
}

const EmailAccountForm: React.FC<EmailAccountFormProps> = ({
  open,
  onOpenChange,
  values,
  onSuccess,
}) => {
  const handleSubmit = async (formData: EmailAccount) => {
    try {
      if (values?.id) {
        await updateEmailAccount(values.id, formData);
        message.success('更新成功');
      } else {
        await createEmailAccount(formData);
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
      title={values ? '编辑邮箱账户' : '新建邮箱账户'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
    >
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
      <ProFormSelect
        name="provider"
        label="服务商"
        options={[
          { label: 'Gmail', value: 'gmail' },
          { label: 'Outlook', value: 'outlook' },
          { label: 'Yahoo', value: 'yahoo' },
          { label: '其他', value: 'other' },
        ]}
        rules={[{ required: true, message: '请选择服务商' }]}
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

export default EmailAccountForm;
