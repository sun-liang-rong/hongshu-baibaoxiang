import { refreshOpenid } from './services/auth';

App<IAppOption>({
  globalData: {
    userInfo: undefined,
  },
  onLaunch() {
    wx.setStorageSync('hshu_launched_at', Date.now());
    refreshOpenid().catch((error) => {
      console.warn('openid 初始化失败，将在业务请求时重试', error);
      // 请求层会在需要 openid 时再次尝试获取。
    });
  },
});
