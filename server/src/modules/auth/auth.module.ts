import { Module } from '@nestjs/common';
import { WechatIntegrationModule } from '../../integrations/wechat/wechat-integration.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [WechatIntegrationModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
