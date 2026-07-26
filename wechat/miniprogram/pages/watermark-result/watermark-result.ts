import { check, toggle } from "../../services/favorites";
import {
  getWatermarkDescription,
  getWatermarkImageUrls,
  getWatermarkRefId,
  getWatermarkTitle,
  normalizeWatermarkResult,
} from "../../services/watermark";
import { WatermarkResult, WatermarkVideo } from "../../types/domain";
import { formatDateTime } from "../../utils/format";
import {
  buildSharePath,
  enableShareMenu,
  TOOLBOX_SHARE_TITLE,
} from "../../utils/share";
import { getStorage } from "../../utils/storage";
import { copyText, showToast } from "../../utils/ui";

interface ResultData {
  result: WatermarkResult | null;
  imageUrls: string[];
  activeVideo: WatermarkVideo | null;
  activePartIndex: number;
  platformLabel: string;
  platformInitial: string;
  creatorName: string;
  creatorAvatarUrl: string;
  publishedAtText: string;
  videoMeta: string;
  favorited: boolean;
  savingAll: boolean;
  savedCount: number;
  savePanelVisible: boolean;
  saveCompleted: number;
  saveTotal: number;
  savePercent: number;
  saveHasFailures: boolean;
  failedImages: Array<{ index: number; url: string }>;
  retryingIndex: number;
}

