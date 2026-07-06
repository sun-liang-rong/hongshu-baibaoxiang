import { BadRequestException } from '@nestjs/common';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';
import { WatermarkService } from './watermark.service';

type PlatformResolverMock = Pick<
  WatermarkPlatformResolver,
  'resolve' | 'getParser'
> & {
  resolve: jest.Mock;
  getParser: jest.Mock;
};

function createService(platformResolver: PlatformResolverMock) {
  return new WatermarkService(
    platformResolver as unknown as WatermarkPlatformResolver,
  );
}

describe('WatermarkService', () => {
  it('parses xhs note without saving records', async () => {
    const parser = {
      parse: jest.fn().mockResolvedValue({
        sourceUrl: 'http://xhslink.com/o/demo',
        finalUrl: 'https://www.xiaohongshu.com/explore/demo',
        noteId: 'demo',
        title: '标题',
        content: '正文',
        type: 'normal',
        images: [
          {
            index: 1,
            url: 'https://ci.xiaohongshu.com/a',
            source: 'traceId',
          },
        ],
        videoUrl: '',
      }),
    };
    const platformResolver = {
      resolve: jest.fn().mockReturnValue('xhs'),
      getParser: jest.fn().mockReturnValue(parser),
    };
    const service = createService(platformResolver);

    const result = await service.parse({ text: 'http://xhslink.com/o/demo' });

    expect(parser.parse).toHaveBeenCalledWith('http://xhslink.com/o/demo');
    expect(platformResolver.resolve).toHaveBeenCalledWith(
      undefined,
      'http://xhslink.com/o/demo',
    );
    expect('recordId' in result).toBe(false);
    expect(result.images).toHaveLength(1);
  });

  it('rethrows parse errors without saving failure records', async () => {
    const parser = {
      parse: jest.fn().mockRejectedValue(new Error('未找到有效链接')),
    };
    const platformResolver = {
      resolve: jest.fn().mockReturnValue('xhs'),
      getParser: jest.fn().mockReturnValue(parser),
    };
    const service = createService(platformResolver);

    await expect(service.parse({ text: 'not-a-url' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(parser.parse).toHaveBeenCalledWith('not-a-url');
  });

  it('can dispatch to douyin parser', async () => {
    const parser = {
      parse: jest.fn().mockResolvedValue({
        sourceUrl: 'https://v.douyin.com/demo/',
        finalUrl: 'https://www.iesdouyin.com/share/video/123/',
        noteId: '123',
        title: '',
        content: '抖音文案',
        type: 'video',
        images: [],
        coverUrl: 'https://example.com/cover.jpeg',
        videoUrl: 'https://example.com/video.mp4',
        musicUrl: 'https://example.com/music.mp3',
      }),
    };
    const platformResolver = {
      resolve: jest.fn().mockReturnValue('douyin'),
      getParser: jest.fn().mockReturnValue(parser),
    };
    const service = createService(platformResolver);

    const result = await service.parse({
      text: 'https://v.douyin.com/demo/',
      source: 'douyin',
    });

    expect(platformResolver.getParser).toHaveBeenCalledWith('douyin');
    expect(result.source).toBe('douyin');
    expect(result.videoUrl).toBe('https://example.com/video.mp4');
    expect(result.coverUrl).toBe('https://example.com/cover.jpeg');
  });
});
