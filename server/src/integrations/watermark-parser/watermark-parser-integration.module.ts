import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WatermarkParserIntegrationService } from './watermark-parser-integration.service';

@Module({
  imports: [ConfigModule],
  providers: [WatermarkParserIntegrationService],
  exports: [WatermarkParserIntegrationService],
})
export class WatermarkParserIntegrationModule {}
