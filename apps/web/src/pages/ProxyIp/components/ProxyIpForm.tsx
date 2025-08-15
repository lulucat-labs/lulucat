import {
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import type { ProxyIp } from '@/services/proxy/proxy-ip';
import { createProxyIp, updateProxyIp } from '@/services/proxy/proxy-ip';

export interface ProxyIpFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: ProxyIp;
  onSuccess: () => void;
}

const ProxyIpForm: React.FC<ProxyIpFormProps> = ({ open, onOpenChange, values, onSuccess }) => {
  const handleSubmit = async (formData: ProxyIp) => {
    try {
      if (values?.id) {
        await updateProxyIp(values.id, formData);
        message.success('更新成功');
      } else {
        await createProxyIp(formData);
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
      title={values ? '编辑代理IP' : '新建代理IP'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
    >
      <ProFormText
        name="host"
        label="主机"
        rules={[{ required: true, message: '请输入主机' }]}
      />
      <ProFormDigit
        name="port"
        label="端口"
        min={1}
        max={65535}
        rules={[{ required: true, message: '请输入端口' }]}
      />
      <ProFormText
        name="username"
        label="用户名"
      />
      <ProFormText.Password
        name="password"
        label="密码"
      />
      <ProFormSelect
        name="protocol"
        label="协议"
        options={[
          { label: 'HTTP', value: 'http' },
          { label: 'HTTPS', value: 'https' },
          { label: 'SOCKS4', value: 'socks4' },
          { label: 'SOCKS5', value: 'socks5' },
        ]}
        rules={[{ required: true, message: '请选择协议' }]}
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

export default ProxyIpForm;