Component({
  data: {
    result: null,
    imageUrls: [],
    activeVideo: null,
    activePartIndex: -1,
    platformLabel: "",
    platformInitial: "",
    creatorName: "",
    creatorAvatarUrl: "",
    publishedAtText: "",
    videoMeta: "",
    favorited: false,
    savingAll: false,
    savedCount: 0,
    savePanelVisible: false,
    saveCompleted: 0,
    saveTotal: 0,
    savePercent: 0,
    saveHasFailures: false,
    failedImages: [],
    retryingIndex: -1,
  } as ResultData,
  lifetimes: {
    attached() {
      enableShareMenu(false);
      const stored = getStorage<unknown>("hshu_latest_watermark", null);
      if (!stored) {
        return;
      }

      const result = normalizeWatermarkResult(stored);
      const firstPartIndex = result.data.parts.findIndex((part) => part.video);
      const activePartIndex = result.data.video ? -1 : firstPartIndex;
      const activeVideo =
        result.data.video ||
        (firstPartIndex >= 0 ? result.data.parts[firstPartIndex].video : null);
      const platformLabel = getPlatformLabel(result.data.platform);

      this.setData({
        result,
        imageUrls: getWatermarkImageUrls(result),
        activeVideo,
        activePartIndex,
        platformLabel,
        platformInitial: platformLabel.slice(0, 1),
        creatorName:
          result.data.author?.nickname || result.data.title || "未知作者",
        creatorAvatarUrl: result.data.author?.avatar_url || "",
        publishedAtText: result.data.published_at
          ? formatDateTime(result.data.published_at)
          : "",
        videoMeta: formatVideoMeta(activeVideo),
        favorited: false,
      });

      Promise.resolve(check("watermark", getWatermarkRefId(result))).then(
        (favorited) => this.setData({ favorited }),
        () => this.setData({ favorited: false }),
      );
    },
  },
  methods: {
    onShareAppMessage() {
      return {
        title: TOOLBOX_SHARE_TITLE,
        path: buildSharePath("/pages/watermark/watermark", {
          from: "result_share",
        }),
      };
    },
    selectPart(e: WechatMiniprogram.TouchEvent) {
      const result = this.data.result;
      const index = Number(e.currentTarget.dataset.index);
      if (!result) {
        return;
      }

      const video =
        index < 0 ? result.data.video : result.data.parts[index]?.video;
      if (!video) {
        return;
      }

      this.setData({
        activePartIndex: index,
        activeVideo: video,
        videoMeta: formatVideoMeta(video),
      });
    },
    copyContent() {
      if (this.data.result) {
        copyText(getWatermarkDescription(this.data.result), "文案已复制");
      }
    },
    copyOriginalUrl() {
      const url = this.data.result?.data.original_url || "";
      if (!url) {
        showToast("暂无原始链接");
        return;
      }
      copyText(url, "原始链接已复制");
    },
    previewImage(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      if (!url || this.data.imageUrls.length === 0) {
        return;
      }
      wx.previewImage({ current: url, urls: this.data.imageUrls });
    },
    async saveImage(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      wx.showLoading({ title: "保存中", mask: true });
      try {
        await this.saveImageToAlbum(url);
        showToast("图片已保存", "success");
      } catch (error) {
        this.handleSaveError(error, "图片保存失败");
      } finally {
        wx.hideLoading();
      }
    },
    async saveAllImages() {
      const images = this.data.imageUrls;
      if (!images.length || this.data.savingAll) {
        return;
      }

      this.setData({
        savingAll: true,
        savedCount: 0,
        savePanelVisible: true,
        saveCompleted: 0,
        saveTotal: images.length,
        savePercent: 0,
        saveHasFailures: false,
        failedImages: [],
      });
      let savedCount = 0;
      const failedImages: Array<{ index: number; url: string }> = [];
      let permissionError: unknown;

      for (let index = 0; index < images.length; index += 1) {
        try {
          await this.saveImageToAlbum(images[index]);
          savedCount += 1;
        } catch (error) {
          failedImages.push({ index, url: images[index] });
          if (this.isPermissionError(error)) {
            permissionError = error;
            for (let rest = index + 1; rest < images.length; rest += 1) {
              failedImages.push({ index: rest, url: images[rest] });
            }
            this.setData({
              saveCompleted: images.length,
              savePercent: 100,
              saveHasFailures: true,
              failedImages,
            });
            break;
          }
        }

        const completed = index + 1;
        this.setData({
          savedCount,
          saveCompleted: completed,
          savePercent: Math.round((completed / images.length) * 100),
          saveHasFailures: failedImages.length > 0,
          failedImages: [...failedImages],
        });
      }

      this.setData({
        savingAll: false,
        savedCount,
        saveHasFailures: failedImages.length > 0,
        failedImages,
      });

      if (permissionError) {
        this.handleSaveError(permissionError, "保存失败");
      } else if (savedCount === images.length) {
        showToast(`已保存 ${savedCount} 张`, "success");
      } else if (savedCount > 0) {
        showToast(`已保存 ${savedCount}/${images.length} 张`);
      } else {
        showToast("图片保存失败，请稍后重试");
      }
    },
    async retryFailedImage(e: WechatMiniprogram.TouchEvent) {
      const index = Number(e.currentTarget.dataset.index);
      const url = e.currentTarget.dataset.url as string;
      if (!url || this.data.retryingIndex >= 0) {
        return;
      }

      this.setData({ retryingIndex: index });
      try {
        await this.saveImageToAlbum(url);
        const failedImages = this.data.failedImages.filter(
          (item) => item.index !== index,
        );
        this.setData({
          failedImages,
          savedCount: this.data.savedCount + 1,
          saveHasFailures: failedImages.length > 0,
        });
        showToast(`第 ${index + 1} 张已保存`, "success");
      } catch (error) {
        this.handleSaveError(error, `第 ${index + 1} 张保存失败`);
      } finally {
        this.setData({ retryingIndex: -1 });
      }
    },
    closeSavePanel() {
      if (!this.data.savingAll) {
        this.setData({ savePanelVisible: false });
      }
    },
    async saveVideo() {
      const videoUrl = this.data.activeVideo?.url || "";
      if (!videoUrl) {
        showToast("暂无视频可保存");
        return;
      }

      wx.showLoading({ title: "保存中", mask: true });
      try {
        const download = await this.downloadFile(videoUrl);
        await new Promise<void>((resolve, reject) => {
          wx.saveVideoToPhotosAlbum({
            filePath: download.tempFilePath,
            success: () => resolve(),
            fail: reject,
          });
        });
        showToast("视频已保存", "success");
      } catch (error) {
        this.handleSaveError(error, "视频保存失败");
      } finally {
        wx.hideLoading();
      }
    },
    async toggleFavorite() {
      const result = this.data.result;
      if (!result) {
        return;
      }

      const status = await toggle({
        type: "watermark",
        refId: getWatermarkRefId(result),
        title: getWatermarkTitle(result),
        summary: getWatermarkDescription(result),
        payload: result,
      });
      this.setData({ favorited: status.favorited });
      showToast(status.favorited ? "已收藏" : "已取消收藏", "success");
    },
    async saveImageToAlbum(url: string) {
      const download = await this.downloadFile(url);
      await new Promise<void>((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: download.tempFilePath,
          success: () => resolve(),
          fail: reject,
        });
      });
    },
    downloadFile(url: string) {
      return new Promise<WechatMiniprogram.DownloadFileSuccessCallbackResult>(
        (resolve, reject) => {
          wx.downloadFile({
            url,
            timeout: 30000,
            success: (result) => {
              if (result.statusCode >= 200 && result.statusCode < 300) {
                resolve(result);
                return;
              }
              reject(new Error(`下载失败：${result.statusCode}`));
            },
            fail: reject,
          });
        },
      );
    },
    handleSaveError(error: unknown, fallback: string) {
      if (this.isPermissionError(error)) {
        wx.showModal({
          title: "需要相册权限",
          content: "请在设置中允许保存到相册，然后重新尝试。",
          confirmText: "去设置",
          confirmColor: "#ff2442",
          success: (result) => {
            if (result.confirm) {
              wx.openSetting();
            }
          },
        });
        return;
      }
      showToast(fallback);
    },
    isPermissionError(error: unknown) {
      const message =
        error && typeof error === "object" && "errMsg" in error
          ? String((error as { errMsg?: string }).errMsg)
          : error instanceof Error
            ? error.message
            : "";
      return /auth|authorize|permission|deny/i.test(message);
    },
  },
});

const PLATFORM_LABELS: Record<string, string> = {
  bilibili: "哔哩哔哩",
  douyin: "抖音",
  ks: "快手",
  kuaishou: "快手",
  kwai: "快手",
  xhs: "小红书",
  xiaohongshu: "小红书",
  jimeng: "即梦",
};

const getPlatformLabel = (platform: string) =>
  PLATFORM_LABELS[platform.toLowerCase()] || platform || "未知平台";

const formatVideoMeta = (video: WatermarkVideo | null) => {
  if (!video) {
    return "";
  }

  const values: string[] = [];
  if (video.duration_ms > 0) {
    const totalSeconds = Math.round(video.duration_ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    values.push(`${minutes}:${seconds}`);
  }
  if (video.width > 0 && video.height > 0) {
    values.push(`${video.width} × ${video.height}`);
  }
  return values.join(" · ");
};
