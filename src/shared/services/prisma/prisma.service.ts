import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { OnModuleDestroy } from '@nestjs/common/interfaces/hooks/on-destroy.interface';
import { OnModuleInit } from '@nestjs/common/interfaces/hooks/on-init.interface';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['error']
          : ['error', 'info', 'warn', 'query'],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
