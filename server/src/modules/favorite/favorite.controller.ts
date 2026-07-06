import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('favorite')
@Controller('favorites')
export class FavoriteController {}
