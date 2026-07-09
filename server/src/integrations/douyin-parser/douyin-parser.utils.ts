import { DouyinDetail } from './douyin-parser.types';

const UNIVERSAL_STATE_MARKER = '__UNIVERSAL_DATA_FOR_REHYDRATION__';

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
  const patterns = [
    /\/share\/video\/(\d+)/,
    /\/video\/(\d+)/,
    /\/share\/note\/(\d+)/,
    /\/note\/(\d+)/,
    /\/discover\/?\?.*\bmodal_id=(\d+)/,
  ];

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

export function normalizeDouyinVideoUrl(url: string, awemeId?: string) {
  const id = awemeId || extractAwemeId(url);
  return `https://www.douyin.com/video/${id}`;
}

export function buildNoWatermarkUrl(url: string) {
  if (!url) {
    return '';
  }

  return url.replace('/playwm/', '/play/').replace('playwm/?', 'play/?');
}

export function extractVideoFromXgContainer(
  html: string,
): Partial<DouyinDetail> {
  const container =
    html.match(
      /<[^>]+class=["'][^"']*\bxg-video-container\b[^"']*["'][^>]*>[\s\S]*?<\/(?:div|xg-video)>/i,
    )?.[0] || html;
  const videoTag = container.match(/<video\b[\s\S]*?>/i)?.[0];
  const videoUrl = buildNoWatermarkUrl(
    normalizeUrl(
      videoTag?.match(/\s(?:src|currentSrc)=["']([^"']+)["']/i)?.[1],
    ),
  );
  const coverUrl = normalizeUrl(
    videoTag?.match(/\sposter=["']([^"']+)["']/i)?.[1],
  );

  if (!videoUrl) {
    throw new Error('未从 xg-video-container 提取到视频地址');
  }

  return {
    type: 'video',
    images: [],
    videoUrl,
    coverUrl,
  };
}

export function extractDouyinDetail(response: unknown): DouyinDetail {
  const root = asRecord(response);
  const item = asRecord(getArray(root, 'item_list')[0]);
  if (!item) {
    throw new Error('抖音详情数据为空');
  }

  return normalizeDouyinItem(item);
}

export function extractDouyinDetailFromHtml(
  html: string,
  awemeId: string,
): DouyinDetail {
  for (const state of extractJsonStates(html)) {
    const item = findDouyinItem(state, awemeId);
    if (item) {
      return normalizeDouyinItem(item);
    }
  }

  throw new Error('未从抖音页面提取到视频详情');
}

function normalizeDouyinItem(item: Record<string, unknown>): DouyinDetail {
  const video = getRecord(item, 'video');
  const music = getRecord(item, 'music');
  const watermarkedVideoUrl =
    firstUrlFromAnyPath(video, ['play_addr', 'url_list']) ||
    firstUrlFromAnyPath(video, ['playAddr', 'urlList']) ||
    firstUrlFromAnyPath(video, ['playAddr']) ||
    firstUrlFromAnyPath(video, ['playApi']) ||
    firstUrlFromAnyPath(video, ['download_addr', 'url_list']) ||
    firstUrlFromAnyPath(video, ['downloadAddr', 'urlList']) ||
    firstUrlFromAnyPath(video, ['downloadAddr']) ||
    firstUrlFromBitRate(video);
  const noWatermarkVideoUrl = buildNoWatermarkUrl(watermarkedVideoUrl);
  if (!noWatermarkVideoUrl) {
    throw new Error('未找到抖音视频播放地址');
  }

  return {
    noteId: getString(item, 'aweme_id') || getString(item, 'awemeId'),
    title: getString(item, 'title'),
    content: getString(item, 'desc') || getString(item, 'description'),
    type: 'video',
    images: [],
    coverUrl:
      firstUrlFromAnyPath(video, ['dynamic_cover', 'url_list']) ||
      firstUrlFromAnyPath(video, ['dynamicCover', 'urlList']) ||
      firstUrlFromAnyPath(video, ['dynamicCover']) ||
      firstUrlFromAnyPath(video, ['origin_cover', 'url_list']) ||
      firstUrlFromAnyPath(video, ['originCover', 'urlList']) ||
      firstUrlFromAnyPath(video, ['originCover']) ||
      firstUrlFromAnyPath(video, ['cover', 'url_list']) ||
      firstUrlFromAnyPath(video, ['cover', 'urlList']) ||
      firstUrlFromAnyPath(video, ['cover']),
    videoUrl: noWatermarkVideoUrl,
    musicUrl:
      firstUrlFromAnyPath(music, ['play_url', 'url_list']) ||
      firstUrlFromAnyPath(music, ['playUrl', 'urlList']) ||
      firstUrlFromAnyPath(music, ['playUrl']),
  };
}

function firstUrl(urls?: string[]) {
  return Array.isArray(urls) ? urls.find(Boolean) || '' : '';
}

function firstUrlFromAnyPath(
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

  return firstUrlFromAny(current);
}

function firstUrlFromBitRate(video: Record<string, unknown> | null) {
  const lists = [video?.bit_rate, video?.bitRateList];
  for (const list of lists) {
    if (!Array.isArray(list)) {
      continue;
    }

    for (const item of list) {
      const record = asRecord(item);
      const url =
        firstUrlFromAnyPath(record, ['play_addr', 'url_list']) ||
        firstUrlFromAnyPath(record, ['playAddr', 'urlList']) ||
        firstUrlFromAnyPath(record, ['playAddr']);
      if (url) {
        return url;
      }
    }
  }

  return '';
}

function firstUrlFromAny(value: unknown): string {
  const normalized = normalizeUrl(value);
  if (normalized) {
    return normalized;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = firstUrlFromAny(item);
      if (url) {
        return url;
      }
    }
    return '';
  }

  const record = asRecord(value);
  if (!record) {
    return '';
  }

  for (const key of ['url_list', 'urlList', 'urls', 'url']) {
    const url = firstUrlFromAny(record[key]);
    if (url) {
      return url;
    }
  }

  return '';
}

