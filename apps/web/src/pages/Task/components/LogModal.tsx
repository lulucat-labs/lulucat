import { Modal, List } from 'antd';

interface LogModalProps {
  visible: boolean;
  onClose: () => void;
  taskLogs: string[];
}

const LogModal: React.FC<LogModalProps> = ({ visible, onClose, taskLogs }) => {
  return (
    <Modal
      title="任务执行日志"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <List
        itemLayout="vertical"
        dataSource={taskLogs}
        renderItem={(item: string) => (
          <List.Item>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f5f5f5',
                padding: '8px',
                maxHeight: '500px',
                overflow: 'auto',
              }}
            >
              {item || '无日志内容'}
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default LogModal;
