import { ModalForm, ProFormDigit } from '@ant-design/pro-components';
import { message } from 'antd';
import { generateBrowserFingerprints } from '@/services/browser/browser-fingerprint';

interface GenerateFingerprintFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
}

const GenerateFingerprintForm: React.FC<GenerateFingerprintFormProps> = ({
  visible,
  onVisibleChange,
  onSuccess,
}) => {
  const handleGenerate = async (values: { count: number }) => {
    const hide = message.loading('正在生成');
    try {
      await generateBrowserFingerprints({ count: values.count });
      hide();
      message.success('生成成功');
      onSuccess();
      return true;
    } catch (error) {
      hide();
      message.error('生成失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title="生成浏览器指纹"
      width={400}
      visible={visible}
      onVisibleChange={onVisibleChange}
      onFinish={handleGenerate}
    >
      <ProFormDigit
        name="count"
        label="生成数量"
        min={1}
        max={9999}
        initialValue={1}
        fieldProps={{
          precision: 0,
        }}
        rules={[
          {
            required: true,
            message: '请输入生成数量',
          },
        ]}
      />
    </ModalForm>
  );
};

export default GenerateFingerprintForm;
