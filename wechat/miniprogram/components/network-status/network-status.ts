const listeners = new WeakMap<
  object,
  WechatMiniprogram.OnNetworkStatusChangeCallback
>();

Component({
  data: {
    online: true,
    checking: false,
  },
  lifetimes: {
    attached() {
      this.checkNetwork();
      const listener: WechatMiniprogram.OnNetworkStatusChangeCallback = (
        result,
      ) => {
        this.setData({ online: result.isConnected, checking: false });
      };
      listeners.set(this, listener);
      wx.onNetworkStatusChange(listener);
    },
    detached() {
      const listener = listeners.get(this);
      if (listener) {
        wx.offNetworkStatusChange(
          listener as unknown as WechatMiniprogram.OffNetworkStatusChangeCallback,
        );
        listeners.delete(this);
      }
    },
  },
  methods: {
    checkNetwork() {
      this.setData({ checking: true });
      wx.getNetworkType({
        success: (result) => {
          this.setData({
            online: result.networkType !== 'none',
            checking: false,
          });
        },
        fail: () => this.setData({ checking: false }),
      });
    },
  },
});
