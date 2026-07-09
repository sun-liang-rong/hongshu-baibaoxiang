import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WechatCodeSession {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

@Injectable()
export class WechatIntegrationService {
  private readonly logger = new Logger(WechatIntegrationService.name);

  constructor(private readonly configService: ConfigService) {}

  async codeToOpenid(code: string) {
    const appId = this.configService.get<string>('wechat.appId');
    const appSecret = this.configService.get<string>('wechat.appSecret');

    if (!appId || !appSecret) {
      throw new BadGatewayException('微信小程序配置缺失');
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appId);
    url.searchParams.set('secret', appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const response = await fetch(url);
    const data = (await response.json()) as WechatCodeSession;

    if (!response.ok || !data.openid) {
      const message =
        data.errmsg || `微信 openid 获取失败，状态码 ${response.status}`;
      this.logger.warn(`jscode2session failed: ${message}`);
      throw new BadGatewayException(message);
    }

    return {
      openid: data.openid,
      unionid: data.unionid || '',
    };
  }
}
