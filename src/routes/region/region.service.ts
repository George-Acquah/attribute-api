import { PrismaService } from 'src/shared/services/prisma/prisma.service';
// import { PaginationService } from 'src/shared/services/common/pagination.service';
// import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
// import { CreatedResponse } from 'src/shared/res/responses/created.response';
// import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
// import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
// import { ForbiddenResponse } from 'src/shared/res/responses/forbidden.response';
// import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
// import { AuditService } from 'src/shared/services/common/audit.service';
import { ApiResponse } from 'src/shared/res/api.response';
import { Prisma } from '@prisma/client';
import { handleError } from 'src/shared/utils/errors';
import { _IFindRegionsFilter } from 'src/shared/interfaces/region.interface';

@Injectable()
export class RegionService {
  private logger = new Logger(RegionService.name);
  constructor(
    private readonly prisma: PrismaService, // private readonly redis: RedisService, // private readonly auditService: AuditService, // private readonly transaction: PrismaTransactionService,
  ) {}

  async findRegionsByFilter(
    filter: _IFindRegionsFilter,
  ): Promise<ApiResponse<any>> {
    try {
      const { countryId, countryCode, countryName, query } = filter;
      const searchValue = query?.trim();

      let countryFilter: Prisma.CountryWhereInput | undefined;

      if (countryId || countryCode || countryName) {
        countryFilter = {
          ...(countryId && { id: countryId }),
          ...(countryCode && { code: countryCode }),
          ...(countryName && {
            name: {
              equals: countryName,
              mode: Prisma.QueryMode.insensitive,
            },
          }),
        };
      }

      const regionWhere: Prisma.RegionWhereInput = {
        ...(searchValue && {
          name: {
            contains: searchValue,
            mode: Prisma.QueryMode.insensitive,
          },
        }),
        ...(countryFilter && {
          country: {
            ...countryFilter,
          },
        }),
      };

      const result = await this.prisma.region.findMany({
        where: regionWhere,
        select: {
          id: true,
          name: true,
        },
        orderBy: { name: 'asc' },
      });

      return new OkResponse(
        result,
        result.length > 0 ? 'Regions fetched successfully' : 'No regions found',
      );
    } catch (err) {
      return handleError(
        'findRegionsByFilter',
        err,
        'Failed to fetch regions',
        this.logger,
      );
    }
  }
}
