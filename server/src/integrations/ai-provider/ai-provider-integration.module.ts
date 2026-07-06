import { Module } from '@nestjs/common';
import { AiProviderIntegrationService } from './ai-provider-integration.service';

@Module({
  providers: [AiProviderIntegrationService],
  exports: [AiProviderIntegrationService],
})
export class AiProviderIntegrationModule {}
