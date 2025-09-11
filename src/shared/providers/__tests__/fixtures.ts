// Test fixtures matching Prisma schema shapes (minimal fields used by tests)
export const mockUser = {
  id: 'user-123',
  email: 'user@test.com',
  name: 'Test User',
};

export const mockRole = {
  id: 'role-1',
  name: 'user',
  description: 'Regular user role',
};

export const mockRolePermissions = [
  {
    id: 'perm-0',
    action: 'read',
    subject: 'Campaign',
    conditions: { ownerId: '${user.id}' },
    roleId: 'role-1',
    role: mockRole,
  },
  {
    id: 'perm-1',
    action: 'read',
    subject: 'Campaign',
    conditions: { ownerId: '${user.id}' },
    roleId: 'role-1',
    role: mockRole,
  },
  {
    id: 'perm-2',
    action: 'delete',
    subject: 'Campaign',
    conditions: { ownerId: '${user.id}' },
    roleId: 'role-1',
    role: mockRole,
  },
];

export const myCampaign = {
  id: 'camp-1',
  name: 'My Campaign',
  description: 'A test campaign',
  budget: 1000,
  target: { audience: 'test' },
  medium: 'email',
  actions: 'SIGNUP' as any,
  webhookUrl: null,
  status: 'DRAFT' as any,
  channelId: 'channel-1',
  ownerId: 'user-123',
  regionId: 'region-1',
  influencerId: null,
  createdAt: new Date(),
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
  deletedAt: null,
  archivedAt: null,
  __caslSubjectType__: 'Campaign' as const,
};

export const otherCampaign = {
  id: 'camp-2',
  name: 'Other Campaign',
  description: 'Another test campaign',
  budget: 500,
  target: { audience: 'other' },
  medium: 'sms',
  actions: 'PURCHASE' as any,
  webhookUrl: null,
  status: 'DRAFT' as any,
  channelId: 'channel-2',
  ownerId: 'user-456',
  regionId: 'region-2',
  influencerId: null,
  createdAt: new Date(),
  startDate: new Date(),
  endDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
  deletedAt: null,
  archivedAt: null,
  __caslSubjectType__: 'Campaign' as const,
};
