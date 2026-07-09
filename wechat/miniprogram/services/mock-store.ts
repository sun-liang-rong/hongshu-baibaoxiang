import {
  CopywritingResult,
  FavoriteItem,
  FavoritePayload,
  HistoryItem,
  PaginatedResult,
  RecordType,
  WatermarkResult,
} from '../types/domain';
import { getStorage, setStorage } from '../utils/storage';

const HISTORY_KEY = 'hshu_history';
const FAVORITES_KEY = 'hshu_favorites';

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

export const nowIso = () => new Date().toISOString();

export const listHistory = (type?: RecordType) => {
  const list = getStorage<HistoryItem[]>(HISTORY_KEY, []);
  return type ? list.filter((item) => item.type === type) : list;
};

export const listHistoryPage = (
  type?: RecordType,
  cursor = '',
  limit = 20,
): PaginatedResult<HistoryItem> => paginate(listHistory(type), cursor, limit);

export const addHistory = (item: Omit<HistoryItem, 'createdAt'>) => {
  const next: HistoryItem = {
    ...item,
    createdAt: nowIso(),
  };
  const list = [next, ...listHistory()].slice(0, 80);
  setStorage(HISTORY_KEY, list);
  return next;
};

export const deleteHistory = (id: string) => {
  setStorage(
    HISTORY_KEY,
    listHistory().filter((item) => item.id !== id),
  );
};

export const clearHistory = (type?: RecordType) => {
  if (!type) {
    setStorage(HISTORY_KEY, []);
    return;
  }

  setStorage(
    HISTORY_KEY,
    listHistory().filter((item) => item.type !== type),
  );
};

export const listFavorites = (type?: RecordType) => {
  const list = getStorage<FavoriteItem[]>(FAVORITES_KEY, []);
  return type ? list.filter((item) => item.type === type) : list;
};

export const listFavoritesPage = (
  type?: RecordType,
  cursor = '',
  limit = 20,
): PaginatedResult<FavoriteItem> => paginate(listFavorites(type), cursor, limit);

export const toggleFavorite = (payload: FavoritePayload) => {
  const list = listFavorites();
  const existing = list.find((item) => item.type === payload.type && item.refId === payload.refId);

  if (existing) {
    setStorage(
      FAVORITES_KEY,
      list.filter((item) => item.id !== existing.id),
    );
    return { favorited: false };
  }

  const next: FavoriteItem = {
    ...payload,
    id: uid('fav'),
    createdAt: nowIso(),
  };
  setStorage(FAVORITES_KEY, [next, ...list]);
  return { favorited: true };
};

export const deleteFavorite = (id: string) => {
  setStorage(
    FAVORITES_KEY,
    listFavorites().filter((item) => item.id !== id),
  );
};

export const isFavorited = (type: RecordType, refId: string) =>
  listFavorites().some((item) => item.type === type && item.refId === refId);

export const createWatermarkResult = (text: string): WatermarkResult => {
  const id = uid('wm');
  return {
    id,
    source: 'xhs',
    sourceUrl: text,
    finalUrl: text,
    noteId: id,
    title: '红薯热门笔记素材示例',
    content: '这是一段 mock 原文案。真实接口接入后，这里会展示笔记正文，用户可以一键复制用于学习整理。',
    type: 'image',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    ],
    coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    videoUrl: '',
    musicUrl: '',
    status: 'success',
    createdAt: nowIso(),
  };
};

export const createCopywritingResult = (topic: string, style?: string, length?: string): CopywritingResult => {
  const recordId = uid('cw');
  const tone = style || '真实分享';
  const sizeText = length === 'long' ? '长文案' : length === 'short' ? '短文案' : '中等文案';

  return {
    recordId,
    title: `${topic}真的值得试一次｜${tone}版`,
    body: `最近认真体验了${topic}，最大的感受是它把复杂的事情变简单了。\n\n适合正在做红薯内容、想提升效率的人：先明确场景，再提炼亮点，最后用真实体验把信息讲清楚。\n\n如果你也在准备相关内容，可以从痛点、体验、结果三个角度展开，整体会更自然，也更容易被用户看懂。\n\n总结：${topic}适合做成${sizeText}，重点放在真实感和可执行建议上。`,
    tags: ['红薯运营', '内容创作', topic, tone].filter(Boolean),
    imageSuggestions: ['首图突出结果对比', '过程图展示关键步骤', '结尾图整理清单要点'],
  };
};

const paginate = <T extends { id: string }>(
  list: T[],
  cursor: string,
  limit: number,
): PaginatedResult<T> => {
  const pageSize = Math.max(1, limit);
  const startIndex = cursor ? list.findIndex((item) => item.id === cursor) + 1 : 0;
  const safeStartIndex = startIndex > 0 ? startIndex : 0;
  const pageItems = list.slice(safeStartIndex, safeStartIndex + pageSize);
  const hasMore = safeStartIndex + pageSize < list.length;

  return {
    items: pageItems,
    nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id || '' : '',
    pageSize,
  };
};
