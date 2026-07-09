import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { GenerateStatus, GenerateType } from '@prisma/client/index';
import request from 'supertest';
import { App } from 'supertest/types';
import { AiProviderIntegrationService } from '../../integrations/ai-provider/ai-provider-integration.service';
import { TransformInterceptor } from '../../common/interceptors/transform.interceptor';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { FavoriteModule } from '../favorite/favorite.module';
import { GenerateModule } from './generate.module';
import { HistoryModule } from '../history/history.module';

interface GenerateRecordRow {
  id: bigint;
  openid?: string;
  type: GenerateType;
  topic: string;
  input: unknown;
  output?: unknown;
  title?: string | null;
  summary?: string | null;
  status: GenerateStatus;
  aiProvider?: string;
  aiModel?: string;
  promptVersion?: string;
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface FavoriteRow {
  id: bigint;
  openid: string;
  type: GenerateType;
  refId: string;
  title: string;
  summary?: string | null;
  payload: unknown;
  createdAt: Date;
  updatedAt: Date;
}

describe('generate, favorite and history integration', () => {
  let app: INestApplication<App>;
  let prisma: ReturnType<typeof createPrismaMock>;
  let aiProvider: {
    generateJson: jest.Mock;
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    aiProvider = {
      generateJson: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, GenerateModule, HistoryModule, FavoriteModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: number) => {
              const values: Record<string, number> = {
                'generate.watermarkDailyLimit': 20,
                'generate.titleDailyLimit': 10,
                'generate.copywritingDailyLimit': 5,
              };
              return values[key] ?? defaultValue;
            }),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .overrideProvider(AiProviderIntegrationService)
      .useValue(aiProvider)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('generates titles, stores history, toggles favorite and removes it', async () => {
    aiProvider.generateJson.mockResolvedValue({
      content: {
        titles: ['夏季通勤穿搭公式', '普通人也能照搬的通勤穿搭'],
      },
      rawContent: '{}',
      metadata: {
        provider: 'mock',
        model: 'mock-model',
      },
    });

    const titleResponse = await request(app.getHttpServer())
      .post('/api/v1/generate/titles')
      .set('x-openid', 'openid-1')
      .send({
        topic: '夏季通勤穿搭',
        contentType: '种草推荐',
        style: '真实分享',
        count: 2,
      })
      .expect(201);

    expect(titleResponse.body).toMatchObject({
      code: 0,
      message: 'success',
      data: {
        recordId: '1',
        titles: ['夏季通勤穿搭公式', '普通人也能照搬的通勤穿搭'],
        quota: {
          used: 1,
          limit: 10,
          remaining: 9,
        },
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/history?type=title')
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.code).toBe(0);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.nextCursor).toBe('');
        expect(body.data.items[0]).toMatchObject({
          id: '1',
          type: GenerateType.title,
          title: '夏季通勤穿搭公式',
          summary: '夏季通勤穿搭公式 / 普通人也能照搬的通勤穿搭',
          payload: {
            titles: ['夏季通勤穿搭公式', '普通人也能照搬的通勤穿搭'],
          },
        });
      });

    const refId = '1_夏季通勤穿搭公式';
    await request(app.getHttpServer())
      .post('/api/v1/favorites')
      .set('x-openid', 'openid-1')
      .send({
        type: GenerateType.title,
        refId,
        title: '夏季通勤穿搭公式',
        summary: '夏季通勤穿搭',
        payload: '夏季通勤穿搭公式',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 0,
          message: 'success',
          data: { favorited: true },
        });
      });

    await request(app.getHttpServer())
      .get(
        `/api/v1/favorites/status?type=title&refId=${encodeURIComponent(refId)}`,
      )
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 0,
          message: 'success',
          data: { favorited: true },
        });
      });

    await request(app.getHttpServer())
      .get('/api/v1/favorites?type=title')
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.code).toBe(0);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.nextCursor).toBe('');
        expect(body.data.items[0]).toMatchObject({
          id: '1',
          type: GenerateType.title,
          refId,
          title: '夏季通勤穿搭公式',
          payload: '夏季通勤穿搭公式',
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/favorites')
      .set('x-openid', 'openid-1')
      .send({
        type: GenerateType.title,
        refId,
        title: '夏季通勤穿搭公式',
        summary: '夏季通勤穿搭',
        payload: '夏季通勤穿搭公式',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({
          code: 0,
          message: 'success',
          data: { favorited: false },
        });
      });
  });

  it('generates copywriting, stores history and supports clearing records', async () => {
    aiProvider.generateJson.mockResolvedValue({
      content: {
        title: '夏季通勤防晒这样穿',
        body: '防晒方面，轻薄外套真的很适合日常通勤。',
        tags: ['夏季穿搭', '通勤穿搭'],
        imageSuggestions: ['全身通勤照', '面料细节图'],
      },
      rawContent: '{}',
      metadata: {
        provider: 'mock',
        model: 'mock-model',
      },
    });

    const copywritingResponse = await request(app.getHttpServer())
      .post('/api/v1/generate/copywriting')
      .set('x-openid', 'openid-1')
      .send({
        topic: '夏季通勤防晒',
        style: '真实分享',
        length: 'medium',
        includeTags: true,
      })
      .expect(201);

    expect(copywritingResponse.body).toMatchObject({
      code: 0,
      message: 'success',
      data: {
        recordId: '1',
        title: '夏季通勤防晒这样穿',
        body: '防晒方面，轻薄外套真的很适合日常通勤。',
        tags: ['夏季穿搭', '通勤穿搭'],
        imageSuggestions: ['全身通勤照', '面料细节图'],
        quota: {
          used: 1,
          limit: 5,
          remaining: 4,
        },
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/history?type=copywriting')
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.code).toBe(0);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.nextCursor).toBe('');
        expect(body.data.items[0]).toMatchObject({
          id: '1',
          type: GenerateType.copywriting,
          title: '夏季通勤防晒这样穿',
          summary: '防晒方面，轻薄外套真的很适合日常通勤。',
          payload: {
            title: '夏季通勤防晒这样穿',
            body: '防晒方面，轻薄外套真的很适合日常通勤。',
          },
        });
      });

    await request(app.getHttpServer())
      .delete('/api/v1/history?type=copywriting')
      .set('x-openid', 'openid-1')
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/history?type=copywriting')
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 0,
          message: 'success',
          data: {
            items: [],
            nextCursor: '',
            pageSize: 20,
          },
        });
      });
  });

  it('blocks title generation when daily quota is exhausted', async () => {
    for (let index = 0; index < 10; index += 1) {
      await prisma.generateRecord.create({
        data: {
          openid: 'openid-1',
          type: GenerateType.title,
          topic: '已用次数',
          input: {},
          output: { titles: [`旧标题${index}`] },
          title: `旧标题${index}`,
          summary: `旧标题${index}`,
          status: GenerateStatus.success,
        },
      });
    }

    await request(app.getHttpServer())
      .get('/api/v1/generate/quota')
      .set('x-openid', 'openid-1')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 0,
          data: {
            title: {
              used: 10,
              limit: 10,
              remaining: 0,
            },
            watermark: {
              used: 0,
              limit: 20,
              remaining: 20,
            },
            copywriting: {
              used: 0,
              limit: 5,
              remaining: 5,
            },
          },
        });
      });

    await request(app.getHttpServer())
      .post('/api/v1/generate/titles')
      .set('x-openid', 'openid-1')
      .send({
        topic: '夏季通勤穿搭',
        contentType: '种草推荐',
        style: '真实分享',
        count: 2,
      })
      .expect(403);

    expect(aiProvider.generateJson).not.toHaveBeenCalled();
  });
});

