import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityFactory } from '../casl.provider';
import { PrismaService, RedisService } from 'src/shared/services';
import { Action } from 'src/shared/enums/casl.enums';
import {
  mockUser as fixturesUser,
  mockRolePermissions as fixturesPermissions,
  myCampaign as fixturesMyCampaign,
  otherCampaign as fixturesOtherCampaign,
} from './fixtures';

describe('CaslAbilityFactory (with TestingModule)', () => {
  let factory: CaslAbilityFactory;
  let prismaMock: Partial<PrismaService>;
  let redisMock: Partial<RedisService>;

  const mockUser = { ...fixturesUser, roles: ['user'] };

  beforeEach(async () => {
    prismaMock = {
      rolePermission: {
        findMany: jest.fn().mockResolvedValue(fixturesPermissions),
      } as any,
    };

    redisMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaslAbilityFactory,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    factory = module.get<CaslAbilityFactory>(CaslAbilityFactory);
  });

  it('should allow user to read their own Campaign', async () => {
    const ability = await factory.createForUser(mockUser);
    console.log('ability: ', ability);

    const myCampaign = {
      ...fixturesMyCampaign,
      __caslSubjectType__: 'Campaign' as const,
    };

    expect(ability.can(Action.Read, 'Campaign')).toBe(true);
    expect(ability.can(Action.Read, myCampaign)).toBe(true);
  });

  it("should NOT allow user to read others' Campaign", async () => {
    const ability = await factory.createForUser(mockUser);

    const othersCampaign = {
      ...fixturesOtherCampaign,
      __caslSubjectType__: 'Campaign' as const,
    };

    expect(ability.can(Action.Read, othersCampaign)).toBe(false);
  });

  it('should allow user to delete their own Campaign', async () => {
    const ability = await factory.createForUser(mockUser);

    const myCampaign = {
      ...fixturesMyCampaign,
      __caslSubjectType__: 'Campaign' as const,
    };

    expect(ability.can(Action.Delete, myCampaign)).toBe(true);
  });

  it('should NOT allow user to delete someone else’s Campaign', async () => {
    const ability = await factory.createForUser(mockUser);

    const othersCampaign = {
      ...fixturesOtherCampaign,
      __caslSubjectType__: 'Campaign' as const,
    };

    expect(ability.can(Action.Delete, othersCampaign)).toBe(false);
  });

  it('should cache permissions in Redis after loading from DB', async () => {
    await factory.createForUser(mockUser);
    expect(redisMock.set).toHaveBeenCalled();
  });
});
