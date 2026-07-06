import { getBaseURL, isMockMode } from '../config/env';
import { ApiResponse } from '../types/domain';
import { getStorage } from '../utils/storage';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
  loadingText?: string;
}

export const request = <T>(options: RequestOptions): Promise<T> => {
  if (isMockMode()) {
    return Promise.reject(new Error(`Mock mode has no remote route: ${options.url}`));
  }

  if (options.loadingText) {
    wx.showLoading({
      title: options.loadingText,
      mask: true,
    });
  }

  const token = getStorage<string>('hshu_token', '');
  const method = (options.method === 'PATCH' ? 'PUT' : options.method || 'GET') as WechatMiniprogram.RequestOption['method'];

  return new Promise<T>((resolve, reject) => {
    wx.request<ApiResponse<T>>({
      url: `${getBaseURL()}${options.url}`,
      method,
      data: options.data as string | WechatMiniprogram.IAnyObject | ArrayBuffer | undefined,
      header: {
        'content-type': 'application/json',
        ...(options.auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (res) => {
        const body = res.data;
        if (body && body.code === 0) {
          resolve(body.data);
          return;
        }

        reject(new Error(body?.message || '请求失败'));
      },
      fail: () => reject(new Error('网络异常，请检查网络后重试')),
      complete: () => {
        if (options.loadingText) {
          wx.hideLoading();
        }
      },
    });
  });
};
