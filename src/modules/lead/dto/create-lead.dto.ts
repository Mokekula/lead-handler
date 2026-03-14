import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @Expose({ name: 'fb_token' })
  fbToken?: string;

  @IsOptional()
  @IsString()
  pixel?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'link_id' })
  linkId?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'api_token' })
  apiToken?: string;

  @IsOptional()
  @IsString()
  fullPhone?: string;

  @IsOptional()
  @IsString()
  funnel?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  fname?: string;

  @IsOptional()
  @IsString()
  lname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  buyer?: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  iso?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'utm_source' })
  utmSource?: string;

  @IsOptional()
  @IsString()
  clickid?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'utm_campaign' })
  utmCampaign?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'utm_content' })
  utmContent?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'adset_name' })
  adsetName?: string;

  @IsOptional()
  @IsString()
  adName?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  fbc?: string;

  @IsOptional()
  @IsString()
  fbp?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  contentName?: string;

  @IsOptional()
  @IsString()
  contentCategory?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  os?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  browserVersion?: string;

  @IsOptional()
  @IsString()
  sub1?: string;

  @IsOptional()
  @IsString()
  sub2?: string;

  @IsOptional()
  @IsString()
  sub3?: string;

  @IsOptional()
  @IsString()
  sub4?: string;

  @IsOptional()
  @IsString()
  sub5?: string;

  @IsOptional()
  @IsString()
  sub6?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'campaign_id' })
  campaignId?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'adset_id' })
  adsetId?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'utm_placement' })
  utmPlacement?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'ad_id' })
  adId?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @IsString()
  flowId?: string;

  @IsOptional()
  @IsString()
  buyerId?: string;
}
