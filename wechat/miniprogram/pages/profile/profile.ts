import { syncTabBar } from '../../utils/tabbar';
import { getGenerateQuota } from '../../services/generate';
import {
  buildSharePath,
  enableShareMenu,
  TOOLBOX_SHARE_TITLE,
} from '../../utils/share';
import { showToast } from '../../utils/ui';

Component({
  data: {
    quotaLoading: true,
    quotaError: false,
    quotaStats: [
      { key: 'watermark', num: '--', label: '去水印剩余' },
      { key: 'title', num: '--', label: '标题剩余' },
      { key: 'copywriting', num: '--', label: '文案剩余' },
    ],
    links: [
      { title: '历史记录', desc: '查看最近使用过的工具结果', url: '/pages/history/history' },
      { title: '我的收藏', desc: '保存常用标题、文案和解析结果', url: '/pages/favorites/favorites' },
      { title: '使用说明', desc: '了解三个工具的使用方式', url: '/pages/guide/guide' },
      { title: '免责声明', desc: '版权和合规使用说明', url: '/pages/disclaimer/disclaimer' },
    ],
  },
  pageLifetimes: {
    show() {
      syncTabBar(this, 3);
      enableShareMenu();
      this.loadQuota();
    },
  },
  methods: {
    onShareAppMessage() {
      return {
        title: TOOLBOX_SHARE_TITLE,
        path: buildSharePath('/pages/watermark/watermark', {
          from: 'profile_share',
        }),
      };
    },
    onShareTimeline() {
      return {
        title: TOOLBOX_SHARE_TITLE,
        query: 'from=profile_timeline',
      };
    },
    async loadQuota() {
      this.setData({ quotaLoading: true, quotaError: false });
      try {
        const quota = await getGenerateQuota();
        this.setData({
          quotaStats: [
            {
              key: 'watermark',
              num: String(quota.watermark.remaining),
              label: '去水印剩余',
            },
            {
              key: 'title',
              num: String(quota.title.remaining),
              label: '标题剩余',
            },
            {
              key: 'copywriting',
              num: String(quota.copywriting.remaining),
              label: '文案剩余',
            },
          ],
          quotaLoading: false,
        });
      } catch {
        this.setData({ quotaLoading: false, quotaError: true });
        showToast('额度加载失败，请稍后重试');
      }
    },
    go(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      wx.navigateTo({ url });
    },
  },
});
