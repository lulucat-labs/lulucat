import { ActionType, ProCard } from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import {
  getTaskList,
} from '@/services/task/task';
import { getAccountGroup, updateAccountItemsStatus } from '@/services/account/account-group';
import { Button, Space, Switch, Popconfirm, Modal, Radio, message, Alert, Form } from 'antd';
import { TaskStatus } from './data.d';
import { AccountItemType, AccountStatus } from '@/services/common/enums';

import TaskForm from './components/TaskForm';
import TaskListComponent from './components/TaskList';
import TaskDetail from './components/TaskDetail';
import AccountList from './components/AccountList';
import LogModal from './components/LogModal';
import useTaskPolling from './hooks/useTaskPolling';
import useTaskActions from './hooks/useTaskActions';
import type { Task } from './data.d';

const TaskList: React.FC = () => {
  const [taskData, setTaskData] = useState<API.TaskListItem[]>([]);
  const [taskId, setTaskId] = useState<number>();
  const [loading, setLoading] = useState<boolean>(false);
  const tableRef = useRef<ActionType>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [errorCodeFilter, setErrorCodeFilter] = useState<string>('all');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [logModalVisible, setLogModalVisible] = useState<boolean>(false);
  const [taskLogs, setTaskLogs] = useState<string[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [headless, setHeadless] = useState<boolean>(false);
  const [invalidateModalVisible, setInvalidateModalVisible] = useState<boolean>(false);
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<string[]>([]);
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');
  const [invalidateLoading, setInvalidateLoading] = useState<boolean>(false);
  const [invalidateForm] = Form.useForm();

  // 使用任务轮询 hook
  const {
    taskDetail,
    taskDetailLoading,
    polling,
    getTaskDetail,
  } = useTaskPolling(taskId, tableRef);

  // 使用任务操作 hook
  const {
    taskActionLoading,
    handleDelete,
    handleStatusChange,
  } = useTaskActions(
    taskId,
    taskDetail,
    headless,
    selectedRows,
    selectedRowKeys,
    () => {
      getTaskDetail();
      tableRef.current?.reload();
    }
  );

  const [pagination, setPagination] = useState<{ current: number; pageSize: number; total?: number }>({
    current: 1,
    pageSize: 10,
  });

  const queryTaskList = async (page: number = pagination.current, size: number = pagination.pageSize) => {
    setLoading(true);
    getTaskList({
      current: page,
      pageSize: size,
    }).then((res) => {
      setLoading(false);
      if (res && res.data && Array.isArray(res.data)) {
        // 获取任务数组(内层data)
        setTaskData(res.data);
        if (res.data.length > 0 && !taskId) {
          setTaskId(res.data[0].id);
        }
        // 更新分页信息
        setPagination({
          current: res.current || page,
          pageSize: res.pageSize || size,
          total: res.total || 0,
        });
      } else {
        // 当返回结构不符合预期时
        console.error('任务列表数据格式错误:', res);
        setTaskData([]);
      }
    }).catch(() => {
      setLoading(false);
    });
  };

  // 处理页面变化
  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
    queryTaskList(page, pageSize);
  };

  useEffect(() => {
    queryTaskList();
  }, []);

  useEffect(() => {
    if (taskId) {
      setStatusFilter('all');
      setErrorCodeFilter('all');
      tableRef.current?.reloadAndRest?.();
      tableRef.current?.clearSelected?.();
    }
  }, [taskId]);

  useEffect(() => {
    // 当选中的行发生变化时，获取可用的账号类型
    if (selectedRows.length > 0) {
      const availableTypes: string[] = [];

      selectedRows.forEach((row) => {
        // 检查各种账号类型是否存在
        if (row.evmWallet) availableTypes.push(AccountItemType.EVM_WALLET);
        if (row.twitterAccount) availableTypes.push(AccountItemType.TWITTER);
        if (row.discordAccount) availableTypes.push(AccountItemType.DISCORD);
        if (row.emailAccount) availableTypes.push(AccountItemType.EMAIL);
        if (row.proxyIp) availableTypes.push(AccountItemType.PROXY_IP);
        if (row.browserFingerprint) availableTypes.push(AccountItemType.BROWSER_FINGERPRINT);
      });

      // 去重
      const uniqueTypes = [...new Set(availableTypes)];
      setSelectedAccountTypes(uniqueTypes);
    } else {
      setSelectedAccountTypes([]);
      setSelectedAccountType('');
    }
  }, [selectedRows]);

  const queryAccountGroup = async (params: any) => {
    const { current, pageSize } = params;
    if (!taskDetail) {
      return {
        data: [],
        total: 0,
        success: true,
      };
    }
    const res = await getAccountGroup(taskDetail?.accountGroups?.[0].id as number, {
      page: current,
      pageSize,
      taskId: taskDetail?.id,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      errorCode: errorCodeFilter !== 'all' ? errorCodeFilter : undefined,
    });
    return {
      data: res.data.items,
      total: res.data.total,
      success: res.code === 200,
    };
  };

  const handleEditSuccess = () => {
    // 编辑成功后刷新任务详情
    getTaskDetail();
  };

  const handleViewLogs = async (taskData: any) => {
    setLogModalVisible(true);
    const logs = taskData.taskLogs?.[0].logs.split('<br/>');
    setTaskLogs(logs);
  };

  const onSelectChange = (keys: React.Key[], rows: any[]) => {
    setSelectedRowKeys(keys);
    setSelectedRows(rows);
  };

  // 处理标记失效
  const handleInvalidate = async (values: { accountType: string }) => {
    const { accountType } = values;
    if (!accountType || !selectedRowKeys.length || !taskId) {
      message.warning('请选择要标记失效的账号类型');
      return;
    }

    setInvalidateLoading(true);
    try {
      await updateAccountItemsStatus({
        accountItemIds: selectedRows.map((row) => row.id),
        accountTypes: [accountType],
        status: AccountStatus.INVALID,
      });

      message.success('标记失效成功');
      setInvalidateModalVisible(false);
      invalidateForm.resetFields();
      tableRef.current?.reload();
    } catch (error) {
      message.error('标记失效失败，请重试');
    } finally {
      setInvalidateLoading(false);
    }
  };

  // 渲染任务详情操作按钮
  const renderTaskDetailActions = () => {
    if (!taskId) return null;

    return (
      <Space>
        <Button
          onClick={() => setEditModalVisible(true)}
          disabled={taskDetail?.status === TaskStatus.RUNNING}
        >
          修改配置
        </Button>
        <Popconfirm
          title="确定删除任务吗？"
          onConfirm={handleDelete}
          disabled={taskDetail?.status === TaskStatus.RUNNING}
        >
          <Button disabled={taskDetail?.status === TaskStatus.RUNNING}>删除</Button>
        </Popconfirm>
      </Space>
    );
  };

  // 渲染任务操作按钮
  const renderTaskActions = () => {
    if (!taskId) return null;

    return (
      <Space>
        <Button
          type="primary"
          onClick={() => handleStatusChange(false)}
          loading={taskActionLoading}
        >
          {taskDetail?.status === TaskStatus.RUNNING ? '停止' : '全部启动'}
        </Button>
        {taskDetail?.status !== TaskStatus.RUNNING && (
          <Button
            type="primary"
            onClick={() => handleStatusChange(true)}
            loading={taskActionLoading}
            disabled={selectedRowKeys.length === 0}
          >
            启动选中
          </Button>
        )}
        <Button
          danger
          onClick={() => setInvalidateModalVisible(true)}
          disabled={selectedRowKeys.length === 0}
        >
          标记失效
        </Button>
        <Switch
          checkedChildren="开启无头"
          unCheckedChildren="关闭无头"
          checked={headless}
          onChange={(checked) => setHeadless(checked)}
        />
      </Space>
    );
  };

  // 账号类型选项
  const accountTypeOptions = [
    { label: 'EVM钱包', value: AccountItemType.EVM_WALLET },
    { label: 'Twitter账号', value: AccountItemType.TWITTER },
    { label: 'Discord账号', value: AccountItemType.DISCORD },
    { label: '邮箱', value: AccountItemType.EMAIL },
    { label: '代理IP', value: AccountItemType.PROXY_IP },
    { label: '浏览器指纹', value: AccountItemType.BROWSER_FINGERPRINT },
  ];

  // 标记失效弹窗
  const renderInvalidateModal = () => {
    return (
      <Modal
        title="标记账号失效"
        open={invalidateModalVisible}
        onCancel={() => {
          setInvalidateModalVisible(false);
          invalidateForm.resetFields();
        }}
        onOk={() => {
          invalidateForm.submit();
        }}
        confirmLoading={invalidateLoading}
        okText="确认"
        cancelText="取消"
      >
        <Alert style={{ marginBottom: 16 }} showIcon message="将所选账号标记为失效状态，标记后不影响任务执行，操作不可逆。" type="info" />
        <Form
          form={invalidateForm}
          layout="vertical"
          onFinish={handleInvalidate}
        >
          <Form.Item
            label="请选择要标记为失效的账号类型"
            name="accountType"
            rules={[{ required: true, message: '请选择要标记为失效的账号类型' }]}
          >
            <Radio.Group>
              {accountTypeOptions
                .filter((option) => selectedAccountTypes.includes(option.value))
                .map((option) => (
                  <Radio value={option.value} key={option.value}>
                    {option.label}
                  </Radio>
                ))}
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  return (
    <ProCard split="vertical">
      <ProCard title="任务列表" colSpan="20%">
        <TaskListComponent
          loading={loading}
          taskData={taskData || []}
          taskId={taskId}
          setTaskId={setTaskId}
          pagination={{
            current: pagination.current || 1,
            pageSize: pagination.pageSize || 10,
            total: pagination.total || 0
          }}
          onPageChange={handlePageChange}
        />
      </ProCard>
      <ProCard split="horizontal">
        <ProCard title="任务详情" extra={renderTaskDetailActions()}>
          <TaskDetail
            taskDetailLoading={taskDetailLoading}
            taskDetail={taskDetail}
          />
        </ProCard>
        <ProCard
          title="账号列表"
          extra={renderTaskActions()}
          bodyStyle={{ padding: 0 }}
        >
          <AccountList
            taskId={taskId}
            taskDetail={taskDetail}
            polling={polling}
            tableRef={tableRef}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            errorCodeFilter={errorCodeFilter}
            setErrorCodeFilter={setErrorCodeFilter}
            selectedRowKeys={selectedRowKeys}
            selectedRows={selectedRows}
            onSelectChange={onSelectChange}
            handleStatusChange={handleStatusChange}
            taskActionLoading={taskActionLoading}
            headless={headless}
            setHeadless={setHeadless}
            handleViewLogs={handleViewLogs}
            queryAccountGroup={queryAccountGroup}
          />
        </ProCard>
      </ProCard>

      {/* 编辑任务弹窗 */}
      <TaskForm
        visible={editModalVisible}
        onVisibleChange={setEditModalVisible}
        current={taskDetail as Task}
        onSuccess={handleEditSuccess}
        editMode="simple"
      />

      {/* 任务日志弹窗 */}
      <LogModal
        visible={logModalVisible}
        onClose={() => setLogModalVisible(false)}
        taskLogs={taskLogs}
      />

      {/* 标记失效弹窗 */}
      {renderInvalidateModal()}
    </ProCard>
  );
};

export default TaskList;
