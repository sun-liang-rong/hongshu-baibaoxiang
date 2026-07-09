import { BadRequestException, Injectable } from '@nestjs/common';
import { GenerateType, Prisma } from '@prisma/client/index';
import { PrismaService } from '../../database/prisma.service';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    openid: string,
    type?: GenerateType,
    pagination: { cursor?: string; limit?: string } = {},
  ) {
    const limit = this.parseLimit(pagination.limit);
    const cursor = this.parseCursor(pagination.cursor);
    const favorites = await this.prisma.favorite.findMany({
      where: {
        openid,
        ...(type ? { type } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = favorites.length > limit;
    const pageFavorites = hasMore ? favorites.slice(0, limit) : favorites;

    return {
      items: pageFavorites.map((favorite) => ({
        id: favorite.id.toString(),
        type: favorite.type,
        refId: favorite.refId,
        title: favorite.title,
        summary: favorite.summary || '',
        payload: favorite.payload,
        createdAt: favorite.createdAt.toISOString(),
      })),
      nextCursor: hasMore
        ? pageFavorites[pageFavorites.length - 1].id.toString()
        : '',
      pageSize: limit,
    };
  }

  async toggle(openid: string, dto: ToggleFavoriteDto) {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        openid_type_refId: {
          openid,
          type: dto.type,
          refId: dto.refId,
        },
      },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: {
        openid,
        type: dto.type,
        refId: dto.refId,
        title: dto.title,
        summary: dto.summary,
        payload: dto.payload as Prisma.InputJsonValue,
      },
    });

    return { favorited: true };
  }

  async check(openid: string, type: GenerateType, refId: string) {
    const count = await this.prisma.favorite.count({
      where: {
        openid,
        type,
        refId,
      },
    });

    return { favorited: count > 0 };
  }

  async remove(openid: string, id: string) {
    await this.prisma.favorite.deleteMany({
      where: {
        id: BigInt(id),
        openid,
      },
    });
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
