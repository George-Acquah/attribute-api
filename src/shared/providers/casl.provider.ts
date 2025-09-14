import { AbilityBuilder, ExtractSubjectType } from '@casl/ability';
import { Action } from '../enums/casl.enums';
import { createPrismaAbility } from '@casl/prisma';
import { PrismaService } from '../services/prisma/prisma.service';
import { RedisService } from '../services';
import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import { AppAbility, AppSubjects } from '../interfaces/casl.interfac';
import { RedisKeyPrefixes } from '../constants/redis.constants';

@Injectable()
export class CaslAbilityFactory {
  private readonly logger = new Logger(CaslAbilityFactory.name);
  private readonly ROLES_CACHE_KEY = RedisKeyPrefixes.PERMISSION_PROVIDER;
  private readonly ROLES_CACHE_TTL = 60 * 60 * 24; // 1 day

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async createForUser(user: _ISafeUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    // 1. Try cache
    const rolesData = await this.redis.get<any>(this.ROLES_CACHE_KEY);
    let rolePermissions: any[];

    if (rolesData) {
      rolePermissions = rolesData;
    } else {
      rolePermissions = await this.prisma.rolePermission.findMany({
        include: { role: true },
      });

      await this.redis.set(
        this.ROLES_CACHE_KEY,
        rolePermissions,
        this.ROLES_CACHE_TTL,
      );
    }

    // 2. Filter only relevant to current user
    const userPermissions = rolePermissions.filter((perm) =>
      user.roles.includes(perm.role.name),
    );

    // 3. Build ability with conditions
    for (const perm of userPermissions) {
      const action = perm.action as Action;
      const subject = perm.subject as ExtractSubjectType<AppSubjects>;

      let conditions: Record<string, any> | undefined;

      if (perm.conditions) {
        try {
          const parsed =
            typeof perm.conditions === 'string'
              ? JSON.parse(perm.conditions)
              : perm.conditions;

          // Inject dynamic user info (currently only supports ownerId)
          conditions = Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => {
              if (typeof value === 'string' && value.includes('${user.id}')) {
                return [key, value.replace('${user.id}', user.id)];
              }
              return [key, value];
            }),
          );
        } catch (err) {
          this.logger.error(
            `Failed to parse conditions for permission ${action} ${subject}: ${perm.conditions}`,
          );
        }
      }

      if (conditions) {
        can(action, subject, conditions);
      } else {
        can(action, subject);
      }
    }

    const ability = build({
      detectSubjectType: (item) => {
        try {
          // If the instance explicitly sets a CASL subject type, use it.
          if (
            item &&
            typeof item === 'object' &&
            '__caslSubjectType__' in item
          ) {
            return (item as any)
              .__caslSubjectType__ as ExtractSubjectType<AppSubjects>;
          }
        } catch (e) {
          // ignore and fallback
        }

        return item.constructor as unknown as ExtractSubjectType<AppSubjects>;
      },
    });

    return ability;
  }
}
