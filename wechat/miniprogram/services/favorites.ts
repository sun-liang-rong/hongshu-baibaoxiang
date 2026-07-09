import { isMockMode } from '../config/env';
import { FavoriteItem, FavoritePayload, PaginatedResult, RecordType } from '../types/domain';
import { deleteFavorite, isFavorited, listFavoritesPage, toggleFavorite } from './mock-store';
import { request } from './request';

const PAGE_SIZE = 20;

interface ListOptions {
  cursor?: string;
  limit?: number;
}

export const list = (
  type?: RecordType,
  options: ListOptions = {},
): Promise<PaginatedResult<FavoriteItem>> => {
  const limit = options.limit || PAGE_SIZE;
  if (isMockMode()) {
    return Promise.resolve(listFavoritesPage(type, options.cursor || '', limit));
  }

  return request<PaginatedResult<FavoriteItem>>({
    url: buildListUrl('/favorites', type, options.cursor, limit),
    auth: true,
  });
};

export const toggle = (item: FavoritePayload): Promise<{ favorited: boolean }> => {
  if (isMockMode()) {
    return Promise.resolve(toggleFavorite(item));
  }

  return request<{ favorited: boolean }>({
    url: '/favorites',
    method: 'POST',
    data: item,
    auth: true,
  });
};

export const remove = (id: string): Promise<void> => {
  if (isMockMode()) {
    deleteFavorite(id);
    return Promise.resolve();
  }

  return request<void>({
    url: `/favorites/${id}`,
    method: 'DELETE',
    auth: true,
  });
};

export const check = (type: RecordType, refId: string) => {
  if (isMockMode()) {
    return isFavorited(type, refId);
  }

  return request<{ favorited: boolean }>({
    url: `/favorites/status?type=${type}&refId=${encodeURIComponent(refId)}`,
    auth: true,
  }).then((status) => status.favorited);
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
