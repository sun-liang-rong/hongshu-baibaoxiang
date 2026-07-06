import { Injectable } from '@nestjs/common';
import {
  extractAwemeId,
  extractDouyinDetail,
  extractDouyinUrl,
} from './douyin-parser.utils';
import { DouyinParseResult } from './douyin-parser.types';

@Injectable()
export class DouyinParserIntegrationService {
  async parse(input: string): Promise<DouyinParseResult> {
    const sourceUrl = extractDouyinUrl(input);
    const finalUrl = await this.resolveRedirect(sourceUrl);
    const awemeId = extractAwemeId(finalUrl);
    const detail = await this.fetchDetail(awemeId);
    const resolvedVideoUrl = await this.resolveVideoUrl(detail.videoUrl);

    return {
      sourceUrl,
      finalUrl,
      ...detail,
      videoUrl: resolvedVideoUrl || detail.videoUrl,
    };
  }

  private async resolveRedirect(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      return new URL(response.headers.get('location') || '', url).toString();
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
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      accept: 'application/json,text/html,application/xhtml+xml,*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      referer: 'https://www.douyin.com/',
    };
  }
}
