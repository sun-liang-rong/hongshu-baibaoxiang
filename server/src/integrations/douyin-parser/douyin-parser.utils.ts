import { DouyinDetail } from './douyin-parser.types';

export function extractDouyinUrl(input: string) {
  if (!input || typeof input !== 'string') {
    throw new Error('请输入抖音分享链接或包含链接的分享文本');
  }

  const match = input.match(/https?:\/\/[^\s，。；、)）\]"']+/i);
  if (!match) {
    throw new Error('未找到有效链接，请复制完整的抖音分享内容');
  }

  const url = match[0];
  if (!isDouyinUrl(url)) {
    throw new Error('暂时只支持抖音链接');
  }

  return url;
}

export function isDouyinUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return [
      'douyin.com',
      'www.douyin.com',
      'v.douyin.com',
      'iesdouyin.com',
      'www.iesdouyin.com',
      'aweme.snssdk.com',
    ].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function extractAwemeId(url: string) {
  const parsed = new URL(url);
  const patterns = [/\/share\/video\/(\d+)/, /\/video\/(\d+)/, /\/note\/(\d+)/];

  for (const pattern of patterns) {
    const matched = parsed.pathname.match(pattern);
    if (matched?.[1]) {
      return matched[1];
    }
  }

  const searchId =
    parsed.searchParams.get('item_ids') ||
    parsed.searchParams.get('item_id') ||
    parsed.searchParams.get('aweme_id') ||
    parsed.searchParams.get('modal_id');

  if (searchId) {
    return searchId;
  }

  throw new Error('未提取到抖音视频 ID');
}

export function buildNoWatermarkUrl(url: string) {
  if (!url) {
    return '';
  }

  return url.replace('/playwm/', '/play/').replace('playwm/?', 'play/?');
}

export function extractDouyinDetail(response: unknown): DouyinDetail {
  const root = asRecord(response);
  const item = asRecord(getArray(root, 'item_list')[0]);
  if (!item) {
    throw new Error('抖音详情数据为空');
  }

  const video = getRecord(item, 'video');
  const music = getRecord(item, 'music');
  const watermarkedVideoUrl = firstUrlFromRecordPath(video, [
    'play_addr',
    'url_list',
  ]);
  const noWatermarkVideoUrl = buildNoWatermarkUrl(watermarkedVideoUrl);
  if (!noWatermarkVideoUrl) {
    throw new Error('未找到抖音视频播放地址');
  }

  return {
    noteId: getString(item, 'aweme_id'),
    title: '',
    content: getString(item, 'desc'),
    type: 'video',
    images: [],
    coverUrl:
      firstUrlFromRecordPath(video, ['dynamic_cover', 'url_list']) ||
      firstUrlFromRecordPath(video, ['origin_cover', 'url_list']) ||
      firstUrlFromRecordPath(video, ['cover', 'url_list']),
    videoUrl: noWatermarkVideoUrl,
    musicUrl: firstUrlFromRecordPath(music, ['play_url', 'url_list']),
  };
}

function firstUrl(urls?: string[]) {
  return Array.isArray(urls) ? urls.find(Boolean) || '' : '';
}

function firstUrlFromRecordPath(
  source: Record<string, unknown> | null,
  path: string[],
): string {
  let current: unknown = source;

  for (const key of path) {
    const record = asRecord(current);
    if (!record) {
      return '';
    }

    current = record[key];
  }

  return firstUrl(toStringArray(current));
}

function getRecord(
  source: Record<string, unknown> | null,
  key: string,
): Record<string, unknown> | null {
  if (!source) {
    return null;
  }

  return asRecord(source[key]);
}

function getArray(
  source: Record<string, unknown> | null,
  key: string,
): unknown[] {
  if (!source) {
    return [];
  }

  const value = source[key];
  return Array.isArray(value) ? value : [];
}

function getString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }

  return '';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}
