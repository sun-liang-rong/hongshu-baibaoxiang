Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/watermark/watermark",
        text: "水印",
        iconPath: "/assets/tabbar/watermark.png",
        selectedIconPath: "/assets/tabbar/watermark-active.png",
      },
      {
        pagePath: "/pages/title-generate/title-generate",
        text: "标题",
        iconPath: "/assets/tabbar/title.png",
        selectedIconPath: "/assets/tabbar/title-active.png",
      },
      {
        pagePath: "/pages/copywriting-generate/copywriting-generate",
        text: "文案",
        iconPath: "/assets/tabbar/copywriting.png",
        selectedIconPath: "/assets/tabbar/copywriting-active.png",
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/assets/tabbar/profile.png",
        selectedIconPath: "/assets/tabbar/profile-active.png",
      },
    ],
  },
  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const { path, index } = e.currentTarget.dataset as {
        path: string;
        index: number;
      };
      this.setData({ selected: Number(index) });
      wx.switchTab({ url: path });
    },
  },
});
