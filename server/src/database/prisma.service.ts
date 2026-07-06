import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client/index';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    if (
      process.env.NODE_ENV === 'test' ||
      process.env.DATABASE_CONNECT_ON_START !== 'true'
    ) {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    await this.$disconnect();
  }
}
