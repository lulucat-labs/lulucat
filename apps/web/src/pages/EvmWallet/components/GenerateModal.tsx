import React from 'react';
import { Modal, Form, InputNumber, message } from 'antd';
import { generateEvmWallets } from '@/services/wallet/evm-wallet';

interface GenerateModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const GenerateModal: React.FC<GenerateModalProps> = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const response = await generateEvmWallets(values.count);
      if (response.code === 200) {
        message.success('生成成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || '生成失败');
      }
    } catch (error) {
      console.error('Generate wallets error:', error);
      message.error('生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="生成 EVM 钱包"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="count"
          label="生成数量"
          rules={[
            { required: true, message: '请输入生成数量' },
            { type: 'number', min: 1, max: 9999, message: '生成数量必须在 1-9999 之间' },
          ]}
        >
          <InputNumber style={{ width: '100%' }} placeholder="请输入要生成的钱包数量" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GenerateModal;
