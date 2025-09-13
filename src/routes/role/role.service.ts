import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
import { CreatedResponse } from 'src/shared/res/responses/created.response';
import { InternalServerErrorResponse } from 'src/shared/res/responses/internal-server-error.response';
import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
// import { Logger } from '@nestjs/common/services/logger.service';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { AuditService } from 'src/shared/services/common/audit.service';
import { _ICreateRole, _IRole } from 'src/shared/interfaces/roles.interface';
import { PaginatedResponse } from 'src/shared/res/paginated.response';
import { ApiResponse } from 'src/shared/res/api.response';

@Injectable()
export class RoleService {
  // private logger = new Logger(RoleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
    private readonly auditService: AuditService,
    private readonly transaction: PrismaTransactionService,
  ) {}

  async findAll(
    pagination?: _IPaginationParams,
  ): Promise<PaginatedResponse<_IRole>> {
    return await this.paginationService.paginateAndFilter(this.prisma.role, {
      page: pagination?.page,
      limit: pagination?.limit,
      searchFields: ['name', 'description'],
      searchValue: pagination?.query,
      select: {
        id: true,
        name: true,
        description: true,
        // createdAt: true,
        // updatedAt: true,
      },
    });
  }

  async create(dto: _ICreateRole): Promise<ApiResponse<_IRole>> {
    try {
      const { name, description } = dto;
      const created = await this.transaction.run(async (tx) => {
        const createdRole = await tx.role.create({
          data: {
            name,
            description,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        });
        await this.auditService.logAction(
          {
            action: 'create',
            entityType: 'Role',
            entityId: createdRole.id,
            metadata: {
              name: createdRole.name,
            },
          },
          tx,
        );

        return createdRole;
      });

      await this.invalidatePermissionsCache();

      return new CreatedResponse(created, 'Role created successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async update(
    id: string,
    dto: Partial<_ICreateRole>,
  ): Promise<ApiResponse<_IRole>> {
    try {
      const existing = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Role not found');

      const updated = await this.transaction.run(async (tx) => {
        const updatedRole = await tx.role.update({
          where: { id },
          data: {
            name: dto.name ?? existing.name,
            description: dto.description ?? existing.description,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
        });

        await this.auditService.logAction(
          {
            action: 'update',
            entityType: 'Role',
            entityId: updatedRole.id,
            metadata: {
              before: {
                name: existing.name,
                description: existing.description,
              },
              after: {
                name: updatedRole.name,
                description: updatedRole.description,
              },
            },
          },
          tx,
        );

        return updatedRole;
      });

      await this.invalidatePermissionsCache();

      return new OkResponse(updated, 'Role updated successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async remove(id: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const existing = await this.prisma.role.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Role not found');
      await this.transaction.run(async (tx) => {
        await tx.role.delete({ where: { id } });
        await this.auditService.logAction(
          {
            action: 'delete',
            entityType: 'Role',
            entityId: existing.id,
            metadata: {
              before: {
                name: existing.name,
                description: existing.description,
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
