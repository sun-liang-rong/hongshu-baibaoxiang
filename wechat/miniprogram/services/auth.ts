import { getBaseURL, isMockMode } from '../config/env';
import { getStorage, removeStorage, setStorage } from '../utils/storage';

interface WechatLoginResponse {
  openid: string;
  unionid?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface OpenidSession {
  openid: string;
  unionid: string;
}

let openidTask: Promise<OpenidSession> | null = null;

const buildOpenidSession = (openid: string, unionid = ''): OpenidSession => ({
  openid,
  unionid,
});

const requestOpenid = (code: string): Promise<WechatLoginResponse> =>
  new Promise((resolve, reject) => {
    wx.request<ApiResponse<WechatLoginResponse>>({
      url: `${getBaseURL()}/auth/openid`,
      method: 'POST',
      data: { code },
      header: {
        'content-type': 'application/json',
      },
      success: (res) => {
        const body = res.data;
        if (body && body.code === 0 && body.data?.openid) {
          resolve(body.data);
          return;
        }

        reject(new Error(body?.message || 'openid 获取失败'));
      },
      fail: () => reject(new Error('网络异常，请检查网络后重试')),
    });
  });

const requestLoginCode = (): Promise<string> =>
  new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (!res.code) {
          reject(new Error('微信登录 code 为空'));
          return;
        }

        resolve(res.code);
      },
      fail: () => reject(new Error('微信登录失败')),
    });
  });

const saveOpenidSession = (data: WechatLoginResponse) => {
  const result = buildOpenidSession(data.openid, data.unionid || '');
  setStorage('hshu_openid', result.openid);
  setStorage('hshu_unionid', result.unionid);
  return result;
};

export const getOpenid = () => getStorage<string>('hshu_openid', '');

const fetchOpenidSession = (forceRefresh = false): Promise<OpenidSession> => {
  if (isMockMode()) {
    const data = buildOpenidSession('mock-openid');
    setStorage('hshu_openid', data.openid);
    return Promise.resolve(data);
  }

  const cachedOpenid = getOpenid();
  if (!forceRefresh && cachedOpenid) {
    return Promise.resolve(buildOpenidSession(cachedOpenid, getStorage<string>('hshu_unionid', '')));
  }

  if (openidTask) {
    return openidTask;
  }

  const task = requestLoginCode().then(requestOpenid).then(saveOpenidSession).finally(() => {
    openidTask = null;
  });

  openidTask = task;
  return openidTask;
};

export const refreshOpenid = (): Promise<string> => {
  removeStorage('hshu_openid');
  removeStorage('hshu_unionid');
  return fetchOpenidSession(true).then((data) => data.openid);
};

export const ensureOpenid = (): Promise<string> => {
  const cachedOpenid = getOpenid();
  if (cachedOpenid) {
    return Promise.resolve(cachedOpenid);
  }

  return fetchOpenidSession().then((data) => data.openid);
};
