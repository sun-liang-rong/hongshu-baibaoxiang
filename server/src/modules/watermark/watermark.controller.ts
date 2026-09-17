import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOpenid } from '../../common/decorators/current-openid.decorator';
import { ParseWatermarkDto } from './dto/parse-watermark.dto';
import { WatermarkService } from './watermark.service';

@ApiTags('watermark')
@Controller('watermark')
export class WatermarkController {
  constructor(private readonly watermarkService: WatermarkService) {}

  @Get('quota')
  @ApiOperation({ summary: '查询今日去水印解析次数额度' })
  getQuota(@CurrentOpenid() openid: string) {
    return this.watermarkService.getQuota(openid);
  }

  @Post('parse')
  @ApiOperation({ summary: '解析平台无水印素材' })
  async parse(@Body() dto: ParseWatermarkDto, @CurrentOpenid() openid: string) {
    // 添加详细日志
    console.log('=== 收到去水印请求 ===');
    console.log('openid:', openid);
    console.log('请求体:', JSON.stringify(dto));
    console.log('text字段类型:', typeof dto.text);
    console.log('text字段长度:', dto.text?.length);
    console.log('text字段内容:', dto.text);
    console.log('======================');

    try {
      const result = await this.watermarkService.parse(dto, openid);
      console.log('✅ 解析成功:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('❌ 解析失败:', error);
      console.error('错误类型:', error?.constructor?.name);
      console.error('错误消息:', error?.message);
      console.error('错误堆栈:', error?.stack);
      throw error;
    }
  }
}
