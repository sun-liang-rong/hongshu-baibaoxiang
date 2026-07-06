import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('history')
@Controller('history')
export class HistoryController {}
