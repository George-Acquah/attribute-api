// ability.types.ts
import { User, Campaign, Code } from '@prisma/client';
import { PureAbility } from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';
import { Action } from '../enums/casl.enums';

export type AppSubjects =
  | 'all'
  | Subjects<{
      User: User;
      Campaign: Campaign;
      Code: Code;
    }>;

export type AppAbility = PureAbility<[Action, AppSubjects], PrismaQuery>;
