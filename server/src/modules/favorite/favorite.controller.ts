import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOpenid } from '../../common/decorators/current-openid.decorator';
import { parseRecordType } from '../common/record-type';
import { ToggleFavoriteDto } from './dto/toggle-favorite.dto';
import { FavoriteService } from './favorite.service';

@ApiTags('favorite')
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Get()
  @ApiOperation({ summary: '获取当前 openid 的收藏' })
  list(
    @CurrentOpenid() openid: string,
    @Query('type') type?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoriteService.list(openid, parseRecordType(type), {
      cursor,
      limit,
    });
  }

  @Post()
  @ApiOperation({ summary: '切换当前 openid 的收藏状态' })
  toggle(@CurrentOpenid() openid: string, @Body() dto: ToggleFavoriteDto) {
    return this.favoriteService.toggle(openid, dto);
  }

  @Get('status')
  @ApiOperation({ summary: '检查当前 openid 是否已收藏' })
  check(
    @CurrentOpenid() openid: string,
    @Query('type') type: string,
    @Query('refId') refId: string,
  ) {
    const recordType = parseRecordType(type);
    if (!recordType || !refId) {
      throw new BadRequestException('缺少收藏状态查询参数');
    }

    return this.favoriteService.check(openid, recordType, refId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除当前 openid 的收藏' })
  remove(@CurrentOpenid() openid: string, @Param('id') id: string) {
    return this.favoriteService.remove(openid, id);
  }
}
