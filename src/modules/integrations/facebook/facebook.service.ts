import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class FacebookService {
  constructor(private logger: LogsService) {}

  public async sendDataToFacebook(
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
      `Unable to send data to Facebook after ${maxAttempts} attempts`,
      leadData.id,
      'facebook',
      {
        fBDataId: leadData.FBData.id,
        conversionEventId: leadData.ConversionEvent.id,
      },
    );
    throw lastError;
  }
}
