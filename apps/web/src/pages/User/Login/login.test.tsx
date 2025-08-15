import { render, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { TestBrowser } from '@@/testBrowser';
import okxWalletService from '@/services/wallet/okx-wallet';

// @ts-ignore
import { startMock } from '@@/requestRecordMock';

// 模拟OKX钱包服务
jest.mock('@/services/wallet/okx-wallet', () => ({
  isWalletInstalled: jest.fn().mockReturnValue(true),
  connectWallet: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
  login: jest.fn().mockResolvedValue({
    token: 'mock-token',
    user: {
      name: 'Test User',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    },
  }),
}));

const waitTime = (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

let server: {
  close: () => void;
};

describe('Login Page', () => {
  beforeAll(async () => {
    server = await startMock({
      port: 8000,
      scene: 'login',
    });
  });

  afterAll(() => {
    server?.close();
  });

  it('should show login form', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    act(() => {
      historyRef.current?.push('/user/login');
    });

    expect(rootContainer.baseElement?.querySelector('.ant-pro-form-login-desc')?.textContent).toBe(
      'Ant Design is the most influential web design specification in Xihu district',
    );

    expect(rootContainer.asFragment()).toMatchSnapshot();

    rootContainer.unmount();
  });

  it('should login success with wallet', async () => {
    const historyRef = React.createRef<any>();
    const rootContainer = render(
      <TestBrowser
        historyRef={historyRef}
        location={{
          pathname: '/user/login',
        }}
      />,
    );

    await rootContainer.findAllByText('Ant Design');

    // 查找并点击钱包登录按钮
    const walletLoginButton = await rootContainer.findByText('连接钱包登录');

    act(() => {
      fireEvent.click(walletLoginButton);
    });

    // 等待接口返回结果
    await waitTime(5000);

    // 验证钱包登录方法被调用
    expect(okxWalletService.login).toHaveBeenCalled();

    await rootContainer.findAllByText('Ant Design Pro');

    expect(rootContainer.asFragment()).toMatchSnapshot();

    await waitTime(2000);

    rootContainer.unmount();
  });
});
