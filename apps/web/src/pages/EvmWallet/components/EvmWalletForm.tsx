import {
  ModalForm,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import type { EvmWallet } from '@/services/wallet/evm-wallet';
import { createEvmWallet, updateEvmWallet } from '@/services/wallet/evm-wallet';

export interface EvmWalletFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: EvmWallet;
  onSuccess: () => void;
}

const EvmWalletForm: React.FC<EvmWalletFormProps> = ({
  open,
  onOpenChange,
  values,
  onSuccess,
}) => {
  const handleSubmit = async (formData: EvmWallet) => {
    try {
      if (values?.id) {
        await updateEvmWallet(values.id, formData);
        message.success('更新成功');
      } else {
        await createEvmWallet(formData);
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
      title={values ? '编辑EVM钱包' : '新建EVM钱包'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
    >
      <ProFormText
        name="address"
        label="地址"
        rules={[
          { required: true, message: '请输入地址' },
          { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' },
        ]}
      />
      <ProFormText.Password
        name="privateKey"
        label="私钥"
        rules={[
          { required: true, message: '请输入私钥' },
          { pattern: /^[a-fA-F0-9]{64}$/, message: '请输入有效的私钥' },
        ]}
      />
      <ProFormSelect
        name="network"
        label="网络"
        options={[
          { label: 'Ethereum', value: 'ethereum' },
          { label: 'BSC', value: 'bsc' },
          { label: 'Polygon', value: 'polygon' },
          { label: 'Arbitrum', value: 'arbitrum' },
          { label: 'Optimism', value: 'optimism' },
        ]}
        rules={[{ required: true, message: '请选择网络' }]}
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

export default EvmWalletForm;
