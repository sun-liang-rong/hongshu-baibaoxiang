import {
  BadGatewayException,
  Controller,
  Get,
  Logger,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WatermarkParserIntegrationService } from '../../integrations/watermark-parser/watermark-parser-integration.service';

@ApiTags('watermark')
@Controller('download')
export class DownloadController {
  private readonly logger = new Logger(DownloadController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly watermarkParser: WatermarkParserIntegrationService,
  ) {}

  @Get()
  @ApiOperation({ summary: '代理转发解析服务的下载地址（流式）' })
  async download(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      throw new BadGatewayException('缺少下载 token');
    }

    const origin = this.watermarkParser.getParserOrigin();
    const targetUrl = `${origin}/api/v1/download?token=${encodeURIComponent(token)}`;

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(targetUrl, {
        signal: AbortSignal.timeout(60_000),
        redirect: 'follow',
      });
    } catch (error) {
      this.logger.warn(`下载代理请求上游失败：${this.toErrorMessage(error)}`);
      throw new BadGatewayException('下载服务暂不可用，请稍后重试');
    }

    if (!upstream.ok || !upstream.body) {
      this.logger.warn(
        `下载代理上游返回异常 status=${upstream.status} token=${token.slice(0, 8)}…`,
      );
      throw new BadGatewayException('下载资源获取失败，请重新解析后重试');
    }

    const headers = upstream.headers;
    const contentType = headers.get('content-type');
    const contentLength = headers.get('content-length');
    const filename = headers.get('content-disposition');

    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    if (filename) {
      res.setHeader('Content-Disposition', filename);
    }
    res.setHeader('Cache-Control', 'no-store');

    // Node 18+ 的 fetch body 是 Web ReadableStream，需转为 Node 流再 pipe。
    const { Readable } = await import('node:stream');
    const stream = Readable.fromWeb(
      upstream.body as unknown as import('node:stream/web').ReadableStream,
    );
    stream.on('error', (error: unknown) => {
      this.logger.warn(`下载代理流转发失败：${this.toErrorMessage(error)}`);
      res.destroy();
    });
    stream.pipe(res);
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
