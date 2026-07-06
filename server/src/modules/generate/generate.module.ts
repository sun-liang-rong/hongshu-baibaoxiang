import { Module } from '@nestjs/common';
import { AiProviderIntegrationModule } from '../../integrations/ai-provider/ai-provider-integration.module';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';

@Module({
  imports: [AiProviderIntegrationModule],
  controllers: [GenerateController],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
