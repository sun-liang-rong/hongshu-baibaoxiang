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

export interface WatermarkResult {
  id: string;
  source: "xhs" | "douyin";
  sourceUrl: string;
  finalUrl: string;
  noteId: string;
  title: string;
  content: string;
  type: "image" | "video";
  images: string[];
  coverUrl: string;
  videoUrl: string;
  musicUrl: string;
  status: "success";
  createdAt: string;
  quota?: GenerateQuota;
}

export interface CopywritingResult {
  recordId: string;
  title: string;
  body: string;
  tags: string[];
  imageSuggestions: string[];
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
