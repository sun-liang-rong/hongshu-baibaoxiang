import { getBaseURL, isMockMode } from '../config/env';
import { ApiResponse } from '../types/domain';
import { ensureOpenid, getOpenid } from './auth';

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
  auth?: boolean;
  loadingText?: string;
  timeout?: number;
}

export const request = async <T>(options: RequestOptions): Promise<T> => {
  if (isMockMode()) {
    return Promise.reject(new Error(`Mock mode has no remote route: ${options.url}`));
  }

  const openid = options.auth ? await ensureOpenid() : getOpenid();
  const method = (options.method === 'PATCH' ? 'PUT' : options.method || 'GET') as WechatMiniprogram.RequestOption['method'];

  if (options.loadingText) {
    wx.showLoading({
      title: options.loadingText,
      mask: true,
    });
  }

  return new Promise<T>((resolve, reject) => {
    wx.request<ApiResponse<T>>({
      url: `${getBaseURL()}${options.url}`,
      method,
      data: options.data as string | WechatMiniprogram.IAnyObject | ArrayBuffer | undefined,
      header: {
        'content-type': 'application/json',
        ...(openid ? { 'x-openid': openid } : {}),
      },
      timeout: options.timeout ?? 15000,
      success: (res) => {
        const body = res.data;
        if (body && body.code === 0) {
          resolve(body.data);
          return;
        }

        reject(new Error(body?.message || '请求失败'));
      },
      fail: (error) => {
        const message = error.errMsg || '';
        if (/timeout/i.test(message)) {
          reject(new Error('请求超时，请重新尝试'));
          return;
        }
        if (/network|offline|fail/i.test(message)) {
          reject(new Error('网络不可用，请恢复网络后重试'));
          return;
        }
        reject(new Error('请求失败，请稍后重试'));
      },
      complete: () => {
        if (options.loadingText) {
          wx.hideLoading();
        }
      },
    });
  });
};
