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
  @ApiOperation({ summary: '解析红薯无水印素材' })
  parse(@Body() dto: ParseWatermarkDto, @CurrentOpenid() openid: string) {
    return this.watermarkService.parse(dto, openid);
  }
}
