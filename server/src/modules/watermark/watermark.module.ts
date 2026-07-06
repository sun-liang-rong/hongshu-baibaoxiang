import { Module } from '@nestjs/common';
import { DouyinParserIntegrationModule } from '../../integrations/douyin-parser/douyin-parser-integration.module';
import { XhsParserIntegrationModule } from '../../integrations/xhs-parser/xhs-parser-integration.module';
import { WatermarkController } from './watermark.controller';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';
import { WatermarkService } from './watermark.service';

@Module({
  imports: [XhsParserIntegrationModule, DouyinParserIntegrationModule],
  controllers: [WatermarkController],
  providers: [WatermarkService, WatermarkPlatformResolver],
  exports: [WatermarkService],
})
export class WatermarkModule {}
