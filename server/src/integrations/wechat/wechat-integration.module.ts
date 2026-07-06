import { Module } from '@nestjs/common';
import { WechatIntegrationService } from './wechat-integration.service';

@Module({
  providers: [WechatIntegrationService],
  exports: [WechatIntegrationService],
})
export class WechatIntegrationModule {}
