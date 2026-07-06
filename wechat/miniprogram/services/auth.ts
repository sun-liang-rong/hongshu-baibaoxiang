import { isMockMode } from '../config/env';
import { UserProfile } from '../types/domain';
import { setStorage } from '../utils/storage';
import { request } from './request';

export const login = (): Promise<{ accessToken: string; user: UserProfile }> => {
  if (isMockMode()) {
    const data = {
      accessToken: 'mock-token',
      user: {
        id: 'mock-user',
        nickname: '红薯创作者',
        avatarUrl: '',
      },
    };
    setStorage('hshu_token', data.accessToken);
    return Promise.resolve(data);
  }

  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        request<{ accessToken: string; user: UserProfile }>({
          url: '/auth/wechat-login',
          method: 'POST',
          data: { code: res.code },
        })
          .then((data) => {
            setStorage('hshu_token', data.accessToken);
            resolve(data);
          })
          .catch(reject);
      },
      fail: () => reject(new Error('微信登录失败')),
    });
  });
};