function createPrismaMock() {
  const records: GenerateRecordRow[] = [];
  const favorites: FavoriteRow[] = [];
  let recordId = 1n;
  let favoriteId = 1n;

  return {
    generateRecord: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<GenerateRecordRow, 'id' | 'createdAt' | 'updatedAt'>;
        }) => {
          const now = new Date('2026-07-07T12:00:00.000Z');
          const record: GenerateRecordRow = {
            id: recordId,
            ...data,
            createdAt: now,
            updatedAt: now,
          };
          recordId += 1n;
          records.push(record);
          return Promise.resolve(record);
        },
      ),
      findMany: jest.fn(
        ({
          where,
          take,
          cursor,
          skip,
        }: {
          where: Partial<GenerateRecordRow>;
          take?: number;
          cursor?: { id: bigint };
          skip?: number;
        }) =>
          Promise.resolve(
            paginateRows(
              records
                .filter(
                  (record) =>
                    (!where.openid || record.openid === where.openid) &&
                    (!where.type || record.type === where.type) &&
                    (!where.status || record.status === where.status),
                )
                .sort(compareRowsDesc),
              take,
              cursor,
              skip,
            ),
          ),
      ),
      count: jest.fn(({ where }: { where: Partial<GenerateRecordRow> }) =>
        Promise.resolve(
          records.filter(
            (record) =>
              (!where.openid || record.openid === where.openid) &&
              (!where.type || record.type === where.type) &&
              (!where.status || record.status === where.status),
          ).length,
        ),
      ),
      deleteMany: jest.fn(
        ({ where }: { where: Partial<GenerateRecordRow> }) => {
          removeMatching(records, (record) => {
            const idMatches = where.id === undefined || record.id === where.id;
            const openidMatches =
              !where.openid || record.openid === where.openid;
            const typeMatches = !where.type || record.type === where.type;
            return idMatches && openidMatches && typeMatches;
          });
          return Promise.resolve({ count: 1 });
        },
      ),
    },
    favorite: {
      findMany: jest.fn(
        ({
          where,
          take,
          cursor,
          skip,
        }: {
          where: Partial<FavoriteRow>;
          take?: number;
          cursor?: { id: bigint };
          skip?: number;
        }) =>
          Promise.resolve(
            paginateRows(
              favorites
                .filter(
                  (favorite) =>
                    (!where.openid || favorite.openid === where.openid) &&
                    (!where.type || favorite.type === where.type),
                )
                .sort(compareRowsDesc),
              take,
              cursor,
              skip,
            ),
          ),
      ),
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            openid_type_refId: Pick<FavoriteRow, 'openid' | 'type' | 'refId'>;
          };
        }) => {
          const input = where.openid_type_refId;
          return Promise.resolve(
            favorites.find(
              (favorite) =>
                favorite.openid === input.openid &&
                favorite.type === input.type &&
                favorite.refId === input.refId,
            ) ?? null,
          );
        },
      ),
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<FavoriteRow, 'id' | 'createdAt' | 'updatedAt'>;
        }) => {
          const now = new Date('2026-07-07T12:00:00.000Z');
          const favorite: FavoriteRow = {
            id: favoriteId,
            ...data,
            createdAt: now,
            updatedAt: now,
          };
          favoriteId += 1n;
          favorites.push(favorite);
          return Promise.resolve(favorite);
        },
      ),
      delete: jest.fn(({ where }: { where: { id: bigint } }) => {
        removeMatching(favorites, (favorite) => favorite.id === where.id);
        return Promise.resolve({});
      }),
      count: jest.fn(({ where }: { where: Partial<FavoriteRow> }) =>
        Promise.resolve(
          favorites.filter(
            (favorite) =>
              favorite.openid === where.openid &&
              favorite.type === where.type &&
              favorite.refId === where.refId,
          ).length,
        ),
      ),
      deleteMany: jest.fn(({ where }: { where: Partial<FavoriteRow> }) => {
        removeMatching(
          favorites,
          (favorite) =>
            (where.id === undefined || favorite.id === where.id) &&
            (!where.openid || favorite.openid === where.openid),
        );
        return Promise.resolve({ count: 1 });
      }),
    },
  };
}

function removeMatching<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index])) {
      items.splice(index, 1);
    }
  }
}

function paginateRows<T extends { id: bigint; createdAt: Date }>(
  rows: T[],
  take?: number,
  cursor?: { id: bigint },
  skip = 0,
) {
  let start = 0;
  if (cursor) {
    const cursorIndex = rows.findIndex((row) => row.id === cursor.id);
    start = cursorIndex >= 0 ? cursorIndex + skip : rows.length;
  }

  const page = rows.slice(start);
  return typeof take === 'number' ? page.slice(0, take) : page;
}

function compareRowsDesc<T extends { id: bigint; createdAt: Date }>(
  a: T,
  b: T,
) {
  const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
  if (timeDiff !== 0) {
    return timeDiff;
  }

  return Number(b.id - a.id);
}
