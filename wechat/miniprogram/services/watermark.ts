import { isMockMode } from "../config/env";
import {
  GenerateQuota,
  WatermarkData,
  WatermarkImage,
  WatermarkResult,
} from "../types/domain";
import {
  addHistory,
  consumeMockQuota,
  createWatermarkResult,
  getMockQuota,
} from "./mock-store";
import { request } from "./request";

interface LegacyWatermarkResult {
  id?: string;
  source?: string;
  sourceUrl?: string;
  finalUrl?: string;
  noteId?: string;
  title?: string;
  content?: string;
  type?: string;
  images?: Array<string | WatermarkImage>;
  coverUrl?: string;
  videoUrl?: string;
  musicUrl?: string;
  quota?: GenerateQuota;
}

export const normalizeWatermarkResult = (input: unknown): WatermarkResult => {
  const current = input as Partial<WatermarkResult>;
  if (current.success === true && current.data) {
    return {
      success: true,
      data: normalizeWatermarkData(current.data),
      request_id: current.request_id || "",
      ...(current.quota ? { quota: current.quota } : {}),
    };
  }

  const legacy = (input || {}) as LegacyWatermarkResult;
  const id = legacy.noteId || legacy.id || "";
  return {
    success: true,
    data: normalizeWatermarkData({
      platform: legacy.source || "unknown",
      type: legacy.type || (legacy.videoUrl ? "video" : "image"),
      id,
      title: legacy.title || "",
      description: legacy.content || legacy.title || "",
      author: null,
      cover_url: legacy.coverUrl || "",
      video: legacy.videoUrl
        ? {
            url: legacy.videoUrl,
            download_url: "",
            duration_ms: 0,
            width: 0,
            height: 0,
          }
        : null,
      parts: [],
      images: legacy.images || [],
      music: legacy.musicUrl ? { url: legacy.musicUrl } : null,
      statistics: null,
      published_at: "",
      original_url: legacy.finalUrl || legacy.sourceUrl || "",
      expires_at: "",
    }),
    request_id: "",
    ...(legacy.quota ? { quota: legacy.quota } : {}),
  };
};

export const getWatermarkRefId = (result: WatermarkResult) =>
  [result.data.platform, result.data.id].filter(Boolean).join("_") ||
  result.request_id;

export const getWatermarkDescription = (result: WatermarkResult) =>
  result.data.description || result.data.title;

export const getWatermarkTitle = (result: WatermarkResult) =>
  result.data.title ||
  [result.data.platform, result.data.id].filter(Boolean).join(" ") ||
  "解析结果";

export const getWatermarkImageUrls = (result: WatermarkResult) =>
  result.data.images
    .map((image) => (typeof image === "string" ? image : image.url || ""))
    .filter(Boolean);

export const parse = (input: { text: string }): Promise<WatermarkResult> => {
  if (isMockMode()) {
    if (getMockQuota("watermark").remaining <= 0) {
      return Promise.reject(new Error("今日解析次数已用完，明天再来试试"));
    }

    const result: WatermarkResult = {
      ...createWatermarkResult(input.text),
      quota: consumeMockQuota("watermark"),
    };
    addHistory({
      id: getWatermarkRefId(result),
      type: "watermark",
      title: result.data.title,
      summary: getWatermarkDescription(result),
      payload: result,
    });
    return Promise.resolve(result);
  }

  return request<WatermarkResult>({
    url: "/watermark/parse",
    method: "POST",
    data: input,
    auth: true,
    loadingText: "解析中",
    timeout: 35000,
  }).then(normalizeWatermarkResult);
};

export const getQuota = (): Promise<GenerateQuota> => {
  if (isMockMode()) {
    return Promise.resolve(getMockQuota("watermark"));
  }

  return request<GenerateQuota>({
    url: "/watermark/quota",
    auth: true,
  });
};

const normalizeWatermarkData = (
  data: Partial<WatermarkData>,
): WatermarkData => ({
  ...data,
  platform: data.platform || "unknown",
  type: data.type || (data.video ? "video" : "image"),
  id: data.id || "",
  title: data.title || "",
  description: data.description || data.title || "",
  author: data.author || null,
  cover_url: data.cover_url || "",
  video: data.video || null,
  parts: data.parts || [],
  images: data.images || [],
  music: data.music || null,
  statistics: data.statistics || null,
  published_at: data.published_at || "",
  original_url: data.original_url || "",
  expires_at: data.expires_at || "",
});
