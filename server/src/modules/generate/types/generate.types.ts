export interface TitleGenerateResult {
  recordId: string;
  titles: string[];
}

export interface CopywritingGenerateResult {
  recordId: string;
  title: string;
  body: string;
  tags: string[];
  imageSuggestions: string[];
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
