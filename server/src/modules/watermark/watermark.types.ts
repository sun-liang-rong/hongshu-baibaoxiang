import { XhsImageResult } from '../../integrations/xhs-parser/xhs-parser.types';

export interface WatermarkParseResponse {
  source: string;
  sourceUrl: string;
  finalUrl: string;
  noteId: string;
  title: string;
  content: string;
  type: string;
  images: XhsImageResult[];
  coverUrl?: string;
  videoUrl: string;
  musicUrl?: string;
  status: 'success';
}
