import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PaginationService } from 'src/shared/services/common/pagination.service';
import { RedisService } from 'src/shared/services/redis/redis.service';
import { OkResponse } from 'src/shared/res/responses/ok.response';
import { CreatedResponse } from 'src/shared/res/responses/created.response';
import { InternalServerErrorResponse } from 'src/shared/res/responses/internal-server-error.response';
import { PaginatedResponse } from 'src/shared/res/paginated.response';
import { PaginationParams } from 'src/shared/dtos/pagination.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { NotFoundResponse } from 'src/shared/res/responses/not-found.response';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';

@Injectable()
export class PermissionsService {
  private logger = new Logger(PermissionsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
    private readonly redis: RedisService,
  ) {}

  async findAllForRole(roleId: string) {
    try {
      const results = await this.prisma.rolePermission.findMany({
        where: { roleId },
        select: {
          id: true,
          action: true,
          subject: true,
          conditions: true,
          roleId: true,
          role: { select: { id: true, name: true } },
        },
      });
      return new OkResponse(results);
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }

  async findAllForUser(
    userId: string,
    pagination?: PaginationParams,
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
      let roleId = dto.roleId;
      if (!roleId && dto.roleName) {
        const role = await this.prisma.role.findUnique({
          where: { name: dto.roleName },
        });
        roleId = role?.id;
      }

      if (!roleId) return new NotFoundResponse('Role not found');

      const created = await this.prisma.rolePermission.create({
        data: {
          action: dto.action,
          subject: dto.subject,
          conditions: JSON.stringify(dto.conditions) ?? null,
          roleId,
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

      await this.redis.delByPattern('casl:roles:permissions*');

      return new CreatedResponse(created);
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

      let roleId = dto.roleId;
      if (!roleId && dto.roleName) {
        const role = await this.prisma.role.findUnique({
          where: { name: dto.roleName },
        });
        roleId = role?.id;
      }

      const updated = await this.prisma.rolePermission.update({
        where: {
          roleId_action_subject: {
            roleId: roleId,
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
          ...(roleId ? { roleId } : {}),
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

      await this.redis.delByPattern('casl:roles:permissions*');

      return new OkResponse(updated);
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

      await this.prisma.rolePermission.delete({ where: { id } });
      await this.redis.delByPattern('casl:roles:permissions*');
      return new OkResponse({ success: true });
    } catch (err) {
      return new InternalServerErrorResponse(err?.message);
    }
  }
}
