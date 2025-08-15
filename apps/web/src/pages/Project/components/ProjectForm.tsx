import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import { message } from 'antd';
import type { Project } from '@/services/project/project';
import { createProject, updateProject } from '@/services/project/project';

export interface ProjectFormProps {
  open?: boolean;
  onOpenChange?: (visible: boolean) => void;
  values?: Project;
  onSuccess: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ open, onOpenChange, values, onSuccess }) => {
  const handleSubmit = async (formData: Project) => {
    try {
      if (values?.id) {
        await updateProject(values.id, formData);
        message.success('更新成功');
      } else {
        await createProject(formData);
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
      title={values ? '编辑项目' : '新建项目'}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={values}
    >
      <ProFormText
        name="name"
        label="项目名称"
        rules={[{ required: true, message: '请输入项目名称' }]}
      />
      <ProFormTextArea
        name="description"
        label="项目描述"
        rules={[{ required: true, message: '请输入项目描述' }]}
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

export default ProjectForm;
