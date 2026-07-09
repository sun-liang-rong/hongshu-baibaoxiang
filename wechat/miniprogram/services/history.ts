import { isMockMode } from '../config/env';
import { HistoryItem, PaginatedResult, RecordType } from '../types/domain';
import { clearHistory, deleteHistory, listHistoryPage } from './mock-store';
import { request } from './request';

const PAGE_SIZE = 20;

interface ListOptions {
  cursor?: string;
  limit?: number;
}

export const list = (
  type?: RecordType,
  options: ListOptions = {},
): Promise<PaginatedResult<HistoryItem>> => {
  const limit = options.limit || PAGE_SIZE;
  if (isMockMode()) {
    return Promise.resolve(listHistoryPage(type, options.cursor || '', limit));
  }

  return request<PaginatedResult<HistoryItem>>({
    url: buildListUrl('/history', type, options.cursor, limit),
    auth: true,
  });
};

export const remove = (id: string): Promise<void> => {
  if (isMockMode()) {
    deleteHistory(id);
    return Promise.resolve();
  }

  return request<void>({
    url: `/history/${id}`,
    method: 'DELETE',
    auth: true,
  });
};

const buildListUrl = (
  path: string,
  type?: RecordType,
  cursor?: string,
  limit = PAGE_SIZE,
) => {
  const params: string[] = [`limit=${limit}`];
  if (type) {
    params.push(`type=${type}`);
  }
  if (cursor) {
    params.push(`cursor=${encodeURIComponent(cursor)}`);
  }

  return `${path}?${params.join('&')}`;
};

export const clear = (type?: RecordType): Promise<void> => {
  if (isMockMode()) {
    clearHistory(type);
    return Promise.resolve();
  }

  return request<void>({
    url: type ? `/history?type=${type}` : '/history',
    method: 'DELETE',
    auth: true,
  });
};
