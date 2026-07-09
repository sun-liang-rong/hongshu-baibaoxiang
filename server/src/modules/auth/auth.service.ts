import { Injectable } from '@nestjs/common';
import { WechatIntegrationService } from '../../integrations/wechat/wechat-integration.service';

@Injectable()
export class AuthService {
  constructor(private readonly wechatIntegration: WechatIntegrationService) {}

  getOpenid(code: string) {
    return this.wechatIntegration.codeToOpenid(code);
  }
}
