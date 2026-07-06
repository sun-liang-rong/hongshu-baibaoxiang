import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ParseWatermarkDto {
  @ApiProperty({
    description: '红薯分享文本或链接',
    example: '有点好玩呀 http://xhslink.com/o/7RVbLuOxlIq 去红薯看看',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({
    description: '平台来源，一期仅支持 xhs',
    default: 'xhs',
  })
  @IsOptional()
  @IsIn(['xhs', 'douyin'])
  source?: 'xhs' | 'douyin';
}
