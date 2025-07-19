import { PureAbility, AbilityBuilder, ExtractSubjectType } from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Campaign, User } from '@prisma/client';
import { Action } from '../enums/casl.enums';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';

type AppSubjects =
  | 'all'
  | Subjects<{
      User: User;
      Campaign: Campaign;
    }>;

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: _ISafeUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    if (user.email) {
      can(Action.Manage, 'all');
    } else {
      can(Action.Read, 'all');
    }

    can(Action.Create, 'Campaign');

    can(Action.Update, 'Campaign', 'all', { ownerId: user.id });

    return build({
      detectSubjectType: (item) =>
        item.constructor as unknown as ExtractSubjectType<AppSubjects>,
    });
  }
}
