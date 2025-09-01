import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { _IPaginationMeta } from 'src/shared/interfaces/responses.interface';
import { PaginatedResponse } from 'src/shared/res/paginated.response';

@Injectable()
export class PaginationService {
  async paginateAndFilter<TModel, TWhereInput, TInclude, TOrderBy>(
    prismaModel: {
      findMany: (args: {
        where?: TWhereInput;
        include?: TInclude;
        orderBy?: TOrderBy;
        skip?: number;
        take?: number;
      }) => Promise<TModel[]>;
      count: (args: { where?: TWhereInput }) => Promise<number>;
    },
    args: {
      page?: number;
      limit?: number;
      searchFields?: (keyof TWhereInput & string)[];
      searchValue?: string;
      where?: TWhereInput;
      include?: TInclude;
      orderBy?: TOrderBy;
      message?: string;
    },
  ): Promise<PaginatedResponse<TModel>> {
    try {
      const page = args.page ?? 1;
      const limit = args.limit ?? 10;
      const skip = (page - 1) * limit;

      let where = args.where;

      if (args.searchFields && args.searchFields.length && args.searchValue) {
        const searchConditions = args.searchFields.map((field) => ({
          [field]: {
            contains: args.searchValue,
            mode: 'insensitive',
          },
        }));

        where = {
          ...args.where,
          OR: searchConditions,
        } as unknown as TWhereInput;
      }

      const [data, total] = await Promise.all([
        prismaModel.findMany({
          where,
          include: args.include,
          orderBy: args.orderBy ?? ({} as TOrderBy),
          skip,
          take: limit,
        }),
        prismaModel.count({ where }),
      ]);

      const lastPage = Math.ceil(total / limit);
      const meta: _IPaginationMeta = {
        total,
        lastPage,
        currentPage: page,
        perPage: limit,
        prev: page > 1 ? page - 1 : null,
        next: page < lastPage ? page + 1 : null,
      };

      return new PaginatedResponse<TModel>(
        HttpStatus.OK,
        data,
        meta,
        args.message ?? 'Data fetched successfully',
        null,
      );
    } catch (error) {
      console.error('PaginationService Error:', error);
      return new PaginatedResponse<null>(
        HttpStatus.OK,
        null,
        null,
        'Failed to fetch paginated data',
      );
    }
  }
}
