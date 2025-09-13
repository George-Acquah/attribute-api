import { PrismaService } from 'src/shared/services/prisma/prisma.service';
// import { PaginationService } from 'src/shared/services/common/pagination.service';
// import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
// import { CreatedResponse } from 'src/shared/res/responses/created.response';
// import { PaginatedResponse } from 'src/shared/res/paginated.response';
// import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
// import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
// import { ForbiddenResponse } from 'src/shared/res/responses/forbidden.response';
// import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
// import { AuditService } from 'src/shared/services/common/audit.service';
import { handleError } from 'src/shared/utils/errors';
import { ApiResponse } from 'src/shared/res/api.response';
import { Prisma } from '@prisma/client';

@Injectable()
export class CountryService {
  private logger = new Logger(CountryService.name);
  constructor(
    private readonly prisma: PrismaService, // private readonly redis: RedisService, // private readonly auditService: AuditService, // private readonly transaction: PrismaTransactionService,
  ) {}

  async findAll(query?: string): Promise<ApiResponse<any>> {
    try {
      const searchValue = query?.trim();

      const where = searchValue
        ? {
            name: {
              contains: searchValue,
              mode: Prisma.QueryMode.insensitive,
            },
          }
        : {};

      const result = await this.prisma.country.findMany({
        where,
        select: {
          id: true,
          name: true,
          code: true,
        },
        orderBy: { name: 'asc' },
      });

      return new OkResponse(result, 'Countries fetched successfully');
    } catch (err) {
      return handleError(
        `getAllCountries`,
        err,
        `Failed to fetch countries`,
        this.logger,
      );
    }
  }
}
