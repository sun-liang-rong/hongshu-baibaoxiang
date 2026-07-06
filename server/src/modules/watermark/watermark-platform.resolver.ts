import { BadRequestException, Injectable } from '@nestjs/common';
import { DouyinParserIntegrationService } from '../../integrations/douyin-parser/douyin-parser-integration.service';
import { isDouyinUrl } from '../../integrations/douyin-parser/douyin-parser.utils';
import { XhsParserIntegrationService } from '../../integrations/xhs-parser/xhs-parser-integration.service';
import { extractNoteUrl } from '../../integrations/xhs-parser/xhs-parser.utils';

export type WatermarkSource = 'xhs' | 'douyin';

@Injectable()
export class WatermarkPlatformResolver {
  constructor(
    private readonly xhsParser: XhsParserIntegrationService,
    private readonly douyinParser: DouyinParserIntegrationService,
  ) {}

  resolve(source: WatermarkSource | undefined, text: string): WatermarkSource {
    if (source) {
      return source;
    }

    let url: string;
    try {
      url = extractNoteUrl(text);
    } catch {
      throw new BadRequestException('未找到有效链接');
    }

    if (isDouyinUrl(url)) {
      return 'douyin';
    }

    if (this.isXhsUrl(url)) {
      return 'xhs';
    }

    throw new BadRequestException('暂时只支持红薯和抖音链接');
  }

  getParser(source: WatermarkSource) {
    return source === 'douyin' ? this.douyinParser : this.xhsParser;
  }

  private isXhsUrl(url: string) {
    try {
      const hostname = new URL(url).hostname;
      return [
        'xhslink.com',
        'www.xhslink.com',
        'xiaohongshu.com',
        'www.xiaohongshu.com',
      ].includes(hostname);
    } catch {
      return false;
    }
  }
}
