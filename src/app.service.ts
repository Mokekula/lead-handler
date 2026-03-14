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
            em: this.sha256(createLeadDto.email?.toLowerCase() || ''),
            fn: this.sha256(createLeadDto.fname?.toLowerCase() || ''),
            ln: this.sha256(createLeadDto.lname?.toLowerCase() || ''),
            ph: this.sha256(createLeadDto.fullPhone || ''),
            country: this.sha256(createLeadDto.country || ''),
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
   * Computes the SHA-256 hash of a given input message.
   *
   * @param {string} message - The input message to hash.
   * @return {string} The computed SHA-256 hash as a hexadecimal string.
   */
  private sha256(message: string): string {
    // SHA-256 constants
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
      0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
      0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
      0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
      0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
      0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
      0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
      0xc67178f2,
    ];

    // Helper functions
    const ROTR = (n, x) => (x >>> n) | (x << (32 - n));
    const Ch = (x, y, z) => (x & y) ^ (~x & z);
    const Maj = (x, y, z) => (x & y) ^ (x & z) ^ (y & z);
    const Σ0 = (x) => ROTR(2, x) ^ ROTR(13, x) ^ ROTR(22, x);
    const Σ1 = (x) => ROTR(6, x) ^ ROTR(11, x) ^ ROTR(25, x);
    const σ0 = (x) => ROTR(7, x) ^ ROTR(18, x) ^ (x >>> 3);
    const σ1 = (x) => ROTR(17, x) ^ ROTR(19, x) ^ (x >>> 10);

    // Convert string to byte array
    const strToBytes = (str) => {
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
      }
      return bytes;
    };

    // Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes)
    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
      0x5be0cd19,
    ];

    // Pre-processing
    let bytes = strToBytes(message);
    const l = bytes.length * 8; // length in bits
    bytes.push(0x80); // append 1 bit followed by zeros
    while ((bytes.length * 8 + 64) % 512 !== 0) {
      bytes.push(0x00);
    }

    // Append original length as 64-bit big-endian integer
    const pad = new Array(8).fill(0);
    for (let i = 0; i < 8; i++) {
      pad[7 - i] = (l >>> (i * 8)) & 0xff;
    }
    bytes = bytes.concat(pad);

    // Process the message in 512-bit chunks
    for (let i = 0; i < bytes.length; i += 64) {
      const words = new Array(64).fill(0);

      // Create message schedule
      for (let j = 0; j < 16; j++) {
        words[j] =
          (bytes[i + j * 4] << 24) |
          (bytes[i + j * 4 + 1] << 16) |
          (bytes[i + j * 4 + 2] << 8) |
          bytes[i + j * 4 + 3];
      }

      for (let j = 16; j < 64; j++) {
        words[j] = (σ1(words[j - 2]) + words[j - 7] + σ0(words[j - 15]) + words[j - 16]) >>> 0;
      }

      // Initialize working variables
      let [a, b, c, d, e, f, g, h] = H;

      // Main loop
      for (let j = 0; j < 64; j++) {
        const T1 = (h + Σ1(e) + Ch(e, f, g) + K[j] + words[j]) >>> 0;
        const T2 = (Σ0(a) + Maj(a, b, c)) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + T1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (T1 + T2) >>> 0;
      }

      // Update hash values
      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }

    // Convert the final hash to hex string
    return H.map((h) => h.toString(16).padStart(8, '0')).join('');
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
