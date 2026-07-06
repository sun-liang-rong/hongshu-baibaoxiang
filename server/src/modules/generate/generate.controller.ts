import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GenerateCopywritingDto } from './dto/generate-copywriting.dto';
import { GenerateTitlesDto } from './dto/generate-titles.dto';
import { GenerateService } from './generate.service';

@ApiTags('generate')
@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post('titles')
  @ApiOperation({ summary: '生成小红书风格标题' })
  generateTitles(@Body() dto: GenerateTitlesDto) {
    return this.generateService.generateTitles(dto);
  }

  @Post('copywriting')
  @ApiOperation({ summary: '生成小红书风格文案' })
  generateCopywriting(@Body() dto: GenerateCopywritingDto) {
    return this.generateService.generateCopywriting(dto);
  }
}
