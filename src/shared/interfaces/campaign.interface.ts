export interface _ICreateCampaign {
  name: string;
  medium: string;

  budget?: number;
  numberOfCodes?: number;

  channelId: string;

  regionId: string;
}
