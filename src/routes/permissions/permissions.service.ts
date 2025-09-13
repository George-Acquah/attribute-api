import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
import { CreatedResponse } from 'src/shared/res/responses/created.response';
import { InternalServerErrorResponse } from 'src/shared/res/responses/internal-server-error.response';
import { PaginatedResponse } from 'src/shared/res/paginated.response';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { _IPaginationParams } from 'src/shared/interfaces/pagination.interface';
import { RedisCacheableKeyPrefixes } from 'src/shared/constants/redis.constants';
import { ForbiddenResponse } from 'src/shared/res/responses/forbidden.response';
import { PrismaTransactionService } from 'src/shared/services/transaction/prisma-transaction.service';
import { AuditService } from 'src/shared/services/common/audit.service';

@Injectable()
export class PermissionsService {
  private logger = new Logger(PermissionsService.name);
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

  async findAllForRole(roleId: string, pagination?: _IPaginationParams) {
    return await this.paginationService.paginateAndFilter(
      this.prisma.rolePermission,
      {
        page: pagination?.page,
        limit: pagination?.limit,
        where: { roleId },
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

  async findAllForUser(
    userId: string,
    pagination?: _IPaginationParams,
  ): Promise<PaginatedResponse<any> | InternalServerErrorResponse> {
    try {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
      });
      const roleIds = userRoles.map((r) => r.roleId);

      return await this.paginationService.paginateAndFilter(
        this.prisma.rolePermission,
        {
          page: pagination?.page,
          limit: pagination?.limit,
          where: { roleId: { in: roleIds } } as any,
          searchFields: ['action', 'subject'],
          searchValue: pagination?.query,
          select: {
            id: true,
            action: true,
            subject: true,
            conditions: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          } as any,
        },
      );
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async create(dto: CreatePermissionDto) {
    try {
      this.logger.log('DTO is: ', dto);

      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) return new NotFoundResponse('Role not found');

      const created = await this.transaction.run(async (tx) => {
        const createdPermission = await tx.rolePermission.create({
          data: {
            action: dto.action,
            subject: dto.subject,
            conditions: JSON.stringify(dto.conditions) ?? null,
            roleId: role.id,
          },
          select: {
            id: true,
            action: true,
            subject: true,
            conditions: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          },
        });
        await this.auditService.logAction(
          {
            action: 'update',
            entityType: 'RolePermission',
            entityId: createdPermission.id,
            metadata: {
              action: createdPermission.action,
              subject: createdPermission.subject,
              conditions: createdPermission.conditions,
            },
          },
          tx,
        );

        return createdPermission;
      });

      await this.invalidatePermissionsCache();

      return new CreatedResponse(created, 'Permission created successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async update(id: string, dto: UpdatePermissionDto) {
    try {
      const existing = await this.prisma.rolePermission.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Permission not found');
      if (existing.roleId !== dto.roleId)
        return new ForbiddenResponse(
          'Permission does not belong to the provided role. Ensure both the permission ID and roleId are correct.',
        );

      const updated = await this.transaction.run(async (tx) => {
        const updatedPermission = await tx.rolePermission.update({
          where: {
            roleId_action_subject: {
              roleId: existing.roleId,
              action: dto.action,
              subject: dto.subject,
            },
          },
          data: {
            action: dto.action ?? existing.action,
            subject: dto.subject ?? existing.subject,
            conditions:
              JSON.stringify(dto.conditions) ??
              JSON.stringify(existing.conditions),
            ...(dto.roleId ? { roleId: dto.roleId } : {}),
          },
          select: {
            id: true,
            action: true,
            subject: true,
            conditions: true,
            roleId: true,
            role: { select: { id: true, name: true } },
          },
        });

        await this.auditService.logAction(
          {
            action: 'update',
            entityType: 'RolePermission',
            entityId: updatedPermission.id,
            metadata: {
              before: {
                action: existing.action,
                subject: existing.subject,
                conditions: existing.conditions,
              },
              after: {
                action: updatedPermission.action,
                subject: updatedPermission.subject,
                conditions: updatedPermission.conditions,
              },
            },
          },
          tx,
        );

        return updatedPermission;
      });

      await this.invalidatePermissionsCache();

      return new OkResponse(updated, 'Permission updated successfully.');
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async remove(id: string) {
    try {
      const existing = await this.prisma.rolePermission.findUnique({
        where: { id },
      });
      if (!existing) return new NotFoundResponse('Permission not found');
      await this.transaction.run(async (tx) => {
        await tx.rolePermission.delete({ where: { id } });
        await this.auditService.logAction(
          {
            action: 'delete',
            entityType: 'RolePermission',
            entityId: existing.id,
            metadata: {
              before: {
                action: existing.action,
                subject: existing.subject,
                conditions: existing.conditions,
              },
              after: null,
            },
          },
          tx,
        );
      });

      await this.invalidatePermissionsCache();
      return new OkResponse(
        { success: true },
        'Permission deleted successfully.',
      );
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  private async invalidatePermissionsCache() {
    await Promise.allSettled([
      this.redis.delByPattern(`${RedisCacheableKeyPrefixes.ROLE_PERMISSIONS}*`),
      this.redis.delByPattern(`${RedisCacheableKeyPrefixes.USER_PERMISSIONS}*`),
    ]);
  }
}
