import { check, toggle } from '../../services/favorites';
import { copywriting, getGenerateQuota } from '../../services/generate';
import { CopywritingResult, GenerateQuota } from '../../types/domain';
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
    favorited: false,
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
      syncTabBar(this, 2);
      enableShareMenu();
      this.loadQuota();
      const restoredResult = getStorage<CopywritingResult | null>('hshu_copy_result', null);
      if (restoredResult) {
        this.setData(
          {
            topic: restoredResult.title,
            result: restoredResult,
            favorited: false,
          },
          () => {
            removeStorage('hshu_copy_result');
            this.syncFavoriteStatus();
            this.revealResult();
          },
        );
        return;
      }

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
        this.setData({ topic: decodeShareParam(options.topic) });
      }
    },
  },
  methods: {
    onShareAppMessage() {
      const topic = this.data.topic.trim();
      return {
        title: buildCreatorShareTitle(topic, '文案'),
        path: buildSharePath('/pages/copywriting-generate/copywriting-generate', {
          topic,
          from: 'share',
        }),
      };
    },
    onShareTimeline() {
      const topic = this.data.topic.trim();
      return {
        title: buildCreatorShareTitle(topic, '文案'),
        query: buildShareQuery({ topic, from: 'timeline' }),
      };
    },
    async loadQuota() {
      try {
        const quota = await getGenerateQuota();
        this.setData({ quota: quota.copywriting, quotaReady: true });
      } catch {
        this.setData({ quotaReady: false });
      }
    },
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
    toggleAdvanced() {
      this.setData({ advancedOpen: !this.data.advancedOpen });
    },
    async generate() {
      if (this.data.loading) {
        return;
      }

      if (this.data.quotaReady && this.data.quota.remaining <= 0) {
        showToast('今日文案生成次数已用完，明天再来试试');
        return;
      }

      const topic = this.data.topic.trim();
      if (!topic) {
        showToast('请输入要生成文案的主题');
        return;
      }

      this.setData({ loading: true, requestError: '' });
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
        this.setData(
          {
            result,
            favorited: false,
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
    copyAll() {
      const result = this.data.result;
      if (!result) {
        return;
      }
      const tags = result.tags.map((tag) => `#${tag}`).join(' ');
      copyText(`${result.title}\n\n${result.body}\n\n${tags}`, '文案已复制');
    },
    retryRequest() {
      this.generate();
    },
    isRetryableError(message: string) {
      return /网络|超时|请求失败|暂不可用|稍后重试/.test(message);
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
      this.setData({ favorited: status.favorited });
      showToast(status.favorited ? '已收藏' : '已取消收藏', 'success');
    },
    async syncFavoriteStatus() {
      const result = this.data.result;
      if (!result) {
        this.setData({ favorited: false });
        return;
      }

      this.setData({
        favorited: await check('copywriting', result.recordId),
      });
    },
    revealResult() {
      wx.nextTick(() => {
        this.setData({ scrollIntoView: 'copy-result' });
      });
    },
  },
});
