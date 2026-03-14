import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CreateLeadDto } from './lead.dto';
import { Lead } from '@prisma/client';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('registration')
  async register(@Body() createLeadDto: CreateLeadDto): Promise<string> {
    return this.appService.createLead(createLeadDto);
  }

  @Post('toggle-destination')
  async toggleDestination(
    @Body() body: { destination: 'robotnik' | 'elnopy' },
  ): Promise<{ currentDestination: string }> {
    return this.appService.toggleLeadDestination(body.destination);
  }

  @Get('current-destination')
  async getCurrentDestination(): Promise<{ currentDestination: string }> {
    return this.appService.getCurrentDestination();
  }

  @Post('telegram/webhook')
  async handleTelegramWebhook(@Body() update: any) {
    // Process commands from Telegram
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;

      // Handle /subscribe command
      if (text === '/subscribe') {
        const name = update.message.from.first_name;
        await this.appService.addTelegramSubscriber(chatId, name);
        return { success: true, message: 'Subscribed successfully' };
      }

      // Handle /unsubscribe command
      if (text === '/unsubscribe') {
        await this.appService.removeTelegramSubscriber(chatId);
        return { success: true, message: 'Unsubscribed successfully' };
      }
    }

    return { success: true };
  }
}
