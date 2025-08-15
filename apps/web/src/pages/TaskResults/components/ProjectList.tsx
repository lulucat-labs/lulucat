import React, { useEffect, useState } from 'react';
import { List, Empty, message } from 'antd';
import { getUserProjects, Project } from '@/services/task/task-results';

interface ProjectListProps {
  /** 当前选中的项目ID */
  selectedProjectId?: number;
  /** 项目选择回调 */
  onProjectSelect: (project: Project) => void;
  /** 加载状态 */
  loading?: boolean;
}

const ProjectList: React.FC<ProjectListProps> = ({
  selectedProjectId,
  onProjectSelect,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载项目列表
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await getUserProjects();
      setProjects(projectList);

      // 如果没有选中项目且有项目列表，默认选中第一个
      if (!selectedProjectId && projectList.length > 0) {
        onProjectSelect(projectList[0]);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      message.error('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectClick = (project: Project) => {
    onProjectSelect(project);
  };

  return (
    <List
      split={false}
      loading={loading}
      locale={{ emptyText: <Empty description="暂无项目" /> }}
      dataSource={projects}
      renderItem={(project) => (
        <List.Item
          key={project.id}
          onClick={() => handleProjectClick(project)}
          className={`task-item ${selectedProjectId === project.id ? 'active' : ''}`}
        >
          {project.name}
        </List.Item>
      )}
    />
  );
};

export default ProjectList;
