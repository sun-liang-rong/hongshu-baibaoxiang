import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const COPYWRITING_STYLES = [
  '真实分享',
  '种草推荐',
  '干货教程',
  '避坑提醒',
  '探店打卡',
  '好物合集',
  '软广种草',
] as const;

export const COPYWRITING_LENGTHS = ['short', 'medium', 'long'] as const;

export class GenerateCopywritingDto {
  @ApiProperty({
    description: '文案主题',
    example: '夏天通勤防晒穿搭',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty({ message: '请输入要生成文案的主题' })
  topic!: string;

  @ApiPropertyOptional({
    description: '产品名称',
    example: '轻薄防晒衬衫',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  productName?: string;

  @ApiPropertyOptional({
    description: '卖点或重点内容',
    example: '透气、不闷、显瘦、适合通勤',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sellingPoints?: string;

  @ApiPropertyOptional({
    description: '目标人群',
    example: '上班族女生',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  audience?: string;

  @ApiPropertyOptional({
    description: '文案风格',
    enum: COPYWRITING_STYLES,
  })
  @IsOptional()
  @IsIn(COPYWRITING_STYLES)
  style?: (typeof COPYWRITING_STYLES)[number];

  @ApiPropertyOptional({
    description: '文案长度',
    enum: COPYWRITING_LENGTHS,
  })
  @IsOptional()
  @IsIn(COPYWRITING_LENGTHS)
  length?: (typeof COPYWRITING_LENGTHS)[number];

  @ApiPropertyOptional({
    description: '是否生成话题标签',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTags?: boolean;
}
