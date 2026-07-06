import { list, remove } from '../../services/favorites';
import { CopywritingResult, FavoriteItem, RecordType, WatermarkResult } from '../../types/domain';
import { formatDateTime, typeLabel } from '../../utils/format';
import { setStorage } from '../../utils/storage';
import { confirmAction, copyText, showToast } from '../../utils/ui';

const filters: Array<{ label: string; value: '' | RecordType }> = [
  { label: '全部', value: '' },
  { label: '去水印', value: 'watermark' },
  { label: '标题', value: 'title' },
  { label: '文案', value: 'copywriting' },
];

interface ViewFavorite extends FavoriteItem {
  label: string;
  time: string;
}

Component({
  data: {
    filters,
    activeType: '' as '' | RecordType,
    items: [] as ViewFavorite[],
  },
  pageLifetimes: {
    show() {
      this.load();
    },
  },
  lifetimes: {
    attached() {
      this.load();
    },
  },
  methods: {
    async load() {
      const items = await list(this.data.activeType || undefined);
      this.setData({
        items: items.map((item) => ({
          ...item,
          label: typeLabel(item.type),
          time: formatDateTime(item.createdAt),
        })),
      });
    },
    switchType(e: WechatMiniprogram.TouchEvent) {
      this.setData({ activeType: e.currentTarget.dataset.type as '' | RecordType });
      this.load();
    },
    open(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const item = this.data.items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      if (item.type === 'watermark') {
        setStorage('hshu_latest_watermark', item.payload as WatermarkResult);
        wx.navigateTo({ url: '/pages/watermark-result/watermark-result' });
        return;
      }

      if (item.type === 'copywriting') {
        const payload = item.payload as CopywritingResult;
        copyText(`${payload.title}\n\n${payload.body}\n\n${payload.tags.map((tag) => `#${tag}`).join(' ')}`);
        return;
      }

      copyText(String(item.payload), '标题已复制');
    },
    copy(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const item = this.data.items.find((entry) => entry.id === id);
      if (item) {
        copyText(item.summary || item.title);
      }
    },
    async remove(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const ok = await confirmAction('删除这个收藏？');
      if (!ok) {
        return;
      }
      await remove(id);
      showToast('已删除', 'success');
      this.load();
    },
  },
});
