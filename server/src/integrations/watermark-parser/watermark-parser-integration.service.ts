import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RemoteWatermarkResponse,
  RemoteWatermarkSuccessResponse,
} from './watermark-parser.types';

@Injectable()
export class WatermarkParserIntegrationService {
  constructor(private readonly configService: ConfigService) {}

  async parse(link: string): Promise<RemoteWatermarkSuccessResponse> {
    const endpoint = this.configService.get<string>(
      'watermarkParser.url',
      'http://hongshu.sale:5555/api/v1/parse',
    );
    const timeoutMs = this.configService.get<number>(
      'watermarkParser.timeoutMs',
      30000,
    );

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ link }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new Error('去水印服务请求超时，请稍后重试');
      }
      throw new Error('去水印服务暂不可用，请稍后重试');
    }

    const payload = await this.readResponse(response);
    if (!response.ok || !payload.success || !payload.data) {
      throw new Error(
        payload.message ||
          payload.error ||
          `去水印解析失败（${response.status}）`,
      );
    }

    return {
      success: true,
      data: payload.data,
      request_id: payload.request_id || '',
    };
  }

  private async readResponse(response: Response) {
    try {
      return (await response.json()) as RemoteWatermarkResponse;
    } catch {
      throw new Error('去水印服务返回了无效数据');
    }
  }
}
