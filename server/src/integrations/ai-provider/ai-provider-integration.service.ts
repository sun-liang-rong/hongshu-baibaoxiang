import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiGenerateOptions,
  AiGenerateResult,
  ChatCompletionResponse,
} from './ai-provider.types';

@Injectable()
export class AiProviderIntegrationService {
  constructor(private readonly configService: ConfigService) {}

  async generateText(
    options: AiGenerateOptions,
  ): Promise<AiGenerateResult<string>> {
    const rawContent = await this.requestChatCompletion(options);

    return {
      content: rawContent,
      rawContent,
      metadata: this.getMetadata(),
    };
  }

  async generateJson<T>(
    options: AiGenerateOptions,
  ): Promise<AiGenerateResult<T>> {
    const rawContent = await this.requestChatCompletion({
      ...options,
      responseFormat: 'json',
    });

    try {
      return {
        content: this.parseJson<T>(rawContent),
        rawContent,
        metadata: this.getMetadata(),
      };
    } catch {
      throw new BadGatewayException('大模型返回格式异常，请稍后重试');
    }
  }

  private async requestChatCompletion(
    options: AiGenerateOptions,
  ): Promise<string> {
    const baseUrl = this.getRequiredConfig('AI_BASE_URL');
    const apiKey = this.getRequiredConfig('AI_API_KEY');
    const model = this.getRequiredConfig('AI_MODEL');
    const endpoint = new URL(
      '/v1/chat/completions',
      this.normalizeBaseUrl(baseUrl),
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: options.systemPrompt,
            },
            {
              role: 'user',
              content: options.userPrompt,
            },
          ],
          temperature: options.temperature ?? 0.8,
          max_tokens: options.maxTokens ?? 1500,
          response_format:
            options.responseFormat === 'json'
              ? {
                  type: 'json_object',
                }
              : undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await this.readErrorMessage(response);
        throw new BadGatewayException(message);
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new BadGatewayException('大模型未返回有效内容');
      }

      return content;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ServiceUnavailableException('大模型响应超时，请稍后重试');
      }

      throw new ServiceUnavailableException('大模型服务暂不可用，请稍后重试');
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseJson<T>(rawContent: string): T {
    const normalized = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    return JSON.parse(normalized) as T;
  }

  private getRequiredConfig(key: 'AI_BASE_URL' | 'AI_API_KEY' | 'AI_MODEL') {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new ServiceUnavailableException(`缺少大模型配置：${key}`);
    }

    return value;
  }

  private getMetadata() {
    return {
      provider: this.configService.get<string>('AI_PROVIDER') || 'starapi',
      model: this.configService.get<string>('AI_MODEL') || '',
    };
  }

  private normalizeBaseUrl(baseUrl: string) {
    return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  }

  private async readErrorMessage(response: Response) {
    const fallback = `大模型调用失败：${response.status}`;

    try {
      const data = (await response.json()) as {
        error?: {
          message?: string;
        };
        message?: string;
      };

      return data.error?.message || data.message || fallback;
    } catch {
      return fallback;
    }
  }
}
