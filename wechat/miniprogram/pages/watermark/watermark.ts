import { parse } from "../../services/watermark";
import { setStorage } from "../../utils/storage";
import { showToast } from "../../utils/ui";
import {
  isValidSupportedLinkText,
  normalizeInput,
} from "../../utils/validator";

Component({
  data: {
    text: "",
    loading: false,
  },
  methods: {
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
