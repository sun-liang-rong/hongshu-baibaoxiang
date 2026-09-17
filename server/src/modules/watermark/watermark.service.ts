import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateStatus, GenerateType } from '@prisma/client/index';
import { PrismaService } from '../../database/prisma.service';
import { WatermarkParserIntegrationService } from '../../integrations/watermark-parser/watermark-parser-integration.service';
import { HistoryService } from '../history/history.service';
import { ParseWatermarkDto } from './dto/parse-watermark.dto';
import { WatermarkParseResponse } from './watermark.types';

@Injectable()
export class WatermarkService {
  private readonly logger = new Logger(WatermarkService.name);

  constructor(
    private readonly watermarkParser: WatermarkParserIntegrationService,
    private readonly prisma?: PrismaService,
    private readonly configService?: ConfigService,
    private readonly historyService?: HistoryService,
  ) {}

  async getQuota(openid?: string) {
    const limit = this.getDailyLimit();
    if (!openid || !this.prisma) {
      return {
        used: 0,
        limit,
        remaining: limit,
      };
    }

    let used = 0;
    try {
      const [start, end] = this.getTodayRange();
      used = await this.prisma.generateRecord.count({
        where: {
          openid,
          type: GenerateType.watermark,
          status: GenerateStatus.success,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });
    } catch (error) {
      this.logger.warn(
        `去水印额度查询失败，临时按未使用处理：${this.toErrorMessage(error)}`,
      );
    }

    return {
      used,
      limit,
      remaining: Math.max(limit - used, 0),
    };
  }

  async parse(
    dto: ParseWatermarkDto,
    openid?: string,
  ): Promise<WatermarkParseResponse> {
    await this.assertQuotaAvailable(openid);

    try {
      const remoteResult = await this.watermarkParser.parse(dto.text);
      const result: WatermarkParseResponse = {
        ...remoteResult,
        data: this.rewriteDownloadUrls(remoteResult.data),
      };
      const source = result.data.platform || dto.source || 'unknown';

      const saved = await this.saveHistorySafely(
        openid,
        source,
        dto.text,
        result,
      );
      result.quota = await this.getQuota(saved ? openid : undefined);

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : '解析失败';
      throw new BadRequestException(message);
    }
  }

  /**
   * 上游返回的 download_url 可能是相对路径（如 /api/v1/download?token=xxx），
   * 小程序无法直接访问内网/端口服务，统一重写为本服务的下载代理绝对地址。
   * 上游路径携带的 /api/v1 前缀对应其全局路由前缀，与 publicBaseUrl 中的
   * /vw/api/v1 语义重复，需剥掉避免拼出 /api/v1/api/v1/。
   */
  private rewriteDownloadUrls<T extends WatermarkParseResponse['data']>(
    data: T,
  ): T {
    const toAbsolute = (downloadUrl?: string): string | undefined => {
      if (!downloadUrl) {
        return downloadUrl;
      }
      if (/^https?:\/\//i.test(downloadUrl)) {
        return downloadUrl;
      }
      const path = downloadUrl.startsWith('/') ? downloadUrl : `/${downloadUrl}`;
      const normalized = path.replace(/^\/api\/v1(?=\/)/, '');
      return `${this.publicBaseUrl}${normalized}`;
    };

    const next: T = { ...data };

    if (next.video?.download_url) {
      next.video = {
        ...next.video,
        download_url: toAbsolute(next.video.download_url)!,
      };
    }

    if (Array.isArray(next.parts)) {
      next.parts = next.parts.map((part) =>
        part?.video?.download_url
          ? {
              ...part,
              video: {
                ...part.video,
                download_url: toAbsolute(part.video.download_url)!,
              },
            }
          : part,
      );
    }

    if (Array.isArray(next.images)) {
      next.images = next.images.map((image) => {
        if (typeof image === 'string') {
          return image;
        }
        const raw = (image as { download_url?: unknown })?.download_url;
        return typeof raw === 'string' && raw
          ? {
              ...image,
              download_url: toAbsolute(raw),
            }
          : image;
      });
    }

    return next;
  }

  /** 小程序可访问的本服务对外基地址（需 HTTPS 域名）。 */
  private get publicBaseUrl(): string {
    return (
      this.configService?.get<string>('app.publicBaseUrl') ||
      'https://www.hongshu.sale/vw/api/v1'
    );
  }

  private async saveHistorySafely(
    openid: string | undefined,
    source: string,
    text: string,
    result: WatermarkParseResponse,
  ) {
    if (!openid || !this.historyService) {
      return false;
    }

    try {
      await this.historyService.save({
        openid,
        type: GenerateType.watermark,
        topic: result.data.title || result.data.id || source,
        input: {
          text,
          source,
        },
        output: result,
        title: result.data.title || '去水印解析结果',
        summary: (result.data.description || result.data.title || '').slice(
          0,
          120,
        ),
      });
      return true;
    } catch (error) {
      this.logger.warn(`去水印记录保存失败：${this.toErrorMessage(error)}`);
      return false;
    }
  }

  private async assertQuotaAvailable(openid?: string) {
    if (!openid || !this.prisma) {
      return;
    }

    const quota = await this.getQuota(openid);

    if (quota.remaining <= 0) {
      throw new ForbiddenException('今日去水印次数已用完，明天再来试试');
    }
  }

  private getDailyLimit() {
    return (
      this.configService?.get<number>('generate.watermarkDailyLimit', 1) ?? 1
    );
  }

  private getTodayRange() {
    const now = new Date();
    const chinaOffsetMs = 8 * 60 * 60 * 1000;
    const chinaNow = new Date(now.getTime() + chinaOffsetMs);
    const startUtcMs =
      Date.UTC(
        chinaNow.getUTCFullYear(),
        chinaNow.getUTCMonth(),
        chinaNow.getUTCDate(),
        0,
        0,
        0,
        0,
      ) - chinaOffsetMs;
    const start = new Date(startUtcMs);
    const end = new Date(startUtcMs + 24 * 60 * 60 * 1000);
    return [start, end] as const;
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
