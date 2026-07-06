import { login } from '../../services/auth';
import { UserProfile } from '../../types/domain';
import { showToast } from '../../utils/ui';

Component({
  data: {
    user: null as UserProfile | null,
    avatarText: '红',
    nickname: '红薯创作者',
    links: [
      { title: '历史记录', desc: '查看最近使用过的工具结果', url: '/pages/history/history' },
      { title: '我的收藏', desc: '保存常用标题、文案和解析结果', url: '/pages/favorites/favorites' },
      { title: '使用说明', desc: '了解三个工具的使用方式', url: '/pages/guide/guide' },
      { title: '免责声明', desc: '版权和合规使用说明', url: '/pages/disclaimer/disclaimer' },
    ],
  },
  lifetimes: {
    attached() {
      login()
        .then((res) =>
          this.setData({
            user: res.user,
            avatarText: res.user.nickname ? res.user.nickname.slice(0, 1) : '红',
            nickname: res.user.nickname || '红薯创作者',
          }),
        )
        .catch(() => showToast('登录失败，可继续使用本地工具'));
    },
  },
  methods: {
    go(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      wx.navigateTo({ url });
    },
  },
});
