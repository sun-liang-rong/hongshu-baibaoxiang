import { GenerateType } from '@prisma/client/index';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  const fixedDate = new Date('2026-07-07T12:00:00.000Z');
  let prisma: {
    generateRecord: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
  };
  let service: HistoryService;

  beforeEach(() => {
    prisma = {
      generateRecord: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new HistoryService(prisma as never);
  });

  it('lists successful records for the current openid and type', async () => {
    prisma.generateRecord.findMany.mockResolvedValue([
      {
        id: 7n,
        type: GenerateType.title,
        title: null,
        topic: '夏季穿搭',
        summary: '标题一 / 标题二',
        output: { titles: ['标题一', '标题二'] },
        createdAt: fixedDate,
      },
    ]);

    await expect(service.list('openid-1', GenerateType.title)).resolves.toEqual(
      {
        items: [
          {
            id: '7',
            type: GenerateType.title,
            title: '夏季穿搭',
            summary: '标题一 / 标题二',
            payload: { titles: ['标题一', '标题二'] },
            createdAt: fixedDate.toISOString(),
          },
        ],
        nextCursor: '',
        pageSize: 20,
      },
    );
    expect(prisma.generateRecord.findMany).toHaveBeenCalledWith({
      where: {
        openid: 'openid-1',
        status: 'success',
        type: GenerateType.title,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 21,
    });
  });

  it('uses cursor and clamped limit when listing records', async () => {
    prisma.generateRecord.findMany.mockResolvedValue([
      {
        id: 6n,
        type: GenerateType.title,
        title: '标题 6',
        topic: '夏季穿搭',
        summary: '',
        output: { titles: ['标题 6'] },
        createdAt: fixedDate,
      },
      {
        id: 5n,
        type: GenerateType.title,
        title: '标题 5',
        topic: '夏季穿搭',
        summary: '',
        output: { titles: ['标题 5'] },
        createdAt: fixedDate,
      },
      {
        id: 4n,
        type: GenerateType.title,
        title: '标题 4',
        topic: '夏季穿搭',
        summary: '',
        output: { titles: ['标题 4'] },
        createdAt: fixedDate,
      },
    ]);

    await expect(
      service.list('openid-1', GenerateType.title, {
        cursor: '7',
        limit: '2',
      }),
    ).resolves.toMatchObject({
      items: [
        { id: '6', title: '标题 6' },
        { id: '5', title: '标题 5' },
      ],
      nextCursor: '5',
      pageSize: 2,
    });

    expect(prisma.generateRecord.findMany).toHaveBeenCalledWith({
      where: {
        openid: 'openid-1',
        status: 'success',
        type: GenerateType.title,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
      cursor: { id: 7n },
      skip: 1,
    });
  });

  it('removes and clears records by owner', async () => {
    await service.remove('openid-1', '7');
    expect(prisma.generateRecord.deleteMany).toHaveBeenCalledWith({
      where: { id: 7n, openid: 'openid-1' },
    });

    await service.clear('openid-1', GenerateType.copywriting);
    expect(prisma.generateRecord.deleteMany).toHaveBeenCalledWith({
      where: { openid: 'openid-1', type: GenerateType.copywriting },
    });
  });

  it('saves a successful history record snapshot', async () => {
    prisma.generateRecord.create.mockResolvedValue({ id: 8n });

    await service.save({
      openid: 'openid-1',
      type: GenerateType.copywriting,
      topic: '通勤穿搭',
      input: { topic: '通勤穿搭' },
      output: { title: '标题', body: '正文' },
      title: '标题',
      summary: '正文',
    });

    expect(prisma.generateRecord.create).toHaveBeenCalledWith({
      data: {
        openid: 'openid-1',
        type: GenerateType.copywriting,
        topic: '通勤穿搭',
        input: { topic: '通勤穿搭' },
        output: { title: '标题', body: '正文' },
        title: '标题',
        summary: '正文',
        status: 'success',
      },
    });
  });
});
