import { isMockMode } from '../config/env';
import { HistoryItem, RecordType } from '../types/domain';
import { clearHistory, deleteHistory, listHistory } from './mock-store';
import { request } from './request';

export const list = (type?: RecordType): Promise<HistoryItem[]> => {
  if (isMockMode()) {
    return Promise.resolve(listHistory(type));
  }

  return request<HistoryItem[]>({
    url: type ? `/history?type=${type}` : '/history',
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

