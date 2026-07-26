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
      const result: WatermarkParseResponse = { ...remoteResult };
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
