import { IsString, IsOptional, IsEmail, IsNumber } from 'class-validator';

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  fb_token?: string;

  @IsOptional()
  @IsString()
  pixel?: string;

  @IsOptional()
  @IsString()
  link_id?: string;

  @IsOptional()
  @IsString()
  api_token?: string;

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
  utm_source?: string;

  @IsOptional()
  @IsString()
  clickid?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  utm_content?: string;

  @IsOptional()
  @IsString()
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
  campaign_id?: string;

  @IsOptional()
  @IsString()
  adset_id?: string;

  @IsOptional()
  @IsString()
  utm_placement?: string;

  @IsOptional()
  @IsString()
  adset_name?: string;

  @IsOptional()
  @IsString()
  ad_id?: string;

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
