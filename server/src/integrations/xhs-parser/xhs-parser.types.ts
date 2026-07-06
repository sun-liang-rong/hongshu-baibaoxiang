export type XhsMediaSource = 'url' | 'traceId' | 'fileId';

export interface XhsImageResult {
  index: number;
  url: string;
  source: XhsMediaSource;
  livePhotoVideoUrl?: string;
}

export interface XhsParseResult {
  title: string;
  content: string;
  type: string;
  images: XhsImageResult[];
  videoUrl: string;
}

export interface XhsFullParseResult extends XhsParseResult {
  sourceUrl: string;
  finalUrl: string;
  noteId: string;
}

export interface XhsImageLike {
  url?: string;
  traceId?: string;
  fileId?: string;
  livePhoto?: {
    media?: {
      stream?: XhsStreamMap;
    };
  };
}

export interface XhsStreamItem {
  masterUrl?: string;
  backupUrls?: string[];
}

export type XhsStreamMap = Record<string, XhsStreamItem[] | undefined>;
