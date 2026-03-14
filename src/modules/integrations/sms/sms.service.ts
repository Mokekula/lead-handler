import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Lead } from '@prisma/client';
import { Env } from 'src/common/config/env.validation';
import { LogsService } from 'src/logs/logs.service';

@Injectable()
export class SmsService {
  constructor(
    private logger: LogsService,
    private config: ConfigService<Env, true>,
  ) {}

  public async sendSmsNotification(lead: Lead): Promise<void> {
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
}
