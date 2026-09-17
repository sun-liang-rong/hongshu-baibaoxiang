import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { WatermarkParserIntegrationModule } from '../../integrations/watermark-parser/watermark-parser-integration.module';
import { HistoryModule } from '../history/history.module';
import { DownloadController } from './download.controller';
import { WatermarkController } from './watermark.controller';
import { WatermarkService } from './watermark.service';

@Module({
  imports: [
    WatermarkParserIntegrationModule,
    ConfigModule,
    DatabaseModule,
    HistoryModule,
  ],
  controllers: [WatermarkController, DownloadController],
  providers: [WatermarkService],
  exports: [WatermarkService],
})
export class WatermarkModule {}
