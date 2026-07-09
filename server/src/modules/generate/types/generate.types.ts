export interface GenerateQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface TitleGenerateResult {
  recordId: string;
  titles: string[];
  quota: GenerateQuota;
}

export interface CopywritingGenerateResult {
  recordId: string;
  title: string;
  body: string;
  tags: string[];
  imageSuggestions: string[];
  quota: GenerateQuota;
}

export interface GenerateQuotaResult {
  watermark: GenerateQuota;
  title: GenerateQuota;
  copywriting: GenerateQuota;
}

export interface TitleAiResponse {
  titles: string[];
}

export interface CopywritingAiResponse {
  title: string;
  body: string;
  tags?: string[];
  imageSuggestions?: string[];
}
