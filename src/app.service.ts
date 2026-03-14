import { SmsService } from './modules/integrations/sms/sms.service';
import { FacebookService } from './modules/integrations/facebook/facebook.service';
import { TelegramService } from './modules/integrations/telegram/telegram.service';
import { HashingService } from './common/utils/hashing.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateLeadDto } from './lead.dto';
import { PrismaService } from './prisma/prisma.service';
import { LogsService } from './logs/logs.service';
import type { Env } from './common/config/env.validation';
import { BUYER_IDS_MAP, createBuyerTokensMap } from './common/config/buyers.const';
import { CrmService } from './modules/integrations/crm/crm.service';

/**
 * The AppService class provides methods for handling lead creation,
 * interaction with Facebook APIs, and supporting utility methods.
 * It includes database operations managed via Prisma, along with
 * data logging using the LogsService.
 */
@Injectable()
export class AppService {
  private isSendToRobotnik: boolean = true;

  constructor(
    private prisma: PrismaService,
    private logger: LogsService,
    private config: ConfigService<Env, true>,
    private hashingService: HashingService,
    private crmService: CrmService,
    private telegramService: TelegramService,
    private facebookService: FacebookService,
    private smsService: SmsService,
  ) {}

  async createLead(createLeadDto: CreateLeadDto): Promise<string> {
    const lead = await this.prisma.lead.create({
      data: {
        fb_token: createLeadDto.fbToken,
        pixel: createLeadDto.pixel,
        // link_id: linkId,
        // api_token: token,
        fullPhone: createLeadDto.fullPhone,
        funnel: createLeadDto.funnel,
        source: createLeadDto.source,
        fname: createLeadDto.fname,
        lname: createLeadDto.lname,
        email: createLeadDto.email,
        ip: createLeadDto.ip,
        buyer: createLeadDto.buyer,
        offerId: createLeadDto.offerId,
        flowId: createLeadDto.flowId,
        buyerId: createLeadDto.buyerId,
        domain: createLeadDto.domain,
        country: createLeadDto.country,
        iso: createLeadDto.iso,
        language: createLeadDto.language,
        utm_source: createLeadDto.utmSource,
        clickid: createLeadDto.clickid,
        utm_campaign: createLeadDto.utmCampaign,
        utm_content: createLeadDto.utmContent,
        adName: createLeadDto.adName,
        adsetName: createLeadDto.adsetName,
        // Create the related FBData in the same operation
        FBData: {
          create: {
            em: this.hashingService.hash(createLeadDto.email?.toLowerCase() || ''),
            fn: this.hashingService.hash(createLeadDto.fname?.toLowerCase() || ''),
            ln: this.hashingService.hash(createLeadDto.lname?.toLowerCase() || ''),
            ph: this.hashingService.hash(createLeadDto.fullPhone || ''),
            country: this.hashingService.hash(createLeadDto.country || ''),
            client_ip_address: createLeadDto.ip,
            client_user_agent: createLeadDto.userAgent,
            fbc: createLeadDto.fbc,
            fbp: createLeadDto.fbp,
            external_id: createLeadDto.externalId,
          },
        },
        ConversionEvent: {
          create: {
            currency: createLeadDto.currency,
            value: createLeadDto.value,
            content_name: createLeadDto.contentName,
            content_category: createLeadDto.contentCategory,
            content_type: createLeadDto.contentType,
          },
        },
        DeviceInfo: {
          create: {
            deviceType: createLeadDto.deviceType,
            userAgent: createLeadDto.userAgent,
            os: createLeadDto.os,
            osVersion: createLeadDto.osVersion,
            browser: createLeadDto.browser,
            browserVersion: createLeadDto.browserVersion,
            ip: createLeadDto.ip,
            language: createLeadDto.language,
          },
        },
      },
      // Include the related FBData in the response
      include: {
        FBData: true,
        ConversionEvent: true,
        DeviceInfo: true,
      },
    });

    // if fb token and pixel - send data to facebook
    if (createLeadDto.fbToken && createLeadDto.pixel) {
      try {
        await this.facebookService.sendDataToFacebook(
          'Lead',
          lead,
          createLeadDto.fbToken,
          createLeadDto.pixel,
        );
        // await this.logger.info(`Do not sending data about registration...`, lead.id, 'facebook')
        // if (createLeadDto.funnel === 'Immediate Nextgen' || createLeadDto.funnel === 'immediate nextgen') {
        //     await this.sendDataToFacebook('Purchase', lead, createLeadDto.fbToken, createLeadDto.pixel);
        // }
      } catch (fbError) {
        await this.logger.error(
          `Error sending data to Facebook: ${fbError.message}`,
          lead.id,
          'facebook',
        );
      }
    }

    try {
      if (
        createLeadDto.fname.toLowerCase().includes('test') ||
        createLeadDto.lname.toLowerCase().includes('test') ||
        createLeadDto.email.toLowerCase().includes('test') ||
        createLeadDto.funnel.toLowerCase().includes('test')
      ) {
        await this.logger.info(
          `Telegram notification skipped: Lead is a test lead`,
          lead.id,
          'telegram',
        );
      } else {
        await this.telegramService.sendTelegramNotification(lead, createLeadDto);
      }
    } catch (telegramError) {
      await this.logger.error(
        `Error sending Telegram notification: ${telegramError.message}`,
        lead.id,
        'telegram',
      );
    }

    return await this.crmService.sendDataToAlter(
      createLeadDto,
      createLeadDto.buyerId,
      createLeadDto.offerId,
      createLeadDto.flowId,
      lead.id,
    );
  }

  async toggleLeadDestination(
    destination: 'robotnik' | 'elnopy',
  ): Promise<{ currentDestination: string }> {
    this.isSendToRobotnik = destination === 'robotnik';
    await this.logger.info(`Lead destination switched to ${destination}`, 0, 'toggle');
    return {
      currentDestination: this.isSendToRobotnik ? 'robotnik' : 'elnopy',
    };
  }

  async getCurrentDestination(): Promise<{ currentDestination: string }> {
    return {
      currentDestination: this.isSendToRobotnik ? 'robotnik' : 'elnopy',
    };
  }

  /**
   * Generates a numeric buyer ID based on the buyer name provided.
   *
   * @param {string} buyer - The name of the buyer. Valid values include "vlasnyk", "legkokbbb", "taipan", "onion", "london", and "pool".
   * @return {number} The corresponding numeric buyer ID. Returns 0 if the buyer name does not match any predefined value.
   */
  private generate_buyer_id(buyer: string): number {
    return BUYER_IDS_MAP[buyer.toLowerCase()] ?? 0;
  }

  /**
   * Generates and returns a token based on the specified buyer identifier.
   *
   * @param {string} buyer - The identifier for the buyer to retrieve the corresponding token.
   *                         Valid values are "vlasnyk", "legkokbbb", "taipan", "onion", "london", "pool".
   * @return {string} The appropriate token for the specified buyer. If the buyer identifier
   *                  doesn't match any case, a default token is returned.
   */
  private generate_buyer_token(buyer: string): string {
    const env = this.config.get<Env>('', { infer: true });
    const defaultBuyerToken = '0blYEt43pwdAa2VKdgrjcVb3Z2Jj0bn0iWhNem1ZOLF9mjGbCvn3WL6Mker4';

    return createBuyerTokensMap(env)[buyer.toLowerCase()] ?? defaultBuyerToken;
  }
}
