export type AiResponseFormat = 'json' | 'text';

export interface AiGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: AiResponseFormat;
}

export interface AiGenerateMetadata {
  provider: string;
  model: string;
}

export interface AiGenerateResult<T = string> {
  content: T;
  rawContent: string;
  metadata: AiGenerateMetadata;
}

export interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}
