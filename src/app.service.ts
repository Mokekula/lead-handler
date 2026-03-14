import { HashingService } from './common/utils/hashing.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateLeadDto } from './lead.dto';
import { Lead } from '@prisma/client';
import { PrismaService } from './prisma/prisma.service';
import axios from 'axios';
import { LogsService } from './logs/logs.service';
import type { Env } from './common/config/env.validation';

/**
 * The AppService class provides methods for handling lead creation,
 * interaction with Facebook APIs, and supporting utility methods.
 * It includes database operations managed via Prisma, along with
 * data logging using the LogsService.
 */
@Injectable()
export class AppService {
  private readonly telegramBotToken: string;
  private isSendToRobotnik: boolean = true;

  constructor(
    private prisma: PrismaService,
    private logger: LogsService,
    private config: ConfigService<Env, true>,
    private hashingService: HashingService,
  ) {
    this.telegramBotToken = this.config.get('TELEGRAM_BOT_TOKEN');
  }

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
        await this.sendDataToFacebook('Lead', lead, createLeadDto.fbToken, createLeadDto.pixel);
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
        await this.sendTelegramNotification(lead, createLeadDto);
      }
    } catch (telegramError) {
      await this.logger.error(
        `Error sending Telegram notification: ${telegramError.message}`,
        lead.id,
        'telegram',
      );
    }

    return await this.sendDataToAlter(
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

  async sendDataToRobotnikTogler(send: boolean): Promise<void> {
    if (send) {
      await this.logger.info('Sending data to Robotnik', 0o7, 'robotnik');
    } else {
      await this.logger.info('Not sending data to Robotnik', 0o7, 'robotnik');
    }
  }

  async sendToRobotnik(createLeadDto: CreateLeadDto, leadId: number): Promise<string> {
    try {
      const data = {
        query: `mutation CreateLeadFromApi($input: CreateLeadApiInput!) {
          createLeadFromApi(input: $input) {
            autologin
          }
        }
        `,
        variables: {
          input: {
            email: createLeadDto.email,
            fullPhone: createLeadDto.fullPhone,
            country: createLeadDto.country,
            iso: createLeadDto.iso,
            language: createLeadDto.language,
            buyer: createLeadDto.buyer,
            source: createLeadDto.source,
            clickid: createLeadDto.clickid,
            firstName: createLeadDto.fname,
            lastName: createLeadDto.lname,
            ip: createLeadDto.ip,
            funnel: createLeadDto.funnel,
            domain: createLeadDto.domain,
            adset_name: createLeadDto.adsetName,
            ad_name: createLeadDto.adName,
            utm_source: createLeadDto.utmSource,
            utm_campaign: createLeadDto.utmCampaign,
            utm_content: createLeadDto.utmContent,
            deviceInfo: {
              language: createLeadDto.language,
              deviceType: createLeadDto.deviceType,
              userAgent: createLeadDto.userAgent,
              os: createLeadDto.os,
              osVersion: createLeadDto.osVersion,
              browser: createLeadDto.browser,
              browserVersion: createLeadDto.browserVersion,
              ip: createLeadDto.ip,
            },
          },
        },
      };

      console.log(this.config.get('ROBOTNIK_URL'));

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: this.config.get('ROBOTNIK_URL'),
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-apollo-operation-name': 'CreateLeadFromApi',
          'apollo-require-preflight': 'true',
        },
        data: data,
      };

      const response = await axios(config);

      if (response.data.errors) {
        await this.logger.error(
          `Error sending data to Robotnik: ${response.data.errors[0].message}`,
          leadId,
          'robotnik',
        );
        return response.data.errors[0].message;
      }

      await this.logger.info(
        `Data sent to Robotnik: ${JSON.stringify(response.data)}`,
        leadId,
        'robotnik',
      );

      if (response.data.data.createLeadFromApi.autologin) {
        return response.data.data.createLeadFromApi.autologin;
      } else {
        return 'https://google.com';
      }
    } catch (error) {
      if (!error.response) {
        await this.logger.error(`Error sending data to Robotnik: ${error}`, leadId, 'robotnik');
        return 'Something went wrong, please try again later';
      }
      await this.logger.error(
        `Error sending data to Robotnik: ${error.response.data}`,
        leadId,
        'robotnik',
      );
      return error.response.data;
    }
  }

  async sendSmsNotification(lead: Lead): Promise<void> {
    try {
      if (!lead.email.includes('test') && lead.fullPhone) {
        const response = await axios({
          method: 'POST',
          url: 'https://im.smsclub.mobi/sms/send',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.get('SMSCLUB_API_KEY')}`,
          },
          data: {
            src_addr: 'Vebinar',
            phone: [lead.fullPhone],
            message:
              'Ihre Anmeldung wurde erfolgreich bestätigt! Wir werden Sie in Kürze kontaktieren, um alle Details zu besprechen und Ihre Fragen zu beantworten.',
          },
        });

        if (response.status === 200) {
          await this.logger.info(`SMS sent successfully`, lead.id, 'sms');
        } else {
          await this.logger.error(`SMS sending failed: ${response.statusText}`, lead.id, 'sms');
        }
      }
    } catch (error) {
      await this.logger.error(`SMS sending error: ${error.message}`, lead.id, 'sms');
    }
  }

  /**
   * Sends lead data to the Elnopy API for processing and integration.
   *
   * @param {CreateLeadDto} createLeadDto - An object containing lead details such as name, email, IP address, phone, country, and other relevant information required by the API.
   * @param {string} linkId - A unique identifier for the link associated with the lead.
   * @param {string} token - The API token used to authenticate the request to Elnopy.
   * @param {number} leadId - A unique identifier for the lead, used for logging purposes.
   * @return {Promise<string>} A promise that resolves to the autologin URL returned by the Elnopy API if the request is successful, or rejects with an error if the request fails.
   */
  async sendDataToElnopy(
    createLeadDto: CreateLeadDto,
    linkId: string,
    token: string,
    leadId: number,
  ): Promise<string> {
    const dataForElnopy = {
      link_id: linkId,
      api_token: token,
      fname: createLeadDto.fname,
      lname: createLeadDto.lname,
      email: createLeadDto.email,
      ip: createLeadDto.ip,
      fullphone: createLeadDto.fullPhone,
      country: createLeadDto.country,
      language: createLeadDto.language,
      funnel: createLeadDto.funnel,
      source: createLeadDto.funnel,
      utm_source: createLeadDto.utmSource,
      utm_campaign: createLeadDto.adsetName,
      click_id: createLeadDto.clickid,
      utm_content: createLeadDto.adName,
      c_cid: createLeadDto.externalId,
    };

    try {
      const response = await axios({
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        url: `......`,
        timeout: 20000,
        data: dataForElnopy,
      });

      if (response.data && response.data.success === true) {
        // Success case - return the autologin URL
        await this.logger.info(
          `Elnopy API Response: ${JSON.stringify(response.data)}`,
          leadId,
          'elnopy',
        );
        if (response.data.autologin !== null) {
          return response.data.autologin;
        }
        return 'https://google.com';
      } else {
        const errorMessage = response.data?.message || 'Unknown API error';
        // Log the error
        await this.logger.info(
          `Elnopy API Error: ${JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            data: response.data,
          })}`,
          leadId,
          'elnopy',
        );
        // return response.data?.autologin || 'https://google.com';
        // throw new Error(errorMessage);

        if (
          response.data?.success === false &&
          response.data?.message === 'Phone number not valid!'
        ) {
          throw new Error(errorMessage);
        } else {
          // For all other cases, return google.com or autologin if available
          return response.data?.autologin || 'https://google.com';
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      await this.logger.error(
        `Elnopy API Error: ${JSON.stringify({
          message: error.message,
          code: error.code,
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
              }
            : null,
        })}`,
        leadId,
        'elnopy',
      );

      throw new Error(errorMessage);
    }
  }

  async sendDataToAlter(
    createLeadDto: CreateLeadDto,
    buyerId: string,
    offerId: string,
    flowId: string,
    leadId: number,
  ): Promise<string> {
    const dataForAlter = {
      name: createLeadDto.fname,
      surname: createLeadDto.lname,
      email: createLeadDto.email,
      phone: createLeadDto.fullPhone || createLeadDto.phone,
      country_code: createLeadDto.country,
      phone_code: createLeadDto.iso,
      subid: createLeadDto.clickid,
      sub1: createLeadDto.sub1,
      sub2: createLeadDto.sub2,
      sub3: createLeadDto.sub3,
      sub4: createLeadDto.sub4,
      sub5: createLeadDto.sub5,
      utm_campaign: createLeadDto.utmCampaign,
      utm_source: createLeadDto.utmSource,
      ad_name: createLeadDto.adName,
      utm_placement: createLeadDto.utmPlacement,
      campaign_id: createLeadDto.campaignId,
      adset_id: createLeadDto.adsetId,
      pixel: createLeadDto.pixel,
      ad_id: createLeadDto.adId,
      adset_name: createLeadDto.adsetName,
      ip: createLeadDto.ip,
      ua: createLeadDto.userAgent,
      domain: createLeadDto.domain,
    };

    await this.logger.info(`Data for Alter: ${JSON.stringify(dataForAlter)}`, leadId, 'alter');

    try {
      const response = await axios({
        method: 'post',
        url: `.......`,
        timeout: 30000,
        data: dataForAlter,
      });

      if (response.data.status === 'ok') {
        await this.logger.info(
          `Alter API Response: ${JSON.stringify(response.data)}`,
          leadId,
          'alter',
        );
        if (response.data?.url) {
          return response.data.url;
        } else {
          return 'https://google.com';
        }
      } else {
        await this.logger.error(
          `Alter API Error: ${JSON.stringify(response.data)}`,
          leadId,
          'alter',
        );
        return response.data.error;
      }
    } catch (error) {
      await this.logger.error(`Alter API Error: ${JSON.stringify(error)}`, leadId, 'alter');
      throw new Error(error.message);
    }
  }

  async sendDataToFacebook(
    eventName: string,
    leadData: Record<string, any>,
    fbToken: string,
    fbPixel: string,
  ): Promise<Record<string, any> | null> {
    let attempt = 0;
    const maxAttempts = 3;
    let lastError;

    if (!fbToken || !fbPixel) {
      return null;
    }

    const eventId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    const data = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          user_data: (({ id, leadId, ...rest }) => rest)(leadData.FBData),
          custom_data: (({ id, leadId, createdAt, ...rest }) => rest)(leadData.ConversionEvent),
        },
      ],
      // Uncomment for testing
      // test_event_code: 'TEST4608'
    };

    while (attempt < maxAttempts) {
      attempt++;
      await this.logger.info(
        `Attempt ${attempt} to send data to Facebook, with event: ${eventName}`,
        leadData.id,
        'facebook',
      );
      try {
        const response = await axios({
          method: 'post',
          url: `https://graph.facebook.com/v22.0/${fbPixel}/events?access_token=${fbToken}`,
          data: data,
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        });

        await this.logger.info(
          `Facebook API Response: ${JSON.stringify(response.data)}`,
          leadData.id,
          'facebook',
          {
            fBDataId: leadData.FBData.id,
            conversionEventId: leadData.ConversionEvent.id,
          },
        );

        return response.data;
      } catch (error) {
        lastError = error;
        if (error.response) {
          await this.logger.error(
            `Facebook API Error (HTTP ${error.response.status}): ${JSON.stringify(error.response.data)}`,
            leadData.id,
            'facebook',
            {
              fBDataId: leadData.FBData.id,
              conversionEventId: leadData.ConversionEvent.id,
            },
          );
          if (
            error.response.status >= 400 &&
            error.response.status < 500 &&
            error.response.status !== 429
          ) {
            break;
          }
        }

        if (attempt < maxAttempts) {
          // Добавляем экспоненциальную задержку перед следующей попыткой
          // 1 попытка - 1 секунда, 2 попытка - 2 секунды, 3 попытка - 4 секунды и т.д.
          const delayMs = 1000 * Math.pow(2, attempt - 1);
          await this.logger.info(`Retrying in ${delayMs}ms`, leadData.id, 'facebook');
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        // return null;
      }
    }

    // Если все попытки использованы, но ответа нет
    await this.logger.error(
      `Не удалось отправить данные в Facebook после ${maxAttempts} попыток`,
      leadData.id,
      'facebook',
      {
        fBDataId: leadData.FBData.id,
        conversionEventId: leadData.ConversionEvent.id,
      },
    );
    throw lastError;
  }

  /**
   * Generates a numeric buyer ID based on the buyer name provided.
   *
   * @param {string} buyer - The name of the buyer. Valid values include "vlasnyk", "legkokbbb", "taipan", "onion", "london", and "pool".
   * @return {number} The corresponding numeric buyer ID. Returns 0 if the buyer name does not match any predefined value.
   */
  private generate_buyer_id(buyer: string): number {
    switch (buyer) {
      case 'vlasnyk':
        return 4;
        break;
      case 'legkokbbb':
        return 5;
        break;
      case 'taipan':
        return 6;
        break;
      case 'onion':
        return 11;
        break;
      case 'london':
        return 13;
        break;
      case 'pool':
        return 16;
        break;
      default:
        return 0;
        break;
    }
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
    const vlasnykToken = this.config.get('VLASNYK_TOKEN');
    const legkokbbbToken = this.config.get('LEGKOKBBB_TOKEN');
    const taipanToken = this.config.get('TAIPAN_TOKEN');
    const onionToken = this.config.get('ONION_TOKEN');
    const londonToken = this.config.get('LONDON_TOKEN');
    const poolToken = this.config.get('POOL_TOKEN');

    switch (buyer) {
      case 'vlasnyk':
        return vlasnykToken;
        break;
      case 'legkokbbb':
        return legkokbbbToken;
        break;
      case 'taipan':
        return taipanToken;
        break;
      case 'onion':
        return onionToken;
        break;
      case 'london':
        return londonToken;
        break;
      case 'pool':
        return poolToken;
        break;
      default:
        return '0blYEt43pwdAa2VKdgrjcVb3Z2Jj0bn0iWhNem1ZOLF9mjGbCvn3WL6Mker4';
        break;
    }
  }

  /**
   * Adds a new Telegram subscriber to the database
   *
   * @param chatId The Telegram chat ID to subscribe
   * @param name Optional name for the subscriber
   * @returns The created subscriber record
   */
  async addTelegramSubscriber(chatId: string, name?: string) {
    return this.prisma.telegramSubscriber.upsert({
      where: { chatId },
      update: {
        isActive: true,
        name: name || undefined,
      },
      create: {
        chatId,
        name: name || undefined,
        isActive: true,
      },
    });
  }

  /**
   * Removes a Telegram subscriber (sets as inactive)
   *
   * @param chatId The Telegram chat ID to unsubscribe
   * @returns The updated subscriber record
   */
  async removeTelegramSubscriber(chatId: string) {
    return this.prisma.telegramSubscriber.update({
      where: { chatId },
      data: { isActive: false },
    });
  }

  /**
   * Gets all active Telegram subscribers
   *
   * @returns Array of active subscribers
   */
  async getActiveTelegramSubscribers() {
    return this.prisma.telegramSubscriber.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Sends a notification to all subscribed Telegram users about a new lead.
   *
   * @param {Lead} lead - The lead data to include in the notification
   * @param {CreateLeadDto} createLeadDto - The DTO containing lead information
   * @return {Promise<void>} A promise that resolves when all notifications are sent
   */
  private async sendTelegramNotification(lead: Lead, createLeadDto: CreateLeadDto): Promise<void> {
    if (!this.telegramBotToken) {
      await this.logger.info(
        `Telegram notification skipped: Missing bot token`,
        lead.id,
        'telegram',
      );
      return;
    }

    // Get all active subscribers
    const subscribers = await this.getActiveTelegramSubscribers();

    if (subscribers.length === 0) {
      await this.logger.info(
        `Telegram notification skipped: No active subscribers`,
        lead.id,
        'telegram',
      );
      return;
    }

    // Construct the message with relevant lead information
    const message =
      `🔔 *NEW LEAD*\n` +
      `ID: \`${lead.id}\`\n` +
      `Name: *${createLeadDto.fname} ${createLeadDto.lname}*\n` +
      `Email: ${createLeadDto.email}\n` +
      `Phone: \`${createLeadDto.fullPhone}\`\n` +
      `Country: ${createLeadDto.country}\n` +
      `Buyer: *${createLeadDto.buyer}*\n` +
      `Funnel: ${createLeadDto.funnel}\n` +
      `Source: ${createLeadDto.source || 'N/A'}\n` +
      `UTM Source: ${createLeadDto.utmSource || 'N/A'}\n` +
      `UTM Campaign: ${createLeadDto.utmCampaign || 'N/A'}\n` +
      `Created: ${new Date().toISOString()}`;

    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    const successfulNotifications = [];
    const failedNotifications = [];

    // Send to all subscribers
    for (const subscriber of subscribers) {
      try {
        const response = await axios({
          method: 'post',
          url: url,
          data: {
            chat_id: subscriber.chatId,
            text: message,
            parse_mode: 'Markdown',
          },
          timeout: 10000,
        });

        successfulNotifications.push(subscriber.chatId);
      } catch (error) {
        failedNotifications.push(subscriber.chatId);
        await this.logger.error(
          `Failed to send Telegram notification to chat ID ${subscriber.chatId}: ${error.message}`,
          lead.id,
          'telegram',
        );
        // Continue with other subscribers even if one fails
      }
    }

    await this.logger.info(
      `Telegram notifications summary: ${successfulNotifications.length} sent, ${failedNotifications.length} failed`,
      lead.id,
      'telegram',
    );
  }
}
