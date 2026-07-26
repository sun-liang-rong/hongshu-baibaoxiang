export interface RemoteWatermarkImage {
  url?: string;
  live_photo_url?: string;
  live_photo_video_url?: string;
  [key: string]: unknown;
}

export interface RemoteWatermarkVideo {
  url?: string;
  download_url?: string;
  duration_ms?: number;
  width?: number;
  height?: number;
}

export interface RemoteWatermarkMusic {
  title?: string;
  author?: string;
  url?: string;
}

export interface RemoteWatermarkAuthor {
  id?: string;
  nickname?: string;
  avatar_url?: string;
}

export interface RemoteWatermarkPart {
  page?: number;
  cid?: string;
  title?: string;
  video?: RemoteWatermarkVideo | null;
}

export interface RemoteWatermarkStatistics {
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  favorites?: number | null;
}

export interface RemoteWatermarkData {
  platform?: string;
  id?: string;
  title?: string;
  description?: string;
  author?: RemoteWatermarkAuthor | null;
  cover_url?: string;
  original_url?: string;
  type?: string;
  video?: RemoteWatermarkVideo | null;
  parts?: RemoteWatermarkPart[];
  images?: Array<string | RemoteWatermarkImage>;
  music?: RemoteWatermarkMusic | null;
  statistics?: RemoteWatermarkStatistics | null;
  published_at?: string;
  expires_at?: string;
  [key: string]: unknown;
}

export interface RemoteWatermarkResponse {
  success?: boolean;
  data?: RemoteWatermarkData;
  message?: string;
  error?: string;
  request_id?: string;
}

export interface RemoteWatermarkSuccessResponse {
  success: true;
  data: RemoteWatermarkData;
  request_id: string;
}
