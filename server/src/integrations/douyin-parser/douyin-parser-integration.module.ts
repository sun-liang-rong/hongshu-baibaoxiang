import { Module } from '@nestjs/common';
import { DouyinParserIntegrationService } from './douyin-parser-integration.service';

@Module({
  providers: [DouyinParserIntegrationService],
  exports: [DouyinParserIntegrationService],
})
export class DouyinParserIntegrationModule {}
