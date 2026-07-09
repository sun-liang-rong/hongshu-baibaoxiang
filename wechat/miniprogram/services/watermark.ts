import { isMockMode } from "../config/env";
import { GenerateQuota, WatermarkResult } from "../types/domain";
import { addHistory, createWatermarkResult } from "./mock-store";
import { request } from "./request";

type WatermarkSource = "xhs" | "douyin";

interface WatermarkImagePayload {
  url?: string;
}

type WatermarkParsePayload = Omit<WatermarkResult, "images"> & {
  images?: Array<string | WatermarkImagePayload>;
};

const normalizeWatermarkResult = (
  result: WatermarkParsePayload,
): WatermarkResult => {
  const images = (result.images || [])
    .map((image) => (typeof image === "string" ? image : image.url || ""))
    .filter(Boolean);

  return {
    ...result,
    images,
    coverUrl: result.coverUrl || images[0] || "",
  };
};

export const parse = (input: {
  text: string;
  source?: WatermarkSource;
}): Promise<WatermarkResult> => {
  if (isMockMode()) {
    const result = createWatermarkResult(input.text);
    addHistory({
      id: result.id,
      type: "watermark",
      title: result.title,
      summary: result.content,
      payload: result,
    });
    return Promise.resolve(result);
  }

  return request<WatermarkParsePayload>({
    url: "/watermark/parse",
    method: "POST",
    data: input,
    auth: true,
    loadingText: "解析中",
  }).then(normalizeWatermarkResult);
};

export const getQuota = (): Promise<GenerateQuota> => {
  if (isMockMode()) {
    return Promise.resolve({
      used: 0,
      limit: 20,
      remaining: 20,
    });
  }

  return request<GenerateQuota>({
    url: "/watermark/quota",
    auth: true,
  });
};
