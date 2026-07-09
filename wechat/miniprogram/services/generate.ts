import { isMockMode } from '../config/env';
import { CopywritingResult, GenerateQuotaResult } from '../types/domain';
import { addHistory, createCopywritingResult } from './mock-store';
import { request } from './request';

interface TitleInput {
  topic: string;
  audience?: string;
  contentType?: string;
  style?: string;
  count?: number;
  referenceTitle?: string;
}

interface CopywritingInput {
  topic: string;
  productName?: string;
  sellingPoints?: string;
  audience?: string;
  style?: string;
  length?: 'short' | 'medium' | 'long';
  includeTags?: boolean;
}

const titleTemplates = [
  '{topic}新手一定要知道的5个细节',
  '我终于把{topic}讲明白了',
  '{topic}避坑指南，看完少走弯路',
  '普通人也能上手的{topic}方法',
  '{topic}真实体验：优点和缺点都说',
  '收藏这份{topic}清单，真的很省时间',
  '{topic}怎么做更容易出效果',
  '做{topic}之前，先看完这篇',
  '{topic}高效流程，适合新手照着做',
  '关于{topic}，这些经验太晚知道了',
  '{topic}同款灵感，一次给你整理好',
  '低成本做好{topic}，关键在这几步',
];

export const titles = (input: TitleInput): Promise<{ recordId: string; titles: string[] }> => {
  if (isMockMode()) {
    const count = Math.max(1, Math.min(input.count || 10, 20));
    const generated = titleTemplates.slice(0, count).map((item) => {
      const suffix = input.style ? `｜${input.style}` : '';
      return item.replace('{topic}', input.referenceTitle || input.topic) + suffix;
    });
    const recordId = `title_${Date.now()}`;

    addHistory({
      id: recordId,
      type: 'title',
      title: input.topic,
      summary: generated[0],
      payload: { titles: generated },
    });

    return Promise.resolve({ recordId, titles: generated });
  }

  return request<{ recordId: string; titles: string[] }>({
    url: '/generate/titles',
    method: 'POST',
    data: input,
    auth: true,
    loadingText: '生成中',
  });
};

export const copywriting = (input: CopywritingInput): Promise<CopywritingResult> => {
  if (isMockMode()) {
    const result = createCopywritingResult(input.topic, input.style, input.length);
    addHistory({
      id: result.recordId,
      type: 'copywriting',
      title: result.title,
      summary: result.body.slice(0, 80),
      payload: result,
    });

    return Promise.resolve(result);
  }

  return request<CopywritingResult>({
    url: '/generate/copywriting',
    method: 'POST',
    data: input,
    auth: true,
    loadingText: '生成中',
  });
};

export const getGenerateQuota = (): Promise<GenerateQuotaResult> => {
  if (isMockMode()) {
    return Promise.resolve({
      watermark: { used: 0, limit: 20, remaining: 20 },
      title: { used: 0, limit: 10, remaining: 10 },
      copywriting: { used: 0, limit: 5, remaining: 5 },
    });
  }

  return request<GenerateQuotaResult>({
    url: '/generate/quota',
    method: 'GET',
    auth: true,
  });
};
