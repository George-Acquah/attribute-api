export interface _ICreateCampaign {
  name: string;
  medium: string;

  channel?: string;
  budget?: number;
  numberOfCodes?: number;

  channelId: string;

  regionId: string;
}
