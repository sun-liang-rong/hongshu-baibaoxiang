import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateStatus, GenerateType } from '@prisma/client/index';
import { PrismaService } from '../../database/prisma.service';
import { HistoryService } from '../history/history.service';
import { ParseWatermarkDto } from './dto/parse-watermark.dto';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';
import { WatermarkParseResponse } from './watermark.types';

@Injectable()
export class WatermarkService {
  constructor(
    private readonly platformResolver: WatermarkPlatformResolver,
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

    const [start, end] = this.getTodayRange();
    const used = await this.prisma.generateRecord.count({
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

    const source = this.platformResolver.resolve(dto.source, dto.text);

    try {
      const parser = this.platformResolver.getParser(source);
      const parsed = await parser.parse(dto.text);
      const id = this.buildId(source, parsed.noteId, parsed.finalUrl);
      const result: WatermarkParseResponse = {
        id,
        source,
        sourceUrl: parsed.sourceUrl,
        finalUrl: parsed.finalUrl,
        noteId: parsed.noteId,
        title: parsed.title,
        content: parsed.content,
        type: this.normalizeType(parsed.type, parsed.videoUrl),
        images: parsed.images.map((image) => ({ ...image })),
        coverUrl: this.getOptionalString(parsed, 'coverUrl'),
        videoUrl: parsed.videoUrl,
        musicUrl: this.getOptionalString(parsed, 'musicUrl'),
        status: 'success',
        createdAt: new Date().toISOString(),
      };

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

  private getOptionalString(input: unknown, key: string) {
    if (!input || typeof input !== 'object' || !(key in input)) {
      return '';
    }

    const value = (input as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }

  private normalizeType(
    type: string,
    videoUrl: string,
  ): WatermarkParseResponse['type'] {
    return type === 'video' || videoUrl ? 'video' : 'image';
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
        topic: result.title || result.noteId || source,
        input: {
          text,
          source,
        },
        output: result,
        title: result.title || '去水印解析结果',
        summary: result.content.slice(0, 120),
      });
      return true;
    } catch {
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
    return this.configService?.get<number>('generate.watermarkDailyLimit', 20) ?? 20;
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

  private buildId(source: string, noteId: string, finalUrl: string) {
    if (noteId) {
      return `${source}_${noteId}`;
    }

    return `${source}_${Buffer.from(finalUrl).toString('base64url').slice(0, 16)}`;
  }
}
