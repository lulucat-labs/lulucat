import {
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { createTask } from '@/services/task/task';
import { getAccountGroupList } from '@/services/account/account-group';
import { getScripts } from '@/services/project/script';
import type { Project } from '@/services/project/project';

interface CreateTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSuccess: () => void;
}

// 定义脚本项的数据结构
interface ScriptItem {
  id: number;
  name: string;
  filePath: string;
  isPublic: boolean;
  description: string | null;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  open,
  onOpenChange,
  project,
  onSuccess,
}) => {
  const [accountGroups, setAccountGroups] = useState<any[]>([]);
  const [scripts, setScripts] = useState<ScriptItem[]>([]);
  const [loadingAccountGroups, setLoadingAccountGroups] = useState<boolean>(false);
  const [loadingScripts, setLoadingScripts] = useState<boolean>(false);

  // 获取账号组列表
  const fetchAccountGroups = async () => {
    setLoadingAccountGroups(true);
    try {
      const response = await getAccountGroupList({ current: 1, pageSize: 100 });
      console.log('账号组数据:', response);
      if (response?.data?.items) {
        setAccountGroups(response.data.items);
      } else {
        message.error('获取账号组数据失败');
      }
    } catch (error) {
      console.error('获取账号组失败:', error);
      message.error('获取账号组失败');
    } finally {
      setLoadingAccountGroups(false);
    }
  };

  // 获取脚本列表
  const fetchScripts = async () => {
    if (!project?.id) return;

    setLoadingScripts(true);
    try {
      // 使用 any 类型接收响应，因为我们不确定具体的响应结构
      const response: any = await getScripts({ current: 1, pageSize: 100, projectId: project.id });
      console.log('脚本数据:', response);

      // 根据实际接口返回结构处理数据
      if (response?.data?.items && Array.isArray(response.data.items)) {
        setScripts(response.data.items);
      } else {
        console.error('脚本数据格式不正确:', response);
        setScripts([]);
        message.error('获取脚本数据失败：数据格式不正确');
      }
    } catch (error) {
      console.error('获取脚本失败:', error);
      message.error('获取脚本失败');
      setScripts([]);
    } finally {
      setLoadingScripts(false);
    }
  };

  // 当弹窗打开时，获取数据
  useEffect(() => {
    if (open) {
      fetchAccountGroups();
      if (project?.id) {
        fetchScripts();
      }
    }
  }, [open, project?.id]);

  const handleSubmit = async (values: any) => {
    if (!project?.id) {
      message.error('项目ID不能为空');
      return false;
    }

    const hide = message.loading('正在提交...');
    try {
      await createTask({
        ...values,
        accountGroupIds: [values.accountGroupIds],
        projectId: project.id,
      });
      hide();
      message.success('创建任务成功');
      onSuccess();
      return true;
    } catch (error) {
      hide();
      console.error('创建任务失败:', error);
      message.error('创建任务失败，请重试');
      return false;
    }
  };

  return (
    <ModalForm
      title="创建任务"
      width={600}
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSubmit}
      initialValues={{
        threadCount: 1,
      }}
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
        max={10}
        initialValue={1}
        rules={[{ required: true, message: '请输入执行线程数' }]}
      />
      <ProFormSelect
        name="accountGroupIds"
        label="账号组"
        mode="single"
        options={accountGroups.map((group: any) => ({
          label: group.name,
          value: group.id,
        }))}
        fieldProps={{
          loading: loadingAccountGroups,
        }}
        rules={[{ required: true, message: '请选择账号组' }]}
      />
      <ProFormSelect
        name="scriptIds"
        label="任务脚本"
        mode="multiple"
        options={scripts.map((script: ScriptItem) => ({
          label: script.name,
          value: script.id,
        }))}
        fieldProps={{
          loading: loadingScripts,
        }}
        rules={[{ required: true, message: '请选择任务脚本' }]}
      />
    </ModalForm>
  );
};

export default CreateTaskForm;
