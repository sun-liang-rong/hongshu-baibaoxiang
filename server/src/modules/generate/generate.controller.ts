import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('generate')
@Controller('generate')
export class GenerateController {}
