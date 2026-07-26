import { ConfigService } from '@nestjs/config';
import { WatermarkParserIntegrationService } from './watermark-parser-integration.service';

describe('WatermarkParserIntegrationService', () => {
  const endpoint = 'http://parser.example.com/api/v1/parse';
  const fetchMock = jest.fn();
  const configService = {
    get: jest.fn((key: string, fallback: unknown) => {
      if (key === 'watermarkParser.url') {
        return endpoint;
      }
      if (key === 'watermarkParser.timeoutMs') {
        return 5000;
      }
      return fallback;
    }),
  };

  beforeEach(() => {
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
    jest.restoreAllMocks();
  });

  const response = (body: unknown, status: number): Response =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Response;

  it('posts the share text as link and returns parsed data', async () => {
    const data = {
      platform: 'douyin',
      id: '123',
      video: { url: 'https://example.com/video.mp4' },
    };
    fetchMock.mockResolvedValue(response({ success: true, data }, 201));
    const service = new WatermarkParserIntegrationService(
      configService as unknown as ConfigService,
    );

    await expect(service.parse('分享文本')).resolves.toEqual({
      success: true,
      data,
      request_id: '',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      endpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: '分享文本' }),
      }),
    );
  });

  it('reports an error returned by the remote service', async () => {
    fetchMock.mockResolvedValue(
      response({ success: false, message: '链接无效' }, 400),
    );
    const service = new WatermarkParserIntegrationService(
      configService as unknown as ConfigService,
    );

    await expect(service.parse('bad-link')).rejects.toThrow('链接无效');
  });

  it('handles an invalid remote response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
    } as unknown as Response);
    const service = new WatermarkParserIntegrationService(
      configService as unknown as ConfigService,
    );

    await expect(service.parse('分享文本')).rejects.toThrow(
      '去水印服务返回了无效数据',
    );
  });
});
