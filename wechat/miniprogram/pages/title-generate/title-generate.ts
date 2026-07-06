import { toggle } from '../../services/favorites';
import { titles } from '../../services/generate';
import { getStorage, removeStorage } from '../../utils/storage';
import { copyText, showToast } from '../../utils/ui';

Component({
  data: {
    topic: '',
    audience: '',
    contentTypes: ['种草推荐', '避坑经验', '干货教程', '探店打卡', '好物测评', '合集推荐', '对比测评', '新手必看'],
    styles: ['真实分享', '轻松口语', '干货实用', '情绪共鸣', '强吸引力', '数字清单'],
    counts: [5, 10, 15, 20],
    contentTypeIndex: 0,
    styleIndex: 0,
    countIndex: 1,
    generatedTitles: [] as string[],
    recordId: '',
    loading: false,
  },
  pageLifetimes: {
    show() {
      const seed = getStorage<string>('hshu_title_seed', '');
      if (seed) {
        this.setData({ topic: seed });
        removeStorage('hshu_title_seed');
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
    onTopicInput(e: WechatMiniprogram.Input) {
      this.setData({ topic: e.detail.value });
    },
    onAudienceInput(e: WechatMiniprogram.Input) {
      this.setData({ audience: e.detail.value });
    },
    onContentTypeChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ contentTypeIndex: Number(e.detail.value) });
    },
    onStyleChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ styleIndex: Number(e.detail.value) });
    },
    onCountChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ countIndex: Number(e.detail.value) });
    },
    async generate() {
      const topic = this.data.topic.trim();
      if (!topic) {
        showToast('请输入要生成标题的主题');
        return;
      }

      this.setData({ loading: true });
      try {
        const result = await titles({
          topic,
          audience: this.data.audience.trim(),
          contentType: this.data.contentTypes[this.data.contentTypeIndex],
          style: this.data.styles[this.data.styleIndex],
          count: this.data.counts[this.data.countIndex],
        });
        this.setData({
          generatedTitles: result.titles,
          recordId: result.recordId,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成失败，请稍后重试';
        showToast(message);
      } finally {
        this.setData({ loading: false });
      }
    },
    copy(e: WechatMiniprogram.TouchEvent) {
      copyText(e.currentTarget.dataset.title as string, '标题已复制');
    },
    async favorite(e: WechatMiniprogram.TouchEvent) {
      const title = e.currentTarget.dataset.title as string;
      const status = await toggle({
        type: 'title',
        refId: `${this.data.recordId}_${title}`,
        title,
        summary: this.data.topic,
        payload: title,
      });
      showToast(status.favorited ? '已收藏' : '已取消收藏', 'success');
    },
    similar(e: WechatMiniprogram.TouchEvent) {
      const title = e.currentTarget.dataset.title as string;
      this.setData({ topic: title });
      this.generate();
    },
  },
});
