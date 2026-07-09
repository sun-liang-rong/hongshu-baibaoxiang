import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class WechatOpenidDto {
  @ApiProperty({ description: 'wx.login 返回的 code' })
  @IsString()
  @IsNotEmpty()
  code!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('openid')
  @ApiOperation({ summary: '通过微信 code 获取 openid' })
  getOpenid(@Body() dto: WechatOpenidDto) {
    return this.authService.getOpenid(dto.code);
  }
}
