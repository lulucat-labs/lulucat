import {
  ModalForm,
  ProFormText,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import type { BrowserFingerprintFormData } from '../data.d';
import { createBrowserFingerprint, updateBrowserFingerprint } from '@/services/browser/browser-fingerprint';

interface BrowserFingerprintFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  current?: API.BrowserFingerprintListItem;
  onSuccess: () => void;
}

const BrowserFingerprintForm: React.FC<BrowserFingerprintFormProps> = ({
  visible,
  onVisibleChange,
  current,
  onSuccess,
}) => {
  const handleSubmit = async (values: BrowserFingerprintFormData) => {
    const hide = message.loading('正在提交...');
    try {
      if (current?.id) {
        await updateBrowserFingerprint(current.id, values);
      } else {
        await createBrowserFingerprint(values);
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
    <ModalForm<BrowserFingerprintFormData>
      title={current ? '编辑浏览器指纹' : '新建浏览器指纹'}
      width={600}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      initialValues={current}
    >
      <ProFormText
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      />
      <ProFormSelect
        name="browserType"
        label="浏览器类型"
        options={[
          { label: 'Chrome', value: 'chrome' },
          { label: 'Firefox', value: 'firefox' },
          { label: 'Safari', value: 'safari' },
          { label: 'Edge', value: 'edge' },
        ]}
        rules={[{ required: true, message: '请选择浏览器类型' }]}
      />
      <ProFormText
        name="browserVersion"
        label="浏览器版本"
        rules={[{ required: true, message: '请输入浏览器版本' }]}
      />
      <ProFormSelect
        name="os"
        label="操作系统"
        options={[
          { label: 'Windows', value: 'windows' },
          { label: 'macOS', value: 'macos' },
          { label: 'Linux', value: 'linux' },
          { label: 'Android', value: 'android' },
          { label: 'iOS', value: 'ios' },
        ]}
        rules={[{ required: true, message: '请选择操作系统' }]}
      />
      <ProFormText
        name="screenResolution"
        label="屏幕分辨率"
        placeholder="例如：1920x1080"
        rules={[{ required: true, message: '请输入屏幕分辨率' }]}
      />
      <ProFormSelect
        name="language"
        label="语言"
        options={[
          { label: '简体中文', value: 'zh-CN' },
          { label: '繁体中文', value: 'zh-TW' },
          { label: '英语', value: 'en-US' },
          { label: '日语', value: 'ja-JP' },
          { label: '韩语', value: 'ko-KR' },
        ]}
        rules={[{ required: true, message: '请选择语言' }]}
      />
      <ProFormSelect
        name="timezone"
        label="时区"
        options={[
          { label: '(GMT+08:00) 北京', value: 'Asia/Shanghai' },
          { label: '(GMT+08:00) 香港', value: 'Asia/Hong_Kong' },
          { label: '(GMT+08:00) 台北', value: 'Asia/Taipei' },
          { label: '(GMT+09:00) 东京', value: 'Asia/Tokyo' },
          { label: '(GMT+09:00) 首尔', value: 'Asia/Seoul' },
          { label: '(GMT-08:00) 洛杉矶', value: 'America/Los_Angeles' },
          { label: '(GMT-05:00) 纽约', value: 'America/New_York' },
        ]}
        rules={[{ required: true, message: '请选择时区' }]}
      />
    </ModalForm>
  );
};

export default BrowserFingerprintForm;
