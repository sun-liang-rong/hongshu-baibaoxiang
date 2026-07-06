import { Injectable } from '@nestjs/common';
import {
  assertXhsUrl,
  extractInitialState,
  extractNoteId,
  extractNoteUrl,
  normalizeXhsNoteUrl,
  parseNoteFromInitialState,
} from './xhs-parser.utils';
import { XhsFullParseResult } from './xhs-parser.types';

@Injectable()
export class XhsParserIntegrationService {
  async parse(input: string): Promise<XhsFullParseResult> {
    const sourceUrl = extractNoteUrl(input);
    assertXhsUrl(sourceUrl);

    const redirectedUrl = await this.resolveRedirect(sourceUrl);
    const finalUrl = normalizeXhsNoteUrl(redirectedUrl);
    assertXhsUrl(finalUrl);

    const html = await this.fetchHtml(finalUrl);
    const state = extractInitialState(html);
    const parsed = parseNoteFromInitialState(state);

    return {
      sourceUrl,
      finalUrl,
      noteId: extractNoteId(finalUrl),
      ...parsed,
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
      throw new Error(`链接访问失败：HTTP ${response.status}`);
    }

    return response.url || url;
  }

  private async fetchHtml(url: string) {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`页面请求失败：HTTP ${response.status}`);
    }

    return response.text();
  }

  private buildHeaders() {
    return {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      referer: 'https://www.xiaohongshu.com/',
    };
  }
}
