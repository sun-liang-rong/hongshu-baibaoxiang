import { GenerateType } from '@prisma/client/index';
import { FavoriteService } from './favorite.service';

describe('FavoriteService', () => {
  const fixedDate = new Date('2026-07-07T12:00:00.000Z');
  let prisma: {
    favorite: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
      count: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let service: FavoriteService;

  beforeEach(() => {
    prisma = {
      favorite: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    service = new FavoriteService(prisma as never);
  });

  it('lists favorites for the current openid and type', async () => {
    prisma.favorite.findMany.mockResolvedValue([
      {
        id: 12n,
        type: GenerateType.copywriting,
        refId: 'record-1',
        title: '通勤穿搭',
        summary: null,
        payload: { title: '通勤穿搭', body: '正文' },
        createdAt: fixedDate,
      },
    ]);

    await expect(
      service.list('openid-1', GenerateType.copywriting),
    ).resolves.toEqual({
      items: [
        {
          id: '12',
          type: GenerateType.copywriting,
          refId: 'record-1',
          title: '通勤穿搭',
          summary: '',
          payload: { title: '通勤穿搭', body: '正文' },
          createdAt: fixedDate.toISOString(),
        },
      ],
      nextCursor: '',
      pageSize: 20,
    });
    expect(prisma.favorite.findMany).toHaveBeenCalledWith({
      where: { openid: 'openid-1', type: GenerateType.copywriting },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 21,
    });
  });

  it('uses cursor and clamped limit when listing favorites', async () => {
    prisma.favorite.findMany.mockResolvedValue([
      {
        id: 11n,
        type: GenerateType.title,
        refId: 'record-11',
        title: '标题 11',
        summary: '',
        payload: '标题 11',
        createdAt: fixedDate,
      },
      {
        id: 10n,
        type: GenerateType.title,
        refId: 'record-10',
        title: '标题 10',
        summary: '',
        payload: '标题 10',
        createdAt: fixedDate,
      },
    ]);

    await expect(
      service.list('openid-1', GenerateType.title, {
        cursor: '12',
        limit: '1',
      }),
    ).resolves.toMatchObject({
      items: [{ id: '11', title: '标题 11' }],
      nextCursor: '11',
      pageSize: 1,
    });

    expect(prisma.favorite.findMany).toHaveBeenCalledWith({
      where: { openid: 'openid-1', type: GenerateType.title },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 2,
      cursor: { id: 12n },
      skip: 1,
    });
  });

  it('creates a favorite when it does not exist', async () => {
    prisma.favorite.findUnique.mockResolvedValue(null);

    await expect(
      service.toggle('openid-1', {
        type: GenerateType.title,
        refId: 'record-1_标题',
        title: '标题',
        summary: '主题',
        payload: '标题',
      }),
    ).resolves.toEqual({ favorited: true });

    expect(prisma.favorite.create).toHaveBeenCalledWith({
      data: {
        openid: 'openid-1',
        type: GenerateType.title,
        refId: 'record-1_标题',
        title: '标题',
        summary: '主题',
        payload: '标题',
      },
    });
  });

  it('removes a favorite when it already exists', async () => {
    prisma.favorite.findUnique.mockResolvedValue({ id: 9n });

    await expect(
      service.toggle('openid-1', {
        type: GenerateType.title,
        refId: 'record-1_标题',
        title: '标题',
        summary: '主题',
        payload: '标题',
      }),
    ).resolves.toEqual({ favorited: false });

    expect(prisma.favorite.delete).toHaveBeenCalledWith({ where: { id: 9n } });
  });

  it('checks favorite status and removes by owner', async () => {
    prisma.favorite.count.mockResolvedValue(1);

    await expect(
      service.check('openid-1', GenerateType.title, 'record-1_标题'),
    ).resolves.toEqual({ favorited: true });
    expect(prisma.favorite.count).toHaveBeenCalledWith({
      where: {
        openid: 'openid-1',
        type: GenerateType.title,
        refId: 'record-1_标题',
      },
    });

    await service.remove('openid-1', '12');
    expect(prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { id: 12n, openid: 'openid-1' },
    });
  });
});
