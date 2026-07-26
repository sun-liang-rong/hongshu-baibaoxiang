export type RecordType = "watermark" | "title" | "copywriting";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface GenerateQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface GenerateQuotaResult {
  watermark: GenerateQuota;
  title: GenerateQuota;
  copywriting: GenerateQuota;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string;
  pageSize: number;
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
}

export interface WatermarkAuthor {
  id: string;
  nickname: string;
  avatar_url: string;
}

export interface WatermarkVideo {
  url: string;
  download_url: string;
  duration_ms: number;
  width: number;
  height: number;
}

export interface WatermarkPart {
  page: number;
  cid: string;
  title: string;
  video: WatermarkVideo | null;
}

export interface WatermarkImage {
  url: string;
  download_url?: string;
  width?: number;
  height?: number;
  live_photo_url?: string;
  live_photo_video_url?: string;
  [key: string]: unknown;
}

export interface WatermarkMusic {
  title?: string;
  author?: string;
  url?: string;
}

export interface WatermarkStatistics {
  likes: number | null;
  comments: number | null;
  shares: number | null;
  favorites: number | null;
}

export interface WatermarkData {
  platform: string;
  type: string;
  id: string;
  title: string;
  description: string;
  author: WatermarkAuthor | null;
  cover_url: string;
  video: WatermarkVideo | null;
  parts: WatermarkPart[];
  images: Array<string | WatermarkImage>;
  music: WatermarkMusic | null;
  statistics: WatermarkStatistics | null;
  published_at: string;
  original_url: string;
  expires_at: string;
  [key: string]: unknown;
}

export interface WatermarkResult {
  success: true;
  data: WatermarkData;
  request_id: string;
  quota?: GenerateQuota;
}

export interface CopywritingResult {
  recordId: string;
  title: string;
  body: string;
  tags: string[];
  imageSuggestions: string[];
  quota?: GenerateQuota;
}

export interface HistoryItem {
  id: string;
  type: RecordType;
  title: string;
  summary: string;
  payload: WatermarkResult | { titles: string[] } | CopywritingResult;
  createdAt: string;
}

export interface FavoritePayload {
  type: RecordType;
  refId: string;
  title: string;
  summary: string;
  payload: WatermarkResult | string | CopywritingResult;
}

export interface FavoriteItem extends FavoritePayload {
  id: string;
  createdAt: string;
}
