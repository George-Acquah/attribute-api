import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { _IPaginationMeta } from 'src/shared/interfaces/responses.interface';
import { PaginatedResponse } from 'src/shared/res/paginated.response';

@Injectable()
export class PaginationService {
  async paginateAndFilter<
    TModel,
    TWhereInput,
    TInclude = unknown,
    TOrderBy = unknown,
    TSelect = unknown,
  >(
    prismaModel: {
      findMany: (args: {
        where?: TWhereInput;
        include?: TInclude;
        select?: TSelect;
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
      include?: TInclude | null;
      select?: TSelect | null;
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

      // Prisma: include and select are mutually exclusive. Enforce that only one is provided.
      if (args.include != null && args.select != null) {
        throw new Error(
          '`include` and `select` are mutually exclusive; provide only one.',
        );
      }

      const findArgs: any = {
        where,
        orderBy: args.orderBy ?? ({} as TOrderBy),
        skip,
        take: limit,
      };

      if (args.include != null) findArgs.include = args.include;
      if (args.select != null) findArgs.select = args.select;

      const [data, total] = await Promise.all([
        prismaModel.findMany(findArgs),
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
      console.error('PaginationService Error:', error?.message ?? error);
      return new PaginatedResponse<null>(
        HttpStatus.OK,
        null,
        null,
        error?.message ?? 'Failed to fetch paginated data',
      );
    }
  }
}
