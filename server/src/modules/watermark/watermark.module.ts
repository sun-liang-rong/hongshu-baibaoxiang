import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { DouyinParserIntegrationModule } from '../../integrations/douyin-parser/douyin-parser-integration.module';
import { XhsParserIntegrationModule } from '../../integrations/xhs-parser/xhs-parser-integration.module';
import { HistoryModule } from '../history/history.module';
import { WatermarkController } from './watermark.controller';
import { WatermarkPlatformResolver } from './watermark-platform.resolver';
import { WatermarkService } from './watermark.service';

@Module({
  imports: [
    XhsParserIntegrationModule,
    DouyinParserIntegrationModule,
    ConfigModule,
    DatabaseModule,
    HistoryModule,
  ],
  controllers: [WatermarkController],
  providers: [WatermarkService, WatermarkPlatformResolver],
  exports: [WatermarkService],
})
export class WatermarkModule {}
