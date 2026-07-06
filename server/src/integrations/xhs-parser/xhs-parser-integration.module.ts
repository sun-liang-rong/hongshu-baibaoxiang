import { Module } from '@nestjs/common';
import { XhsParserIntegrationService } from './xhs-parser-integration.service';

@Module({
  providers: [XhsParserIntegrationService],
  exports: [XhsParserIntegrationService],
})
export class XhsParserIntegrationModule {}
