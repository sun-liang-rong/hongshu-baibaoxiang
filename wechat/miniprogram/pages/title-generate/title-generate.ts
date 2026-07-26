import { check, toggle } from '../../services/favorites';
import { getGenerateQuota, titles } from '../../services/generate';
import { GenerateQuota } from '../../types/domain';
import { getStorage, removeStorage } from '../../utils/storage';
import {
  buildCreatorShareTitle,
  buildSharePath,
  buildShareQuery,
  decodeShareParam,
  enableShareMenu,
} from '../../utils/share';
import { syncTabBar } from '../../utils/tabbar';
import { copyText, showToast } from '../../utils/ui';

interface TitleViewItem {
  text: string;
  refId: string;
  favorited: boolean;
}

Component({
  data: {
    topic: '',
    audience: '',
    contentTypes: ['种草推荐', '避坑经验', '干货教程', '探店打卡', '好物测评', '合集推荐', '对比测评', '新手必看'],
    styles: ['真实分享', '轻松口语', '干货实用', '情绪共鸣', '强吸引力', '数字清单'],
    counts: [1, 2, 3],
    contentTypeIndex: 0,
    styleIndex: 0,
    countIndex: 1,
    generatedTitles: [] as TitleViewItem[],
    recordId: '',
    loading: false,
    quota: {
      used: 0,
      limit: 1,
      remaining: 1,
    } as GenerateQuota,
    quotaReady: false,
    advancedOpen: false,
    scrollIntoView: '',
    requestError: '',
  },
  pageLifetimes: {
    show() {
      syncTabBar(this, 1);
      enableShareMenu();
      this.loadQuota();
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
        this.setData({ topic: decodeShareParam(options.topic) });
      }
    },
  },
  methods: {
    onShareAppMessage() {
      const topic = this.data.topic.trim();
      return {
        title: buildCreatorShareTitle(topic, '标题'),
        path: buildSharePath('/pages/title-generate/title-generate', {
          topic,
          from: 'share',
        }),
      };
    },
    onShareTimeline() {
      const topic = this.data.topic.trim();
      return {
        title: buildCreatorShareTitle(topic, '标题'),
        query: buildShareQuery({ topic, from: 'timeline' }),
      };
    },
    async loadQuota() {
      try {
        const quota = await getGenerateQuota();
        this.setData({ quota: quota.title, quotaReady: true });
      } catch {
        this.setData({ quotaReady: false });
      }
    },
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
    selectCount(e: WechatMiniprogram.TouchEvent) {
      this.setData({ countIndex: Number(e.currentTarget.dataset.index) });
    },
    toggleAdvanced() {
      this.setData({ advancedOpen: !this.data.advancedOpen });
    },
    async generate() {
      if (this.data.loading) {
        return;
      }

      if (this.data.quotaReady && this.data.quota.remaining <= 0) {
        showToast('今日标题生成次数已用完，明天再来试试');
        return;
      }

      const topic = this.data.topic.trim();
      if (!topic) {
        showToast('请输入要生成标题的主题');
        return;
      }

      this.setData({ loading: true, requestError: '' });
      try {
        const result = await titles({
          topic,
          audience: this.data.audience.trim(),
          contentType: this.data.contentTypes[this.data.contentTypeIndex],
          style: this.data.styles[this.data.styleIndex],
          count: this.data.counts[this.data.countIndex],
        });
        const generatedTitles = result.titles.map((title) => ({
          text: title,
          refId: this.createTitleRefId(result.recordId, title),
          favorited: false,
        }));
        this.setData(
          {
            generatedTitles,
            recordId: result.recordId,
            ...(result.quota
              ? { quota: result.quota, quotaReady: true }
              : {}),
            scrollIntoView: '',
          },
          () => this.revealResult(),
        );
        if (!result.quota) {
          this.loadQuota();
        }
        this.syncFavoriteStatus();
      } catch (error) {
        const message = error instanceof Error ? error.message : '生成失败，请稍后重试';
        this.setData({
          requestError: this.isRetryableError(message) ? message : '',
        });
        showToast(message);
      } finally {
        this.setData({ loading: false });
      }
    },
    copy(e: WechatMiniprogram.TouchEvent) {
      copyText(e.currentTarget.dataset.title as string, '标题已复制');
    },
    retryRequest() {
      this.generate();
    },
    isRetryableError(message: string) {
      return /网络|超时|请求失败|暂不可用|稍后重试/.test(message);
    },
    copyAll() {
      const titles = this.data.generatedTitles.map(
        (item, index) => `${index + 1}. ${item.text}`,
      );
      copyText(titles.join('\n'), '全部标题已复制');
    },
    async favorite(e: WechatMiniprogram.TouchEvent) {
      const refId = e.currentTarget.dataset.refId as string;
      const item = this.data.generatedTitles.find((entry) => entry.refId === refId);
      if (!item) {
        return;
      }

      const status = await toggle({
        type: 'title',
        refId: item.refId,
        title: item.text,
        summary: this.data.topic,
        payload: item.text,
      });
      this.setData({
        generatedTitles: this.data.generatedTitles.map((entry) =>
          entry.refId === item.refId ? { ...entry, favorited: status.favorited } : entry,
        ),
      });
      showToast(status.favorited ? '已收藏' : '已取消收藏', 'success');
    },
    async syncFavoriteStatus() {
      const generatedTitles = await Promise.all(
        this.data.generatedTitles.map(async (item) => ({
          ...item,
          favorited: await check('title', item.refId),
        })),
      );
      this.setData({ generatedTitles });
    },
    createTitleRefId(recordId: string, title: string) {
      return `${recordId}_${title}`;
    },
    revealResult() {
      wx.nextTick(() => {
        this.setData({ scrollIntoView: 'title-result' });
      });
    },
  },
});
