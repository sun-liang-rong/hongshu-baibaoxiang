import {
  XhsImageLike,
  XhsImageResult,
  XhsParseResult,
  XhsStreamMap,
} from './xhs-parser.types';

const IMAGE_HOST = 'https://ci.xiaohongshu.com';
const IMAGE_QUERY = 'imageView2/2/format/png';
const IMAGE_URL_KEYS = ['urlDefault', 'urlSizeLarge', 'urlPre', 'url'] as const;

interface XhsNoteLike {
  title?: string;
  desc?: string;
  type?: string;
  imageList?: XhsImageLike[];
  video?: {
    media?: {
      stream?: XhsStreamMap;
    };
  };
}

export function extractNoteUrl(input: string) {
  if (!input || typeof input !== 'string') {
    throw new Error('请输入红薯分享链接或包含链接的分享文本');
  }

  const match = input.match(/https?:\/\/[^\s，。；、)）\]"']+/i);
  if (!match) {
    throw new Error('未找到有效链接，请复制完整的红薯分享内容');
  }

  return match[0];
}

export function assertXhsUrl(url: string) {
  const { hostname } = new URL(url);
  const allowedHosts = new Set([
    'xhslink.com',
    'www.xhslink.com',
    'xiaohongshu.com',
    'www.xiaohongshu.com',
  ]);

  if (!allowedHosts.has(hostname)) {
    throw new Error('暂时只支持红薯链接');
  }
}

