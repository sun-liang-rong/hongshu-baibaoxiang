import { XhsImageResult } from '../xhs-parser/xhs-parser.types';

export interface DouyinParseResult {
  sourceUrl: string;
  finalUrl: string;
  noteId: string;
  title: string;
  content: string;
  type: 'video';
  images: XhsImageResult[];
  coverUrl: string;
  videoUrl: string;
  musicUrl: string;
}

export interface DouyinDetail {
  noteId: string;
  title: string;
  content: string;
  type: 'video';
  images: XhsImageResult[];
  coverUrl: string;
  videoUrl: string;
  musicUrl: string;
}