function normalizeUrl(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const url = value.trim().replace(/&amp;/g, '&');
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return /^https?:\/\//i.test(url) ? url : '';
}

function extractJsonStates(html: string): unknown[] {
  const states: unknown[] = [];
  const renderData = html.match(
    /<script[^>]+id=["']RENDER_DATA["'][^>]*>([\s\S]*?)<\/script>/i,
  )?.[1];
  if (renderData) {
    states.push(parseJsonState(decodeHtml(renderData)));
  }

  const universalData = html.match(
    /<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i,
  )?.[1];
  if (universalData) {
    states.push(parseJsonState(decodeHtml(universalData)));
  }

  const markerIndex = html.indexOf(UNIVERSAL_STATE_MARKER);
  if (markerIndex !== -1) {
    const equalsIndex = html.indexOf('=', markerIndex);
    const startIndex = equalsIndex === -1 ? -1 : html.indexOf('{', equalsIndex);
    if (startIndex !== -1) {
      states.push(parseJsonState(readBalancedObject(html, startIndex)));
    }
  }

  return states.filter((state) => state !== null);
}

function parseJsonState(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      return null;
    }
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .trim();
}

function findDouyinItem(
  value: unknown,
  awemeId: string,
  seen = new WeakSet<object>(),
): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    let fallback: Record<string, unknown> | null = null;
    for (const item of value) {
      const matched = findDouyinItem(item, awemeId, seen);
      if (matched && getDouyinItemId(matched) === awemeId) {
        return matched;
      }
      fallback = fallback || matched;
    }
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const id = getDouyinItemId(record);
  if (isDouyinItem(record) && (!awemeId || !id || id === awemeId)) {
    return record;
  }

  let fallback: Record<string, unknown> | null = null;
  for (const child of Object.values(record)) {
    const matched = findDouyinItem(child, awemeId, seen);
    if (matched && getDouyinItemId(matched) === awemeId) {
      return matched;
    }
    fallback = fallback || matched;
  }

  return fallback;
}

function getDouyinItemId(record: Record<string, unknown>) {
  return (
    getString(record, 'aweme_id') ||
    getString(record, 'awemeId') ||
    getString(record, 'id')
  );
}

function isDouyinItem(record: Record<string, unknown>) {
  const video = asRecord(record.video);
  if (!video) {
    return false;
  }

  return Boolean(
    firstUrlFromAnyPath(video, ['play_addr', 'url_list']) ||
    firstUrlFromAnyPath(video, ['playAddr', 'urlList']) ||
    firstUrlFromAnyPath(video, ['playAddr']) ||
    firstUrlFromAnyPath(video, ['playApi']) ||
    firstUrlFromAnyPath(video, ['download_addr', 'url_list']) ||
    firstUrlFromAnyPath(video, ['downloadAddr', 'urlList']) ||
    firstUrlFromAnyPath(video, ['downloadAddr']) ||
    firstUrlFromBitRate(video) ||
    firstUrlFromAnyPath(video, ['cover', 'url_list']) ||
    firstUrlFromAnyPath(video, ['cover', 'urlList']) ||
    firstUrlFromAnyPath(video, ['cover']),
  );
}

function readBalancedObject(text: string, startIndex: number) {
  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return '{}';
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
