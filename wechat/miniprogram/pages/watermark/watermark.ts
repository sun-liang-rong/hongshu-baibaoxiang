import { getQuota, parse } from "../../services/watermark";
import { GenerateQuota } from "../../types/domain";
import { setStorage } from "../../utils/storage";
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
      limit: 20,
      remaining: 20,
    } as GenerateQuota,
    quotaReady: false,
  },
  pageLifetimes: {
    show() {
      syncTabBar(this, 0);
      this.loadQuota();
    },
  },
  methods: {
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
    paste() {
      wx.getClipboardData({
        success: (res) => {
          this.setData({ text: res.data });
        },
      });
    },
    goDisclaimer() {
      wx.navigateTo({ url: "/pages/disclaimer/disclaimer" });
    },
    async submit() {
      const text = normalizeInput(this.data.text);

      if (this.data.quotaReady && this.data.quota.remaining <= 0) {
        showToast("今日解析次数已用完，明天再来试试");
        return;
      }

      if (!text) {
        showToast("请先粘贴红薯链接");
        return;
      }

      if (text.length > 1200) {
        showToast("内容过长，请复制完整分享链接");
        return;
      }

      if (!isValidSupportedLinkText(text)) {
        showToast("链接格式不正确，请复制完整分享链接");
        return;
      }

      this.setData({ loading: true });
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
        showToast(message);
      } finally {
        wx.hideLoading();
        this.setData({ loading: false });
      }
    },
  },
});
