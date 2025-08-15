import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import type { Project } from '@/services/project/project';
import { getProjects } from '@/services/project/project';
import ProjectForm from './components/ProjectForm';
import CreateTaskForm from './components/CreateTaskForm';

const ProjectList: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [createTaskModalVisible, setCreateTaskModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<Project>();
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<Project>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      width: 80,
      search: false,
    },
    {
      title: '名称',
      dataIndex: 'name',
      valueType: 'text',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      valueType: 'text',
      ellipsis: true,
      width: 300,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 80,
      render: (_, record: Project) => [
        <a
          key="createTask"
          onClick={() => {
            setCurrentRow(record);
            setCreateTaskModalVisible(true);
          }}
        >
          创建任务
        </a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<Project>
        headerTitle="项目列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={getProjects}
        columns={columns}
      />
      <ProjectForm
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onSuccess={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
      />
      <ProjectForm
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        values={currentRow}
        onSuccess={() => {
          setUpdateModalVisible(false);
          setCurrentRow(undefined);
          actionRef.current?.reload();
        }}
      />
      <CreateTaskForm
        open={createTaskModalVisible}
        onOpenChange={setCreateTaskModalVisible}
        project={currentRow}
        onSuccess={() => {
          setCreateTaskModalVisible(false);
          setCurrentRow(undefined);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default ProjectList;
