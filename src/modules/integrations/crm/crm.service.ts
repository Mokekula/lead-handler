import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Env } from 'src/common/config/env.validation';
import { CreateLeadDto } from 'src/modules/lead/dto/create-lead.dto';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class CrmService {
  constructor(
    private logger: LogsService,
    private config: ConfigService<Env, true>,
  ) {}

  public async sendDataToRobotnikTogler(send: boolean): Promise<void> {
    if (send) {
      await this.logger.info('Sending data to Robotnik', 0o7, 'robotnik');
    } else {
      await this.logger.info('Not sending data to Robotnik', 0o7, 'robotnik');
    }
  }

  public async sendToRobotnik(createLeadDto: CreateLeadDto, leadId: number): Promise<string> {
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

  /**
   * Sends lead data to the Elnopy API for processing and integration.
   *
   * @param {CreateLeadDto} createLeadDto - An object containing lead details such as name, email, IP address, phone, country, and other relevant information required by the API.
   * @param {string} linkId - A unique identifier for the link associated with the lead.
   * @param {string} token - The API token used to authenticate the request to Elnopy.
   * @param {number} leadId - A unique identifier for the lead, used for logging purposes.
   * @return {Promise<string>} A promise that resolves to the autologin URL returned by the Elnopy API if the request is successful, or rejects with an error if the request fails.
   */
  public async sendDataToElnopy(
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

  public async sendDataToAlter(
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
}
