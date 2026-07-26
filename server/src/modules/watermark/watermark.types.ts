import { RemoteWatermarkData } from '../../integrations/watermark-parser/watermark-parser.types';
import { GenerateQuota } from '../generate/types/generate.types';

export interface WatermarkParseResponse {
  success: true;
  data: RemoteWatermarkData;
  request_id: string;
  quota?: GenerateQuota;
}
