import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RemoteWatermarkResponse,
  RemoteWatermarkSuccessResponse,
} from './watermark-parser.types';

@Injectable()
export class WatermarkParserIntegrationService {
  constructor(private readonly configService: ConfigService) {}

  /** 解析服务（5555 端口）的源地址，供下载代理拼接相对路径使用。 */
  getParserOrigin(): string {
    const endpoint = this.configService.get<string>(
      'watermarkParser.url',
      'http://hongshu.sale:5555/api/v1/parse',
    );
    try {
      return new URL(endpoint).origin;
    } catch {
      return 'http://hongshu.sale:5555';
    }
  }

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
      // 解析错误信息
      let errorMessage = '去水印解析失败';

      if (payload.error && typeof payload.error === 'object') {
        // 处理结构化错误对象
        const errorObj = payload.error as any;

        // 根据错误代码返回用户友好的消息
        if (errorObj.code === 'UPSTREAM_BLOCKED') {
          errorMessage = '平台暂时拒绝访问，请稍后重试或更换链接';
        } else if (errorObj.code === 'PARSE_FAILED') {
          errorMessage = '链接解析失败，请检查链接是否正确';
        } else if (errorObj.message) {
          errorMessage = errorObj.message;
        } else {
          errorMessage = JSON.stringify(errorObj);
        }
      } else if (payload.message) {
        errorMessage = typeof payload.message === 'string'
          ? payload.message
          : JSON.stringify(payload.message);
      } else if (payload.error) {
        errorMessage = typeof payload.error === 'string'
          ? payload.error
          : JSON.stringify(payload.error);
      } else {
        errorMessage = `去水印解析失败（${response.status}）`;
      }

      console.error('远程解析服务错误:', {
        status: response.status,
        payload,
        errorMessage,
      });

      throw new Error(errorMessage);
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
