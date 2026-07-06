App<IAppOption>({
  globalData: {
    userInfo: undefined,
  },
  onLaunch() {
    wx.setStorageSync('hshu_launched_at', Date.now());
  },
});
