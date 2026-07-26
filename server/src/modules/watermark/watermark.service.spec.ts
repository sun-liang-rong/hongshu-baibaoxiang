import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { WatermarkParserIntegrationService } from '../../integrations/watermark-parser/watermark-parser-integration.service';
import { WatermarkService } from './watermark.service';

type WatermarkParserMock = Pick<WatermarkParserIntegrationService, 'parse'> & {
  parse: jest.Mock;
};

function createService(watermarkParser: WatermarkParserMock) {
  return new WatermarkService(
    watermarkParser as unknown as WatermarkParserIntegrationService,
  );
}

describe('WatermarkService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the complete remote response and appends quota', async () => {
    const remoteResponse = {
      success: true as const,
      data: {
        platform: 'bilibili',
        type: 'video',
        id: 'BV1KHgk6sEW3',
        title: '中正评测',
        description: '完整视频描述',
        author: {
          id: '178047796',
          nickname: '中正评测',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        cover_url: 'https://example.com/cover.jpg',
        video: {
          url: 'https://example.com/main.mp4',
          download_url: '/api/v1/download?token=demo',
          duration_ms: 799209,
          width: 1920,
          height: 1080,
        },
        parts: [
          {
            page: 1,
            cid: '40195982581',
            title: '中正评测',
            video: {
              url: 'https://example.com/part-1.mp4',
              download_url: '/api/v1/download?token=part',
              duration_ms: 799209,
              width: 1920,
              height: 1080,
            },
          },
        ],
        images: [],
        music: null,
        statistics: {
          likes: 1979,
          comments: 316,
          shares: 135,
          favorites: 302,
        },
        published_at: '2026-07-22T12:20:52.000Z',
        original_url: 'https://www.bilibili.com/video/BV1KHgk6sEW3/',
        expires_at: '2026-07-25T13:36:44.452Z',
      },
      request_id: '093a823c-a1f5-4e6d-9526-0d42be49908f',
    };
    const watermarkParser = {
      parse: jest.fn().mockResolvedValue(remoteResponse),
    };
    const service = createService(watermarkParser);

    const result = await service.parse({ text: 'B站分享文本' });

    expect(watermarkParser.parse).toHaveBeenCalledWith('B站分享文本');
    expect(result).toEqual({
      ...remoteResponse,
      quota: {
        used: 0,
        limit: 1,
        remaining: 1,
      },
    });
  });

  it('preserves remote image and live photo fields without remapping', async () => {
    const watermarkParser = {
      parse: jest.fn().mockResolvedValue({
        success: true,
        data: {
          platform: 'xiaohongshu',
          id: 'note-1',
          type: 'image',
          images: [
            {
              url: 'https://example.com/1.jpeg',
              live_photo_video_url: 'https://example.com/1.mp4',
            },
          ],
        },
        request_id: 'request-1',
      }),
    };
    const service = createService(watermarkParser);

    const result = await service.parse({ text: '小红书分享文本' });

    expect(result.data.images).toEqual([
      {
        url: 'https://example.com/1.jpeg',
        live_photo_video_url: 'https://example.com/1.mp4',
      },
    ]);
    expect(result.request_id).toBe('request-1');
  });

  it('returns remote parser errors as bad requests', async () => {
    const watermarkParser = {
      parse: jest.fn().mockRejectedValue(new Error('未找到有效链接')),
    };
    const service = createService(watermarkParser);

    await expect(service.parse({ text: 'not-a-url' })).rejects.toThrow(
      new BadRequestException('未找到有效链接'),
    );
  });

  it('fails open when the database is unavailable during quota lookup', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const watermarkParser = { parse: jest.fn() };
    const prisma = {
      generateRecord: {
        count: jest.fn().mockRejectedValue(new Error('database unavailable')),
      },
    };
    const configService = {
      get: jest.fn().mockReturnValue(1),
    };
    const service = new WatermarkService(
      watermarkParser as unknown as WatermarkParserIntegrationService,
      prisma as unknown as PrismaService,
      configService as unknown as ConfigService,
    );

    await expect(service.getQuota('openid-1')).resolves.toEqual({
      used: 0,
      limit: 1,
      remaining: 1,
    });
  });
});
