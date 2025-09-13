import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
import { CreatedResponse } from 'src/shared/res/responses/created.response';
import { InternalServerErrorResponse } from 'src/shared/res/responses/internal-server-error.response';
import { PaginatedResponse } from 'src/shared/res/paginated.response';
import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { AuditService } from 'src/shared/services/common/audit.service';
import { ApiResponse } from 'src/shared/res/api.response';
import {
  _IChannel,
  _ICreateChannel,
} from 'src/shared/interfaces/channel.interface';

@Injectable()
export class ChannelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async findAll(
    pagination?: _IPaginationParams,
  ): Promise<PaginatedResponse<_IChannel>> {
    return await this.paginationService.paginateAndFilter(this.prisma.channel, {
      page: pagination?.page,
      limit: pagination?.limit,
      searchFields: ['name'],
      searchValue: pagination?.query,
      select: {
        id: true,
        name: true,
      },
    });
  }

  async create(dto: _ICreateChannel): Promise<ApiResponse<_IChannel>> {
    try {
      const { name } = dto;
      const created = await this.transaction.run(async (tx) => {
        const createdChannel = await tx.channel.create({
          data: {
            name,
          },
          select: {
            id: true,
            name: true,
          },
        });
        await this.auditService.logAction(
          {
            action: 'create',
            entityType: 'Channel',
            entityId: createdChannel.id,
            metadata: {
              name: createdChannel.name,
            },
          },
          tx,
        );

        return createdChannel;
      });

      await this.invalidatePermissionsCache();

      return new CreatedResponse(created, 'Channel created successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async update(
    id: string,
    dto: Partial<_ICreateChannel>,
  ): Promise<ApiResponse<_IChannel>> {
    try {
      const existing = await this.prisma.channel.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Channel not found');

      const updated = await this.transaction.run(async (tx) => {
        const updatedChannel = await tx.channel.update({
          where: { id },
          data: {
            name: dto.name ?? existing.name,
          },
          select: {
            id: true,
            name: true,
          },
        });

        await this.auditService.logAction(
          {
            action: 'update',
            entityType: 'Channel',
            entityId: updatedChannel.id,
            metadata: {
              before: {
                name: existing.name,
              },
              after: {
                name: updatedChannel.name,
              },
            },
          },
          tx,
        );

        return updatedChannel;
      });

      await this.invalidatePermissionsCache();

      return new OkResponse(updated, 'Channel updated successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async remove(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const existing = await this.prisma.channel.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Channel not found');
      await this.transaction.run(async (tx) => {
        await tx.channel.delete({ where: { id } });
        await this.auditService.logAction(
          {
            action: 'delete',
            entityType: 'Role',
            entityId: existing.id,
            metadata: {
              before: {
                name: existing.name,
              },
              after: null,
            },
          },
          tx,
        );
      });

      await this.invalidatePermissionsCache();
      return new OkResponse({ success: true }, 'Role deleted successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  private async invalidatePermissionsCache() {
    await this.redis.delByPattern(`${RedisCacheableKeyPrefixes.ALL_ROLES}*`);
  }
}
