import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      searchField?: keyof TWhereInput & string;
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

      if (args.searchField && args.searchValue) {
        where = {
          ...args.where,
          [args.searchField]: {
            contains: args.searchValue,
            mode: 'insensitive',
          },
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
        200,
        args.message ?? 'Data fetched successfully',
        data,
        meta,
      );
    } catch (error) {
      console.error('PaginationService Error:', error);
      throw new InternalServerErrorException('Failed to fetch paginated data');
    }
  }
}
