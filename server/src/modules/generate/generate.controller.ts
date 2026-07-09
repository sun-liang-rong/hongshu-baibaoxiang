import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOpenid } from '../../common/decorators/current-openid.decorator';
import { GenerateCopywritingDto } from './dto/generate-copywriting.dto';
import { GenerateTitlesDto } from './dto/generate-titles.dto';
import { GenerateService } from './generate.service';

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Get('quota')
  @ApiOperation({ summary: '查询今日生成次数额度' })
  getQuota(@CurrentOpenid() openid: string) {
    return this.generateService.getQuota(openid);
  }

  @Post('titles')
  @ApiOperation({ summary: '生成小红书风格标题' })
  generateTitles(
    @Body() dto: GenerateTitlesDto,
    @CurrentOpenid() openid: string,
  ) {
    return this.generateService.generateTitles(dto, openid);
  }

  @Post('copywriting')
  @ApiOperation({ summary: '生成小红书风格文案' })
  generateCopywriting(
    @Body() dto: GenerateCopywritingDto,
    @CurrentOpenid() openid: string,
  ) {
    return this.generateService.generateCopywriting(dto, openid);
  }
}
