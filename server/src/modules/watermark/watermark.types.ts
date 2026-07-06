import { XhsImageResult } from '../../integrations/xhs-parser/xhs-parser.types';

export interface WatermarkParseResponse {
  id: string;
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
  createdAt: string;
}
