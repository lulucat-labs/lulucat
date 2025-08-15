import { Modal, Form, Input, message, Checkbox, InputNumber } from 'antd';
import { useState } from 'react';
import type { AccountGroup } from '../data.d';
import { AccountType } from '../data.d';
import { createQuickAccountGroup } from '@/services/account/account-group';

interface CreateAccountGroupModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editingRecord?: AccountGroup;
}

const CreateAccountGroupModal: React.FC<CreateAccountGroupModalProps> = ({
  open,
  onCancel,
  onSuccess,
  editingRecord,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await createQuickAccountGroup(values);
      message.success('创建成功');

      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : editingRecord ? '更新失败' : '创建失败',
      );
    } finally {
      setLoading(false);
    }
  };

  // 创建模式下的表单
  const renderCreateForm = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        excludeAssociated: true,
        excludeInvalid: true,
      }}
    >
      <Form.Item
        label="账号组名称"
        name="name"
        rules={[{ required: true, message: '请输入账号组名称' }]}
      >
        <Input placeholder="请输入账号组名称" />
      </Form.Item>

      <Form.Item
        label="账号配额"
        name="count"
        rules={[{ required: true, message: '请输入账号配额' }]}
      >
        <InputNumber min={1} max={9999} style={{ width: '100%' }} placeholder="请输入账号配额" />
      </Form.Item>

      <Form.Item
        label="账号类型"
        name="accountTypes"
        rules={[{ required: true, message: '请至少选择一种账号类型' }]}
      >
        <Checkbox.Group>
          <Checkbox value={AccountType.WALLET}>EVM钱包</Checkbox>
          <Checkbox value={AccountType.TWITTER}>Twitter账号</Checkbox>
          <Checkbox value={AccountType.DISCORD}>Discord账号</Checkbox>
          <Checkbox value={AccountType.EMAIL}>邮箱</Checkbox>
          <Checkbox value={AccountType.IP}>代理IP</Checkbox>
          <Checkbox value={AccountType.BROWSER_FINGERPRINT}>浏览器指纹</Checkbox>
        </Checkbox.Group>
      </Form.Item>

      <Form.Item label="过滤条件">
        <Form.Item name="excludeAssociated" valuePropName="checked" noStyle>
          <Checkbox>排除已被账号组关联的账号</Checkbox>
        </Form.Item>
        <Form.Item name="excludeInvalid" valuePropName="checked" noStyle>
          <Checkbox>排除失效状态的账号</Checkbox>
        </Form.Item>
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={editingRecord ? '编辑账号组' : '创建账号组'}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={620}
    >
      {renderCreateForm()}
    </Modal>
  );
};

export default CreateAccountGroupModal;
