import { Injectable } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService } from 'src/common/utils/hashing.service';
import { CrmService } from '../integrations/crm/crm.service';
import { TelegramService } from '../integrations/telegram/telegram.service';
import { FacebookService } from '../integrations/facebook/facebook.service';
import { CreateLeadDto } from './dto/create-lead.dto';

/**
 * Core lead processing orchestrator.
 * Creates lead records with related data (FBData, ConversionEvent, DeviceInfo),
 * then dispatches to Facebook Pixel, Telegram notifications, and CRM integration.
 */
@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService,
    private logger: LogsService,
    private hashingService: HashingService,
    private crmService: CrmService,
    private telegramService: TelegramService,
    private facebookService: FacebookService,
  ) {}

  // TODO: тут бажано додати інтеграційні тести для перевірки всього ланцюжка від створення ліда до відправки даних у фейсбук, телегу та CRM.
  // TODO: також бажано додати асінхронну обробку через черги (наприклад, BullMQ+Redis) для відправки даних у фейсбук (facebook-queue), телегу (telegram-queue) та CRM (crm-queue), щоб не блокувати основний потік обробки ліда
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
}
