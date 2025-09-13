import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { _ICreateAdminLog } from 'src/shared/interfaces/report.interface';
import { AsyncContextService } from '../context/async-context.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: AsyncContextService,
  ) {}

  async logAction(data: _ICreateAdminLog): Promise<void>;
  async logAction(
    data: _ICreateAdminLog,
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  async logAction(
    data: _ICreateAdminLog,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const adminId = this.context.get('adminId') || this.context.get('userId');
    await client.adminLog.create({
      data: {
        ...data,
        adminId,
      },
    });
  }
}
