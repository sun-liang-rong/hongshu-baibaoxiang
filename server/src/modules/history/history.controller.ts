import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentOpenid } from '../../common/decorators/current-openid.decorator';
import { parseRecordType } from '../common/record-type';
import { HistoryService } from './history.service';

@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ApiOperation({ summary: '获取当前 openid 的历史记录' })
  list(
    @CurrentOpenid() openid: string,
    @Query('type') type?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.historyService.list(openid, parseRecordType(type), {
      cursor,
      limit,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除当前 openid 的单条历史记录' })
  remove(@CurrentOpenid() openid: string, @Param('id') id: string) {
    return this.historyService.remove(openid, id);
  }

  @Delete()
  @ApiOperation({ summary: '清空当前 openid 的历史记录' })
  clear(@CurrentOpenid() openid: string, @Query('type') type?: string) {
    return this.historyService.clear(openid, parseRecordType(type));
  }
}