export function normalizeXhsNoteUrl(url: string) {
  const parsedUrl = new URL(url);
  const itemMatch = parsedUrl.pathname.match(
    /\/(?:discovery\/item|explore)\/([^/?#]+)/,
  );
  if (!itemMatch) {
    return url;
  }

  const normalized = new URL(
    `https://www.xiaohongshu.com/explore/${itemMatch[1]}`,
  );
  for (const key of ['xsec_token', 'xsec_source']) {
    const value = parsedUrl.searchParams.get(key);
    if (value) {
      normalized.searchParams.set(key, value);
    }
  }

  return normalized.toString();
}

export function extractNoteId(url: string) {
  const pathname = new URL(url).pathname;
  return pathname.match(/\/(?:discovery\/item|explore)\/([^/?#]+)/)?.[1] || '';
}

export function extractInitialState(html: string): unknown {
  if (!html || typeof html !== 'string') {
    throw new Error('页面 HTML 为空');
  }

  const marker = 'window.__INITIAL_STATE__';
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('未找到 window.__INITIAL_STATE__，页面结构可能已变化');
  }

  const equalsIndex = html.indexOf('=', markerIndex);
  if (equalsIndex === -1) {
    throw new Error('window.__INITIAL_STATE__ 格式异常');
  }

  const startIndex = html.indexOf('{', equalsIndex);
  if (startIndex === -1) {
    throw new Error('window.__INITIAL_STATE__ 缺少对象内容');
  }

  const jsonLike = readBalancedObject(html, startIndex);
  return JSON.parse(normalizeInitialState(jsonLike));
}

export function parseNoteFromInitialState(state: unknown): XhsParseResult {
  const note = findFirstNote(state);
  const imageList = Array.isArray(note.imageList) ? note.imageList : [];
  const videoUrl = pickFirstStreamUrl(note.video?.media?.stream);
  const images = imageList
    .map((image: XhsImageLike, index: number): XhsImageResult | null => {
      const url = buildNoWatermarkImageUrl(image);
      if (!url) {
        return null;
      }

      const livePhotoVideoUrl = pickFirstStreamUrl(
        image.livePhoto?.media?.stream,
      );

      return {
        index: index + 1,
        url,
        source: image.url ? 'url' : image.traceId ? 'traceId' : 'fileId',
        ...(livePhotoVideoUrl ? { livePhotoVideoUrl } : {}),
      };
    })
    .filter((image): image is XhsImageResult => Boolean(image));

  return {
    title: note.title || '',
    content: note.desc || '',
    type: note.type || (videoUrl ? 'video' : 'normal'),
    images,
    videoUrl,
  };
}

export function buildNoWatermarkImageUrl(image: XhsImageLike) {
  if (image?.url) {
    return image.url;
  }

  const imageId = image?.traceId || getFileIdTail(image?.fileId);
  if (!imageId) {
    return '';
  }

  return `${IMAGE_HOST}/${imageId}?${IMAGE_QUERY}`;
}

export function pickFirstStreamUrl(stream?: XhsStreamMap) {
  if (!stream || typeof stream !== 'object') {
    return '';
  }

  for (const codec of ['h264', 'h265', 'av1']) {
    const candidates = Array.isArray(stream[codec]) ? stream[codec] : [];
    const matched = candidates.find(
      (item) => item?.masterUrl || item?.backupUrls?.[0],
    );
    if (matched) {
      return matched.masterUrl || matched.backupUrls?.[0] || '';
    }
  }

  return '';
}

function findFirstNote(state: unknown): XhsNoteLike {
  const root = asRecord(state);
  const noteState = asRecord(root?.note);
  const noteDetailMap = asRecord(noteState?.noteDetailMap);
  if (!noteDetailMap || typeof noteDetailMap !== 'object') {
    throw new Error('未找到笔记数据 note.noteDetailMap');
  }

  const firstNote = Object.values(noteDetailMap)
    .map((item) => asRecord(asRecord(item)?.note))
    .find((note): note is Record<string, unknown> => Boolean(note));
  if (!firstNote) {
    throw new Error('未找到笔记详情');
  }

  return {
    title: getString(firstNote, 'title'),
    desc: getString(firstNote, 'desc'),
    type: getString(firstNote, 'type'),
    imageList: getImageList(firstNote.imageList),
    video: getVideo(firstNote.video),
  };
}

function getVideo(value: unknown): XhsNoteLike['video'] {
  const video = asRecord(value);
  const media = asRecord(video?.media);
  const stream = asXhsStreamMap(media?.stream);

  return stream ? { media: { stream } } : undefined;
}

function getImageList(value: unknown): XhsImageLike[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toXhsImageLike(item))
    .filter((image): image is XhsImageLike => Boolean(image));
}

function toXhsImageLike(value: unknown): XhsImageLike | null {
  const image = asRecord(value);
  if (!image) {
    return null;
  }

  const livePhotoStream = asXhsStreamMap(
    asRecord(asRecord(image.livePhoto)?.media)?.stream,
  );

  return {
    url: getImageUrl(image),
    traceId: getString(image, 'traceId'),
    fileId: getString(image, 'fileId'),
    ...(livePhotoStream
      ? { livePhoto: { media: { stream: livePhotoStream } } }
      : {}),
  };
}

function getImageUrl(image: Record<string, unknown>) {
  for (const key of IMAGE_URL_KEYS) {
    const url = getCleanUrl(image[key]);
    if (url) {
      return url;
    }
  }

  const infoList = Array.isArray(image.infoList) ? image.infoList : [];
  for (const item of infoList) {
    const url = getCleanUrl(asRecord(item)?.url);
    if (url) {
      return url;
    }
  }

  return '';
}

function getCleanUrl(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

function asXhsStreamMap(value: unknown): XhsStreamMap | undefined {
  const stream = asRecord(value);
  if (!stream) {
    return undefined;
  }

  const result: XhsStreamMap = {};
  for (const [codec, candidates] of Object.entries(stream)) {
    if (!Array.isArray(candidates)) {
      continue;
    }

    const items = candidates
      .map((candidate) => {
        const item = asRecord(candidate);
        if (!item) {
          return null;
        }

        return {
          masterUrl: getString(item, 'masterUrl'),
          backupUrls: getStringArray(item.backupUrls),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    result[codec] = items;
  }

  return result;
}

function getString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function getFileIdTail(fileId?: string) {
  if (!fileId || typeof fileId !== 'string') {
    return '';
  }

  return fileId.split('/').filter(Boolean).at(-1) || '';
}

function normalizeInitialState(jsonLike: string) {
  return jsonLike
    .replace(/:\s*undefined(?=[,}])/g, ':null')
    .replace(/:\s*NaN(?=[,}])/g, ':null');
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

  throw new Error('window.__INITIAL_STATE__ 对象未闭合');
}
