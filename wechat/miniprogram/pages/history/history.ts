import { clear, list, remove } from '../../services/history';
import { HistoryItem, RecordType, WatermarkResult } from '../../types/domain';
import { formatDateTime, typeLabel } from '../../utils/format';
import { setStorage } from '../../utils/storage';
import { confirmAction, copyText, showToast } from '../../utils/ui';

const filters: Array<{ label: string; value: '' | RecordType }> = [
  { label: '全部', value: '' },
  { label: '去水印', value: 'watermark' },
  { label: '标题', value: 'title' },
  { label: '文案', value: 'copywriting' },
];

interface ViewItem extends HistoryItem {
  label: string;
  time: string;
}

Component({
  data: {
    filters,
    activeType: '' as '' | RecordType,
    items: [] as ViewItem[],
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
      const activeType = this.data.activeType || undefined;
      const items = await list(activeType);
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

      if (item.type === 'title') {
        copyText((item.payload as { titles: string[] }).titles.join('\n'), '标题已复制');
        return;
      }

      setStorage('hshu_copy_seed', item.title);
      wx.switchTab({ url: '/pages/copywriting-generate/copywriting-generate' });
    },
    copy(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const item = this.data.items.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      if (item.type === 'title') {
        copyText((item.payload as { titles: string[] }).titles.join('\n'));
        return;
      }

      copyText(item.summary || item.title);
    },
    async remove(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string;
      const ok = await confirmAction('删除这条历史记录？');
      if (!ok) {
        return;
      }
      await remove(id);
      showToast('已删除', 'success');
      this.load();
    },
    async clearAll() {
      const ok = await confirmAction(this.data.activeType ? '清空当前分类的历史记录？' : '清空全部历史记录？');
      if (!ok) {
        return;
      }
      await clear(this.data.activeType || undefined);
      showToast('已清空', 'success');
      this.load();
    },
  },
});
