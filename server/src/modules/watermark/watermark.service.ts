import { BadRequestException, Injectable } from '@nestjs/common';
import { ParseWatermarkDto } from './dto/parse-watermark.dto';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';
import { WatermarkParseResponse } from './watermark.types';

@Injectable()
export class WatermarkService {
  constructor(private readonly platformResolver: WatermarkPlatformResolver) {}

  async parse(dto: ParseWatermarkDto): Promise<WatermarkParseResponse> {
    const source = this.platformResolver.resolve(dto.source, dto.text);

    try {
      const parser = this.platformResolver.getParser(source);
      const parsed = await parser.parse(dto.text);
      const id = this.buildId(source, parsed.noteId, parsed.finalUrl);

      return {
        id,
        source,
        sourceUrl: parsed.sourceUrl,
        finalUrl: parsed.finalUrl,
        noteId: parsed.noteId,
        title: parsed.title,
        content: parsed.content,
        type: this.normalizeType(parsed.type, parsed.videoUrl),
        images: parsed.images,
        coverUrl: this.getOptionalString(parsed, 'coverUrl'),
        videoUrl: parsed.videoUrl,
        musicUrl: this.getOptionalString(parsed, 'musicUrl'),
        status: 'success',
        createdAt: new Date().toISOString(),
      };
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

  private normalizeType(type: string, videoUrl: string) {
    return type === 'video' || videoUrl ? 'video' : 'image';
  }

  private buildId(source: string, noteId: string, finalUrl: string) {
    if (noteId) {
      return `${source}_${noteId}`;
    }

    return `${source}_${Buffer.from(finalUrl).toString('base64url').slice(0, 16)}`;
  }
}
