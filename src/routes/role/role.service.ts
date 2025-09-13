import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
import { CreatedResponse } from 'src/shared/res/responses/created.response';
import { InternalServerErrorResponse } from 'src/shared/res/responses/internal-server-error.response';
import { PaginatedResponse } from 'src/shared/res/paginated.response';
import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { ForbiddenResponse } from 'src/shared/res/responses/forbidden.response';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { AuditService } from 'src/shared/services/common/audit.service';

@Injectable()
export class RoleService {
  private logger = new Logger(RoleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async findAll(pagination?: _IPaginationParams) {
    return await this.paginationService.paginateAndFilter(
      this.prisma.rolePermission,
      {
        page: pagination?.page,
        limit: pagination?.limit,
        searchFields: ['action', 'subject'],
        searchValue: pagination?.query,
        select: {
          id: true,
          action: true,
          subject: true,
          conditions: true,
          roleId: true,
          role: { select: { id: true, name: true } },
        },
      },
    );
  }
}
