import { BadRequestException } from '@nestjs/common';
import { DouyinParserIntegrationService } from '../../integrations/douyin-parser/douyin-parser-integration.service';
import { XhsParserIntegrationService } from '../../integrations/xhs-parser/xhs-parser-integration.service';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';

describe('WatermarkPlatformResolver', () => {
  const createResolver = () =>
    new WatermarkPlatformResolver(
      {} as XhsParserIntegrationService,
      {} as DouyinParserIntegrationService,
    );

  it('uses explicit source when provided', () => {
    const resolver = createResolver();
    expect(resolver.resolve('xhs', 'https://v.douyin.com/abc/')).toBe('xhs');
  });

  it('auto-detects douyin links', () => {
    const resolver = createResolver();
    expect(resolver.resolve(undefined, 'https://v.douyin.com/abc/')).toBe(
      'douyin',
    );
  });

  it('auto-detects xhs links', () => {
    const resolver = createResolver();
    expect(resolver.resolve(undefined, 'http://xhslink.com/o/abc')).toBe('xhs');
  });

  it('rejects unsupported links', () => {
    const resolver = createResolver();
    expect(() =>
      resolver.resolve(undefined, 'https://example.com/demo'),
    ).toThrow(BadRequestException);
  });
});
