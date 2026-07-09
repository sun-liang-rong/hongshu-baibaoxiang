import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  extractAwemeId,
  extractDouyinDetail,
  extractDouyinDetailFromHtml,
  extractDouyinUrl,
  extractVideoFromXgContainer,
  normalizeDouyinVideoUrl,
} from './douyin-parser.utils';
import { DouyinDetail, DouyinParseResult } from './douyin-parser.types';

@Injectable()
export class DouyinParserIntegrationService {
  private readonly mobileUserAgent =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 aweme_32.5.0';

  constructor(private readonly configService: ConfigService) {}

  async parse(input: string): Promise<DouyinParseResult> {
    const sourceUrl = extractDouyinUrl(input);
    const redirectedUrl = await this.resolveRedirect(sourceUrl);
    const awemeId = extractAwemeId(redirectedUrl);
    const finalUrl = normalizeDouyinVideoUrl(redirectedUrl, awemeId);
    const detail = await this.fetchDetail(awemeId).catch(() =>
      this.fetchDetailFromPage(finalUrl, awemeId).catch(() =>
        this.fetchDetailFromRenderedPage(finalUrl, awemeId),
      ),
    );
    const resolvedVideoUrl = await this.resolveVideoUrl(detail.videoUrl);

    return {
      sourceUrl,
      finalUrl,
      ...detail,
      videoUrl: resolvedVideoUrl || detail.videoUrl,
    };
  }

  private async resolveRedirect(url: string, depth = 0) {
    if (depth > 5) {
      throw new Error('抖音短链跳转次数过多');
    }

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      return location
        ? this.resolveRedirect(new URL(location, url).toString(), depth + 1)
        : url;
    }

    if (!response.ok) {
      throw new Error(`抖音短链跳转失败：HTTP ${response.status}`);
    }

    return response.url || url;
  }

  private async fetchDetail(awemeId: string) {
    const url = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${awemeId}`;
    const response = await fetch(url, {
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`抖音详情接口请求失败：HTTP ${response.status}`);
    }

    return extractDouyinDetail(await response.json());
  }

  private async fetchDetailFromPage(url: string, awemeId: string) {
    const response = await fetch(url, {
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`抖音页面请求失败：HTTP ${response.status}`);
    }

    const html = await response.text();
    return this.mergePageVideoDetail(
      awemeId,
      extractDouyinDetailFromHtml(html, awemeId),
      html,
    );
  }

  private async fetchDetailFromRenderedPage(
    url: string,
    awemeId: string,
  ): Promise<DouyinDetail> {
    if (this.isRenderBrowserDisabled()) {
      throw new Error('抖音页面渲染解析已关闭，请配置渲染浏览器或更换链接');
    }

    const playwright = await import('playwright-core');
    const executablePath = this.getChromeExecutablePath();
    const browser = await playwright.chromium
      .launch({
        ...(executablePath ? { executablePath } : {}),
        headless: true,
        args: ['--disable-blink-features=AutomationControlled'],
      })
      .catch((error: unknown) => {
        throw new Error(
          `抖音渲染浏览器启动失败：${this.toErrorMessage(error)}。请配置 DOUYIN_RENDER_BROWSER_EXECUTABLE_PATH 或安装 Playwright Chromium。`,
        );
      });

    try {
      const page = await browser.newPage({
        userAgent: this.buildHeaders()['user-agent'],
        locale: 'zh-CN',
        isMobile: true,
        hasTouch: true,
        viewport: {
          width: 390,
          height: 844,
        },
        deviceScaleFactor: 3,
      });
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.getRenderNavigationTimeoutMs(),
      });
      await page.waitForTimeout(this.getRenderSettleTimeoutMs());

      const data = await page.evaluate(() => {
        const video =
          document.querySelector<HTMLVideoElement>(
            '.xg-video-container video, xg-video-container video',
          ) || document.querySelector<HTMLVideoElement>('video');
        const title =
          document.querySelector('title')?.textContent?.trim() || '';

        return {
          title,
          content: title,
          videoUrl: video?.currentSrc || video?.src || '',
          coverUrl: video?.poster || '',
        };
      });

      if (!data.videoUrl) {
        throw new Error('抖音页面未下发视频地址，请稍后重试或更换链接');
      }

      return {
        noteId: awemeId,
        title: data.title,
        content: data.content,
        type: 'video',
        images: [],
        coverUrl: data.coverUrl,
        videoUrl: data.videoUrl,
        musicUrl: '',
      };
    } finally {
      await browser.close();
    }
  }

  private mergePageVideoDetail(
    awemeId: string,
    detail: DouyinDetail,
    html: string,
  ): DouyinDetail {
    try {
      const video = extractVideoFromXgContainer(html);
      return {
        ...detail,
        noteId: detail.noteId || awemeId,
        videoUrl: video.videoUrl || detail.videoUrl,
        coverUrl: video.coverUrl || detail.coverUrl,
      };
    } catch {
      return detail;
    }
  }

  private getChromeExecutablePath() {
    return (
      this.configService.get<string>('douyin.renderBrowserExecutablePath') ||
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      ''
    );
  }

  private isRenderBrowserDisabled() {
    return this.configService.get<boolean>(
      'douyin.renderBrowserDisabled',
      false,
    );
  }

  private getRenderNavigationTimeoutMs() {
    return this.configService.get<number>(
      'douyin.renderNavigationTimeoutMs',
      30000,
    );
  }

  private getRenderSettleTimeoutMs() {
    return this.configService.get<number>('douyin.renderSettleTimeoutMs', 8000);
  }

  private async resolveVideoUrl(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      return new URL(response.headers.get('location') || '', url).toString();
    }

    return url;
  }

  private buildHeaders() {
    return {
      'user-agent': this.mobileUserAgent,
      accept:
        'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'zh-CN,zh-Hans;q=0.9,en;q=0.8',
      referer: 'https://www.douyin.com/',
    };
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
