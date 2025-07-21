import { PureAbility, AbilityBuilder, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Campaign, Code, User } from '@prisma/client';
import { Action } from '../enums/casl.enums';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
// import { PrismaService } from '../services/prisma/prisma.service';

type AppSubjects =
  | 'all'
  | Subjects<{
      User: User;
      Campaign: Campaign;
      Code: Code;
    }>;

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  // constructor(private readonly prisma: PrismaService) {}
  createForUser(user: _ISafeUser) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createPrismaAbility,
    );

    // const dbRoles = await this.prisma.role.findMany({
    //   select: { name: true },
    // });

    // // Define abilities based on the user's roles
    // user.roles.forEach((role) => {
    //   const roleAbilities = dbRoles;
    //   if (roleAbilities) {
    //     roleAbilities.forEach((action: string) => {
    //       can(action as Action, 'all'); // Adjust according to actual resource types
    //     });
    //   }
    // });

    if (user.roles.includes('manager')) {
      can(Action.Manage, 'all');
    } else if (user.roles.includes('admin')) {
      can(Action.Read, 'all');
    } else {
      can(Action.Read, 'Campaign');
      can(Action.Read, 'Code');
      cannot(Action.Read, 'User');
    }

    can(Action.Create, 'Code', 'all');
    can(Action.Create, 'Campaign');

    can(Action.Update, 'Campaign', 'all', { ownerId: user.id });
    can(Action.Delete, 'Campaign', 'all', { ownerId: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as unknown as ExtractSubjectType<AppSubjects>,
    });
  }
}
