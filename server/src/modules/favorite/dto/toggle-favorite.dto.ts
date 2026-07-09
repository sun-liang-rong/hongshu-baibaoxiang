import { ApiProperty } from '@nestjs/swagger';
import { GenerateType } from '@prisma/client/index';
import {
  IsDefined,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ToggleFavoriteDto {
  @ApiProperty({ enum: GenerateType })
  @IsIn(Object.values(GenerateType))
  type!: GenerateType;

  @ApiProperty({ description: '业务引用 ID' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  refId!: string;

  @ApiProperty({ description: '收藏标题' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  title!: string;

  @ApiProperty({ description: '收藏摘要' })
  @IsString()
  @MaxLength(1000)
  summary!: string;

  @ApiProperty({ description: '收藏内容快照' })
  @IsDefined()
  payload!: unknown;
}
