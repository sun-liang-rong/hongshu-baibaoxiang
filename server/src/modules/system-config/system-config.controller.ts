import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('system-config')
@Controller('system/config')
export class SystemConfigController {}
