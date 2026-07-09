import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GenerateType, Prisma } from '@prisma/client/index';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(
    openid: string,
    type?: GenerateType,
    pagination: { cursor?: string; limit?: string } = {},
  ) {
    const limit = this.parseLimit(pagination.limit);
    const cursor = this.parseCursor(pagination.cursor);
    const records = await this.runHistoryQuery(
      () =>
        this.prisma.generateRecord.findMany({
          where: {
            openid,
            status: 'success',
            ...(type ? { type } : {}),
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      [],
    );
    const hasMore = records.length > limit;
    const pageRecords = hasMore ? records.slice(0, limit) : records;

    return {
      items: pageRecords.map((record) => ({
        id: record.id.toString(),
        type: record.type,
        title: record.title || record.topic,
        summary: record.summary || '',
        payload: record.output,
        createdAt: record.createdAt.toISOString(),
      })),
      nextCursor: hasMore
        ? pageRecords[pageRecords.length - 1].id.toString()
        : '',
      pageSize: limit,
    };
  }

  async remove(openid: string, id: string) {
    await this.runHistoryQuery(
      () =>
        this.prisma.generateRecord.deleteMany({
          where: {
            id: BigInt(id),
            openid,
          },
        }),
      undefined,
    );
  }

  async clear(openid: string, type?: GenerateType) {
    await this.runHistoryQuery(
      () =>
        this.prisma.generateRecord.deleteMany({
          where: {
            openid,
            ...(type ? { type } : {}),
          },
        }),
      undefined,
    );
  }

  save(data: {
    openid?: string;
    type: GenerateType;
    topic: string;
    input: Prisma.InputJsonObject;
    output: unknown;
    title: string;
    summary: string;
  }) {
    return this.prisma.generateRecord.create({
      data: {
        ...data,
        output: data.output as Prisma.InputJsonValue,
        status: 'success',
      },
    });
  }

  private async runHistoryQuery<T>(
    query: () => Promise<T>,
    fallback: T,
  ): Promise<T> {
    try {
      return await query();
    } catch (error) {
      this.logger.error(
        `历史记录数据库访问失败：${this.toErrorMessage(error)}`,
      );
      return fallback;
    }
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private parseLimit(value?: string) {
    const parsed = Number(value || DEFAULT_PAGE_SIZE);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return DEFAULT_PAGE_SIZE;
    }

    return Math.min(parsed, MAX_PAGE_SIZE);
  }

  private parseCursor(value?: string) {
    if (!value) {
      return undefined;
    }

    try {
      const cursor = BigInt(value);
      if (cursor <= 0n) {
        throw new Error('invalid cursor');
      }
      return cursor;
    } catch {
      throw new BadRequestException('分页游标格式不正确');
    }
  }
}
