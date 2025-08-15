import {
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useRequest } from '@umijs/max';
import type { Task, TaskFormData } from '../data.d';
import { createTask, updateTask } from '@/services/task/task';
import { getProjects, type Project } from '@/services/project/project';
import { getAccountGroupList } from '@/services/account/account-group';
import { getScripts, type Script } from '@/services/project/script';

interface TaskFormProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  current?: Task;
  onSuccess: () => void;
  editMode?: 'simple' | 'full';
}

const TaskForm: React.FC<TaskFormProps> = ({
  visible,
  onVisibleChange,
  current,
  onSuccess,
  editMode = 'full',
}) => {
  const { data: projectsResponse } = useRequest<any>(() => getProjects({ current: 1, pageSize: 100 }));
  const { data: accountGroupsResponse } = useRequest<any>(() => getAccountGroupList({ current: 1, pageSize: 100 }));
  const { data: scriptsResponse } = useRequest<any>(() => getScripts({ current: 1, pageSize: 100 }));

  const projects = projectsResponse?.data || [];
  const accountGroups = accountGroupsResponse?.list || [];
  const scripts = scriptsResponse?.data || [];

  const handleSubmit = async (values: TaskFormData) => {
    const hide = message.loading('正在提交...');
    try {
      if (current?.id) {
        if (editMode === 'simple') {
          const partialData: Partial<TaskFormData> = {
            name: values.name,
            threadCount: values.threadCount,
          };
          await updateTask(current.id, partialData);
        } else {
          await updateTask(current.id, values);
        }
      } else {
        await createTask(values);
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
    <ModalForm<TaskFormData>
      title={current ? '编辑任务' : '新建任务'}
      width={600}
      open={visible}
      onOpenChange={onVisibleChange}
      onFinish={handleSubmit}
      initialValues={current}
    >
      <ProFormText
        name="name"
        label="任务名称"
        rules={[{ required: true, message: '请输入任务名称' }]}
      />
      <ProFormDigit
        name="threadCount"
        label="执行线程数"
        min={1}
        max={100}
        rules={[{ required: true, message: '请输入执行线程数' }]}
      />

      {editMode === 'full' && (
        <>
          <ProFormSelect
            name="projectId"
            label="所属项目"
            options={projects.map((project: Project) => ({
              label: project.name,
              value: project.id,
            }))}
            rules={[{ required: true, message: '请选择所属项目' }]}
          />
          <ProFormSelect
            name="accountGroupIds"
            label="账号组"
            mode="multiple"
            options={accountGroups.map((group: API.AccountGroupListItem) => ({
              label: group.name,
              value: group.id,
            }))}
            rules={[{ required: true, message: '请选择账号组' }]}
          />
          <ProFormSelect
            name="scriptIds"
            label="执行脚本"
            mode="multiple"
            options={scripts.map((script: Script) => ({
              label: script.name,
              value: script.id,
            }))}
            rules={[{ required: true, message: '请选择执行脚本' }]}
          />
        </>
      )}
    </ModalForm>
  );
};

export default TaskForm;
