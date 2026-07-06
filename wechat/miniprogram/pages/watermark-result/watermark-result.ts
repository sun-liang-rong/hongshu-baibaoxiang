import { check, toggle } from '../../services/favorites';
import { WatermarkResult } from '../../types/domain';
import { getStorage, setStorage } from '../../utils/storage';
import { copyText, showToast } from '../../utils/ui';

interface ResultData {
  result: WatermarkResult | null;
  favorited: boolean;
}

Component({
  data: {
    result: null,
    favorited: false,
  } as ResultData,
  lifetimes: {
    attached() {
      const result = getStorage<WatermarkResult | null>('hshu_latest_watermark', null);
      this.setData({
        result,
        favorited: result ? check('watermark', result.id) : false,
      });
    },
  },
  methods: {
    copyContent() {
      if (!this.data.result) {
        return;
      }
      copyText(this.data.result.content, '文案已复制');
    },
    saveImage(e: WechatMiniprogram.TouchEvent) {
      const url = e.currentTarget.dataset.url as string;
      wx.showLoading({ title: '保存中', mask: true });
      wx.downloadFile({
        url,
        success: (download) => {
          wx.saveImageToPhotosAlbum({
            filePath: download.tempFilePath,
            success: () => showToast('图片已保存', 'success'),
            fail: () => showToast('保存失败，请检查相册权限'),
          });
        },
        fail: () => showToast('图片下载失败'),
        complete: () => wx.hideLoading(),
      });
    },
    saveVideo() {
      const result = this.data.result;
      if (!result || !result.videoUrl) {
        showToast('暂无视频可保存');
        return;
      }

      wx.showLoading({ title: '保存中', mask: true });
      wx.downloadFile({
        url: result.videoUrl,
        success: (download) => {
          wx.saveVideoToPhotosAlbum({
            filePath: download.tempFilePath,
            success: () => showToast('视频已保存', 'success'),
            fail: () => showToast('保存失败，请检查相册权限'),
          });
        },
        fail: () => showToast('视频下载失败'),
        complete: () => wx.hideLoading(),
      });
    },
    async toggleFavorite() {
      const result = this.data.result;
      if (!result) {
        return;
      }

      const status = await toggle({
        type: 'watermark',
        refId: result.id,
        title: result.title,
        summary: result.content,
        payload: result,
      });
      this.setData({ favorited: status.favorited });
      showToast(status.favorited ? '已收藏' : '已取消收藏', 'success');
    },
    generateTitle() {
      const result = this.data.result;
      if (!result) {
        return;
      }
      setStorage('hshu_title_seed', result.title);
      wx.switchTab({ url: '/pages/title-generate/title-generate' });
    },
    generateCopywriting() {
      const result = this.data.result;
      if (!result) {
        return;
      }
      setStorage('hshu_copy_seed', result.title);
      wx.switchTab({ url: '/pages/copywriting-generate/copywriting-generate' });
    },
  },
});
