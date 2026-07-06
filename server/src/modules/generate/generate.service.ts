import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { GenerateStatus, GenerateType, Prisma } from '@prisma/client/index';
import { AiProviderIntegrationService } from '../../integrations/ai-provider/ai-provider-integration.service';
import { PrismaService } from '../../database/prisma.service';
import { GenerateCopywritingDto } from './dto/generate-copywriting.dto';
import { GenerateTitlesDto } from './dto/generate-titles.dto';
import {
  buildCopywritingSystemPrompt,
  buildCopywritingUserPrompt,
  COPYWRITING_PROMPT_VERSION,
} from './prompts/copywriting.prompt';
import {
  buildTitleSystemPrompt,
  buildTitleUserPrompt,
  TITLE_PROMPT_VERSION,
} from './prompts/title.prompt';
import {
  CopywritingAiResponse,
  CopywritingGenerateResult,
  TitleAiResponse,
  TitleGenerateResult,
} from './types/generate.types';

@Injectable()
export class GenerateService {
  private readonly logger = new Logger(GenerateService.name);

  constructor(
    private readonly aiProvider: AiProviderIntegrationService,
    private readonly prisma: PrismaService,
  ) {}

  async generateTitles(dto: GenerateTitlesDto): Promise<TitleGenerateResult> {
    const input = this.cleanInput(dto);

    try {
      const aiResult = await this.aiProvider.generateJson<TitleAiResponse>({
        systemPrompt: buildTitleSystemPrompt(),
        userPrompt: buildTitleUserPrompt(dto),
        temperature: 0.85,
        maxTokens: 1200,
      });
      const titles = this.normalizeTitles(
        aiResult.content.titles,
        dto.count ?? 10,
      );
      const output = { titles };
      const record = await this.saveRecordSafely({
        type: GenerateType.title,
        topic: dto.topic,
        input,
        output,
        title: titles[0] || dto.topic,
        summary: titles.slice(0, 3).join(' / '),
        status: GenerateStatus.success,
        aiProvider: aiResult.metadata.provider,
        aiModel: aiResult.metadata.model,
        promptVersion: TITLE_PROMPT_VERSION,
      });

      return {
        recordId:
          record?.id.toString() ?? this.createTemporaryRecordId('title'),
        titles,
      };
    } catch (error) {
      await this.saveFailedRecordSafely({
        type: GenerateType.title,
        topic: dto.topic,
        input,
        promptVersion: TITLE_PROMPT_VERSION,
        error,
      });
      throw error;
    }
  }

  async generateCopywriting(
    dto: GenerateCopywritingDto,
  ): Promise<CopywritingGenerateResult> {
    const input = this.cleanInput(dto);

    try {
      const aiResult =
        await this.aiProvider.generateJson<CopywritingAiResponse>({
          systemPrompt: buildCopywritingSystemPrompt(),
          userPrompt: buildCopywritingUserPrompt(dto),
          temperature: 0.75,
          maxTokens: this.getCopywritingMaxTokens(dto.length),
        });
      const output = this.normalizeCopywriting(aiResult.content, dto);
      const record = await this.saveRecordSafely({
        type: GenerateType.copywriting,
        topic: dto.topic,
        input,
        output,
        title: output.title,
        summary: output.body.slice(0, 120),
        status: GenerateStatus.success,
        aiProvider: aiResult.metadata.provider,
        aiModel: aiResult.metadata.model,
        promptVersion: COPYWRITING_PROMPT_VERSION,
      });

      return {
        recordId:
          record?.id.toString() ?? this.createTemporaryRecordId('copywriting'),
        ...output,
      };
    } catch (error) {
      await this.saveFailedRecordSafely({
        type: GenerateType.copywriting,
        topic: dto.topic,
        input,
        promptVersion: COPYWRITING_PROMPT_VERSION,
        error,
      });
      throw error;
    }
  }

  private normalizeTitles(titles: unknown, count: number) {
    if (!Array.isArray(titles)) {
      throw new BadGatewayException('大模型返回标题格式异常');
    }

    const normalized = titles
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, count);

    if (normalized.length === 0) {
      throw new BadGatewayException('大模型未生成有效标题');
    }

    return normalized;
  }

  private normalizeCopywriting(
    response: CopywritingAiResponse,
    dto: GenerateCopywritingDto,
  ) {
    if (
      !response ||
      typeof response.title !== 'string' ||
      typeof response.body !== 'string'
    ) {
      throw new BadGatewayException('大模型返回文案格式异常');
    }

    const title = response.title.trim();
    const body = response.body.trim();
    if (!title || !body) {
      throw new BadGatewayException('大模型未生成有效文案');
    }

    return {
      title,
      body,
      tags:
        dto.includeTags === false
          ? []
          : this.normalizeStringArray(response.tags).slice(0, 10),
      imageSuggestions: this.normalizeStringArray(
        response.imageSuggestions,
      ).slice(0, 8),
    };
  }

  private normalizeStringArray(input: unknown) {
    if (!Array.isArray(input)) {
      return [];
    }

    return input
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().replace(/^#/, ''))
      .filter(Boolean);
  }

  private getCopywritingMaxTokens(length?: 'short' | 'medium' | 'long') {
    if (length === 'long') {
      return 2600;
    }

    if (length === 'short') {
      return 1000;
    }

    return 1800;
  }

  private cleanInput(input: object) {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Prisma.InputJsonObject;
  }

  private saveRecord(data: {
    type: GenerateType;
    topic: string;
    input: Prisma.InputJsonObject;
    output: Prisma.InputJsonObject;
    title: string;
    summary: string;
    status: GenerateStatus;
    aiProvider: string;
    aiModel: string;
    promptVersion: string;
  }) {
    return this.prisma.generateRecord.create({
      data,
    });
  }

  private async saveRecordSafely(data: Parameters<typeof this.saveRecord>[0]) {
    try {
      return await this.saveRecord(data);
    } catch (error) {
      this.logger.warn(`生成记录保存失败：${this.toErrorMessage(error)}`);
      return null;
    }
  }

  private saveFailedRecord(data: {
    type: GenerateType;
    topic: string;
    input: Prisma.InputJsonObject;
    promptVersion: string;
    error: unknown;
  }) {
    return this.prisma.generateRecord.create({
      data: {
        type: data.type,
        topic: data.topic,
        input: data.input,
        status: GenerateStatus.failed,
        promptVersion: data.promptVersion,
        errorMessage:
          data.error instanceof Error ? data.error.message : '生成失败',
      },
    });
  }

  private async saveFailedRecordSafely(
    data: Parameters<typeof this.saveFailedRecord>[0],
  ) {
    try {
      await this.saveFailedRecord(data);
    } catch (error) {
      this.logger.warn(`失败生成记录保存失败：${this.toErrorMessage(error)}`);
    }
  }

  private createTemporaryRecordId(type: GenerateType) {
    return `${type}_${Date.now()}`;
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }
}
