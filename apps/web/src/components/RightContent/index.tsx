import { QuestionCircleOutlined } from '@ant-design/icons';
import { SelectLang as UmiSelectLang } from '@umijs/max';
import React from 'react';
import { Space } from 'antd';
import { createStyles } from 'antd-style';
import TaskNotification from '@/components/TaskNotification';

const useStyles = createStyles(({ token }) => {
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      height: '100%',
    },
    right: {
      display: 'flex',
      float: 'right',
      height: '48px',
      marginLeft: 'auto',
      overflow: 'hidden',
      gap: 12,
      alignItems: 'center',
    },
    action: {
      display: 'flex',
      alignItems: 'center',
      height: '48px',
      padding: '0 8px',
      fontSize: 18,
      cursor: 'pointer',
      transition: 'all 0.3s',
      '&:hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    avatar: {
      marginLeft: 8,
      marginRight: 8,
    }
  };
});

export type SiderTheme = 'light' | 'dark';

export const SelectLang = () => {
  return (
    <UmiSelectLang
      style={{
        padding: 4,
      }}
    />
  );
};

export const Question = () => {
  return (
    <div
      style={{
        display: 'flex',
        height: 26,
      }}
      onClick={() => {
        window.open('https://pro.ant.design/docs/getting-started');
      }}
    >
      <QuestionCircleOutlined />
    </div>
  );
};

// Main RightContent component
const RightContent: React.FC = () => {
  const { styles } = useStyles();
  
  return (
    <div className={styles.container}>
      <Space className={styles.right}>
        <TaskNotification />
        <Question />
        <SelectLang />
      </Space>
    </div>
  );
};

export default RightContent;
