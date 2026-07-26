import { getQuota, parse } from "../../services/watermark";
import { GenerateQuota } from "../../types/domain";
import { setStorage } from "../../utils/storage";
import {
  buildSharePath,
  enableShareMenu,
  TOOLBOX_SHARE_TITLE,
} from "../../utils/share";
import { syncTabBar } from "../../utils/tabbar";
import { showToast } from "../../utils/ui";
import {
  isValidSupportedLinkText,
  normalizeInput,
} from "../../utils/validator";

Component({
  data: {
    text: "",
    loading: false,
    quota: {
      used: 0,
      limit: 1,
      remaining: 1,
    } as GenerateQuota,
    quotaReady: false,
    requestError: '',
  },
  pageLifetimes: {
    show() {
      syncTabBar(this, 0);
      enableShareMenu();
      this.loadQuota();
    },
  },
  methods: {
    onShareAppMessage() {
      return {
        title: TOOLBOX_SHARE_TITLE,
        path: buildSharePath("/pages/watermark/watermark", {
          from: "share",
        }),
      };
    },
    onShareTimeline() {
      return {
        title: TOOLBOX_SHARE_TITLE,
        query: "from=timeline",
      };
    },
    async loadQuota() {
      try {
        const quota = await getQuota();
        this.setData({ quota, quotaReady: true });
      } catch {
        this.setData({ quotaReady: false });
      }
    },
    onInput(e: WechatMiniprogram.Input) {
      this.setData({ text: e.detail.value });
    },
    primaryAction() {
      if (this.data.text.trim()) {
        this.submit();
        return;
      }

      wx.getClipboardData({
        success: (res) => {
          this.setData({ text: res.data }, () => this.submit());
        },
        fail: () => showToast("没有读取到链接，请长按输入框粘贴"),
      });
    },
    goDisclaimer() {
      wx.navigateTo({ url: "/pages/disclaimer/disclaimer" });
    },
    async submit() {
      if (this.data.loading) {
        return;
      }

      const text = normalizeInput(this.data.text);

      if (this.data.quotaReady && this.data.quota.remaining <= 0) {
        showToast("今日解析次数已用完，明天再来试试");
        return;
      }

      if (!text) {
        showToast("请先粘贴作品链接");
        return;
      }

      if (text.length > 1200) {
        showToast("内容过长，请复制完整分享链接");
        return;
      }

      if (!isValidSupportedLinkText(text)) {
        showToast("未识别到链接，请复制完整分享内容");
        return;
      }

      this.setData({ loading: true, requestError: '' });
      wx.showLoading({ title: "解析中", mask: true });

      try {
        const result = await parse({ text });
        if (result.quota) {
          this.setData({ quota: result.quota, quotaReady: true });
        } else {
          this.loadQuota();
        }
        setStorage("hshu_latest_watermark", result);
        wx.navigateTo({ url: "/pages/watermark-result/watermark-result" });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "解析失败，请稍后重试或更换链接";
        this.setData({
          requestError: this.isRetryableError(message) ? message : "",
        });
        showToast(message);
      } finally {
        wx.hideLoading();
        this.setData({ loading: false });
      }
    },
    retryRequest() {
      this.submit();
    },
    isRetryableError(message: string) {
      return /网络|超时|请求失败|暂不可用|稍后重试/.test(message);
    },
  },
});
