export const RedisKeyPrefixes = {
  FIREBASE_SESSION: 'session:firebase:',
  CUSTOM_SESSION: 'session:custom:',
  SESSION_USER_KEY: 'session:user:',
};

export const RedisCacheableKeyPrefixes = {
  USER_PERMISSIONS: 'permissions:user:',
  ROLE_PERMISSIONS: 'permissions:role:',
  USER_ROLES: 'roles:user:',
  ALL_ROLES: 'roles:all',
  ALL_PERMISSIONS: 'permissions:all',
  USERS_LIST: 'users:list:',
  CODES_LIST: 'codes:list:',
  CAMPAIGNS_LIST: 'campaigns:list:',
  INTERACTIONS_LIST: 'interactions:list:',
  CONVERSIONS_LIST: 'conversions:list:',
  ATTRIBUTIONS_LIST: 'attributions:list:',
  REPORTS_LIST: 'reports:list:',
};
