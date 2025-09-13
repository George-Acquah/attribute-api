export const conditionPresets = {
  isSelf: { id: '${user.id}' },
  isOwner: { ownerId: '${user.id}' },
  isRegionUser: { regionId: '${user.regionId}' },
  isInfluencer: { influencerId: '${user.id}' },
  createdByUser: { userId: '${user.id}' },
  adminLogs: { adminId: '${user.id}' },
  byChannel: { channelId: '${user.channelId}' },
  byCountry: { countryId: '${user.countryId}' },
  byCampaign: { campaignId: '${user.campaignId}' },
} as const;

export type ConditionPresetKey = keyof typeof conditionPresets;

export const conditionOptions = [
  { label: 'Only own campaigns', value: 'isOwner' },
  { label: 'Campaigns in same region', value: 'isRegionUser' },
  { label: 'My admin logs', value: 'adminLogs' },
];
