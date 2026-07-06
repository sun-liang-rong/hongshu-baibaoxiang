import { toggle } from '../../services/favorites';
import { copywriting } from '../../services/generate';
import { CopywritingResult } from '../../types/domain';
import { getStorage, removeStorage } from '../../utils/storage';
import { copyText, showToast } from '../../utils/ui';

Component({
  data: {
    topic: '',
    productName: '',
    sellingPoints: '',
    audience: '',
    styles: ['真实分享', '种草推荐', '干货教程', '避坑提醒', '探店打卡', '好物合集', '软广种草'],
    lengths: ['短文案', '中等文案', '长文案'],
    lengthValues: ['short', 'medium', 'long'],
    styleIndex: 0,
    lengthIndex: 1,
    includeTags: true,
    result: null as CopywritingResult | null,
    loading: false,
  },
  pageLifetimes: {
    show() {
      const seed = getStorage<string>('hshu_copy_seed', '');
      if (seed) {
        this.setData({ topic: seed });
        removeStorage('hshu_copy_seed');
      }
    },
  },
  lifetimes: {
    attached() {
      const pages = getCurrentPages();
      const current = pages[pages.length - 1];
      const options = ((current && current.options) || {}) as { topic?: string };
      if (options.topic) {
        this.setData({ topic: decodeURIComponent(options.topic) });
      }
    },
  },
  methods: {
    onInput(e: WechatMiniprogram.Input) {
      const field = e.currentTarget.dataset.field as string;
      this.setData({ [field]: e.detail.value });
    },
    onStyleChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ styleIndex: Number(e.detail.value) });
    },
    onLengthChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ lengthIndex: Number(e.detail.value) });
    },
    onIncludeTagsChange(e: WechatMiniprogram.SwitchChange) {
      this.setData({ includeTags: e.detail.value });
    },
    async generate() {
      const topic = this.data.topic.trim();
      if (!topic) {
        showToast('请输入要生成文案的主题');
        return;
      }

      this.setData({ loading: true });
      try {
        const result = await copywriting({
          topic,
          productName: this.data.productName.trim(),
          sellingPoints: this.data.sellingPoints.trim(),
          audience: this.data.audience.trim(),
          style: this.data.styles[this.data.styleIndex],
          length: this.data.lengthValues[this.data.lengthIndex] as 'short' | 'medium' | 'long',
          includeTags: this.data.includeTags,
        });
        this.setData({ result });
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成失败，请稍后重试';
        showToast(message);
      } finally {
        this.setData({ loading: false });
      }
    },
    copyAll() {
      const result = this.data.result;
      if (!result) {
        return;
      }
      const tags = result.tags.map((tag) => `#${tag}`).join(' ');
      copyText(`${result.title}\n\n${result.body}\n\n${tags}`, '文案已复制');
    },
    async favorite() {
      const result = this.data.result;
      if (!result) {
        return;
      }
      const status = await toggle({
        type: 'copywriting',
        refId: result.recordId,
        title: result.title,
        summary: result.body.slice(0, 80),
        payload: result,
      });
      showToast(status.favorited ? '已收藏' : '已取消收藏', 'success');
    },
  },
});
