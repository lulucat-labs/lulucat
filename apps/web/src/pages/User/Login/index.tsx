import { Footer } from '@/components';
import okxWalletService from '@/services/wallet/okx-wallet';
import { WalletOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox } from '@ant-design/pro-components';
import { FormattedMessage, history, SelectLang, useIntl, useModel, Helmet } from '@umijs/max';
import { Alert, message, Button, Typography } from 'antd';
import Settings from '../../../../config/defaultSettings';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { createStyles } from 'antd-style';

const { Text, Title } = Typography;

const useStyles = createStyles(({ token }) => {
  return {
    action: {
      marginLeft: '8px',
      color: 'rgba(0, 0, 0, 0.2)',
      fontSize: '24px',
      verticalAlign: 'middle',
      cursor: 'pointer',
      transition: 'color 0.3s',
      '&:hover': {
        color: token.colorPrimaryActive,
      },
    },
    lang: {
      width: 42,
      height: 42,
      lineHeight: '42px',
      position: 'fixed',
      right: 16,
      borderRadius: token.borderRadius,
      ':hover': {
        backgroundColor: token.colorBgTextHover,
      },
    },
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    walletButton: {
      width: '100%',
      height: '40px',
      marginTop: '24px',
      fontSize: '16px',
    },
    walletContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    },
    walletIcon: {
      fontSize: '48px',
      marginBottom: '16px',
      color: token.colorPrimary,
    },
  };
});

const Lang = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.lang} data-lang>
      {SelectLang && <SelectLang />}
    </div>
  );
};

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState] = useState<API.LoginResult>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const intl = useIntl();

  const handleWalletLogin = async () => {
    try {
      setLoading(true);
      console.log('开始钱包登录流程');
      console.log('当前用户状态:', initialState?.currentUser ? '已登录' : '未登录');

      // 连接钱包并登录
      const result = await okxWalletService.login();
      console.log('钱包登录结果:', result);

      if (result && result.token && result.user) {
        // 保存token到localStorage
        localStorage.setItem('token', result.token);

        // 保存用户信息
        const userInfo = {
          name: result.user.walletAddress,
          avatar: 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png',
          userid: result.user.userId.toString(),
          walletAddress: result.user.walletAddress,
          access: 'user',
        };
        console.log('用户信息已准备:', userInfo);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        console.log('Token已保存到localStorage');

        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        message.success(defaultLoginSuccessMessage);

        // 更新全局状态
        console.log('更新全局状态前');
        flushSync(() => {
          setInitialState((s) => ({
            ...s,
            currentUser: userInfo,
          }));
        });
        console.log('全局状态已更新');

        // 获取重定向URL
        const urlParams = new URL(window.location.href).searchParams;
        const redirectPath = urlParams.get('redirect') || '/';
        console.log('准备跳转到:', redirectPath);

        // 跳转到重定向页面
        history.push(redirectPath);
      } else {
        throw new Error('登录失败，未获取到用户信息');
      }
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      console.error('登录失败:', error);
      message.error(defaultLoginFailureMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({
            id: 'menu.login',
            defaultMessage: '登录页',
          })}
          - {Settings.title}
        </title>
      </Helmet>
      {/* <Lang /> */}
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <div className={styles.walletContainer}>
          <WalletOutlined className={styles.walletIcon} />
          <Title level={4}>
            <FormattedMessage id="pages.login.walletLogin.title" defaultMessage="OKX钱包登录" />
          </Title>
          <Text type="secondary" style={{ marginBottom: 24, textAlign: 'center' }}>
            <FormattedMessage
              id="pages.login.walletLogin.desc"
              defaultMessage="使用OKX钱包连接并登录，安全便捷"
            />
          </Text>

          <Button
            style={{
              width: '200px',
            }}
            type="primary"
            size="large"
            icon={<WalletOutlined />}
            loading={loading}
            onClick={handleWalletLogin}
            className={styles.walletButton}
          >
            <FormattedMessage id="pages.login.walletLogin.button" defaultMessage="连接钱包登录" />
          </Button>

          <div style={{ marginTop: 24 }}>
            <Text type="secondary">
              <FormattedMessage id="pages.login.walletLogin.help" defaultMessage="没有OKX钱包？" />
            </Text>
            <a href="https://www.okx.com/cn/web3/wallet" target="_blank" rel="noopener noreferrer">
              <FormattedMessage id="pages.login.walletLogin.download" defaultMessage="下载安装" />
            </a>
          </div>
        </div>
        {/* <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="Ant Design"
          subTitle={intl.formatMessage({ id: 'pages.layouts.userLayout.title' })}
          initialValues={{
            autoLogin: true,
          }}
        >
          {userLoginState.status === 'error' && (
            <LoginMessage
              content={intl.formatMessage({
                id: 'pages.login.failure',
                defaultMessage: '登录失败，请重试！',
              })}
            />
          )}

          <div
            style={{
              marginBottom: 24,
              marginTop: 24,
              textAlign: 'center',
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              <FormattedMessage id="pages.login.rememberMe" defaultMessage="自动登录" />
            </ProFormCheckbox>
          </div>
        </LoginForm> */}
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default Login;
