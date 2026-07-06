import { isMockMode } from '../config/env';
import { FavoriteItem, FavoritePayload, RecordType } from '../types/domain';
import { deleteFavorite, isFavorited, listFavorites, toggleFavorite } from './mock-store';
import { request } from './request';

export const list = (type?: RecordType): Promise<FavoriteItem[]> => {
  if (isMockMode()) {
    return Promise.resolve(listFavorites(type));
  }

  return request<FavoriteItem[]>({
    url: type ? `/favorites?type=${type}` : '/favorites',
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

  return false;
};

