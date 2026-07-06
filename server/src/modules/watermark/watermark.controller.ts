import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParseWatermarkDto } from './dto/parse-watermark.dto';
import { WatermarkService } from './watermark.service';

@ApiTags('watermark')
@Controller('watermark')
export class WatermarkController {
  constructor(private readonly watermarkService: WatermarkService) {}

  @Post('parse')
  @ApiOperation({ summary: '解析红薯无水印素材' })
  parse(@Body() dto: ParseWatermarkDto) {
    return this.watermarkService.parse(dto);
  }
}
