import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiProviderIntegrationModule } from '../../integrations/ai-provider/ai-provider-integration.module';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';

@Module({
  imports: [AiProviderIntegrationModule, ConfigModule],
  controllers: [GenerateController],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
