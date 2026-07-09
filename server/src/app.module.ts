import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WatermarkModule } from './modules/watermark/watermark.module';
import { GenerateModule } from './modules/generate/generate.module';
import { HistoryModule } from './modules/history/history.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { StatsModule } from './modules/stats/stats.module';
import { WechatIntegrationModule } from './integrations/wechat/wechat-integration.module';
import { XhsParserIntegrationModule } from './integrations/xhs-parser/xhs-parser-integration.module';
import { AiProviderIntegrationModule } from './integrations/ai-provider/ai-provider-integration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    WechatIntegrationModule,
    XhsParserIntegrationModule,
    AiProviderIntegrationModule,
    HealthModule,
    AuthModule,
    WatermarkModule,
    GenerateModule,
    HistoryModule,
    FavoriteModule,
    SystemConfigModule,
    StatsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
