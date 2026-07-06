import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

export const TITLE_CONTENT_TYPES = [
  '种草推荐',
  '避坑经验',
  '干货教程',
  '探店打卡',
  '好物测评',
  '合集推荐',
  '对比测评',
  '新手必看',
] as const;

export const TITLE_STYLES = [
  '真实分享',
  '轻松口语',
  '干货实用',
  '情绪共鸣',
  '强吸引力',
  '数字清单',
] as const;

export class GenerateTitlesDto {
  @ApiProperty({
    description: '标题主题',
    example: '新手做小红书账号',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsNotEmpty({ message: '请输入要生成标题的主题' })
  topic!: string;

  @ApiPropertyOptional({
    description: '目标人群',
    example: '宝妈、副业新手',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  audience?: string;

  @ApiPropertyOptional({
    description: '内容类型',
    enum: TITLE_CONTENT_TYPES,
  })
  @IsOptional()
  @IsIn(TITLE_CONTENT_TYPES)
  contentType?: (typeof TITLE_CONTENT_TYPES)[number];

  @ApiPropertyOptional({
    description: '标题风格',
    enum: TITLE_STYLES,
  })
  @IsOptional()
  @IsIn(TITLE_STYLES)
  style?: (typeof TITLE_STYLES)[number];

  @ApiPropertyOptional({
    description: '生成数量',
    example: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @ApiPropertyOptional({
    description: '参考标题',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceTitle?: string;
}
