import { Module } from '@nestjs/common';
import { TelegramController } from './telegram/telegram.controller';
import { FacebookService } from './facebook/facebook.service';
import { TelegramService } from './telegram/telegram.service';
import { SmsService } from './sms/sms.service';
import { CrmService } from './crm/crm.service';

@Module({
  controllers: [TelegramController],
  providers: [CrmService, SmsService, TelegramService, FacebookService],
})
export class IntegrationsModule {}
