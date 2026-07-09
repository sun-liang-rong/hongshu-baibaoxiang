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
    nextCursor: '',
    hasMore: false,
    loading: false,
    loadingMore: false,
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
    async load(append = false) {
      if (!append && this.data.loading) {
        return;
      }

      if (append && (!this.data.hasMore || this.data.loadingMore)) {
        return;
      }

      this.setData({
        loading: !append,
        loadingMore: append,
      });

      try {
        const page = await list(this.data.activeType || undefined, {
          cursor: append ? this.data.nextCursor : '',
        });
        const items = page.items.map((item) => this.toViewFavorite(item));
        this.setData({
          items: append ? [...this.data.items, ...items] : items,
          nextCursor: page.nextCursor,
          hasMore: Boolean(page.nextCursor),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '收藏加载失败';
        showToast(message);
      } finally {
        this.setData({
          loading: false,
          loadingMore: false,
        });
      }
    },
    switchType(e: WechatMiniprogram.CustomEvent) {
      this.setData({
        activeType: (e.detail as { value: '' | RecordType }).value,
        items: [],
        nextCursor: '',
        hasMore: false,
      });
      this.load();
    },
    loadMore() {
      this.load(true);
    },
    open(e: WechatMiniprogram.CustomEvent) {
      const id = (e.detail as { id: string }).id;
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
        setStorage('hshu_copy_result', item.payload as CopywritingResult);
        wx.switchTab({ url: '/pages/copywriting-generate/copywriting-generate' });
        return;
      }

      copyText(String(item.payload), '标题已复制');
    },
    copy(e: WechatMiniprogram.CustomEvent) {
      const id = (e.detail as { id: string }).id;
      const item = this.data.items.find((entry) => entry.id === id);
      if (item) {
        copyText(item.summary || item.title);
      }
    },
    async remove(e: WechatMiniprogram.CustomEvent) {
      const id = (e.detail as { id: string }).id;
      const ok = await confirmAction('删除这个收藏？');
      if (!ok) {
        return;
      }
      await remove(id);
      showToast('已删除', 'success');
      this.load();
    },
    toViewFavorite(item: FavoriteItem): ViewFavorite {
      return {
        ...item,
        label: typeLabel(item.type),
        time: formatDateTime(item.createdAt),
      };
    },
  },
});
