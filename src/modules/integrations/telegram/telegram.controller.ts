import { Body, Controller, Get, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('telegram/webhook')
  async handleTelegramWebhook(@Body() update: any) {
    // Process commands from Telegram
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;

      // Handle /subscribe command
      if (text === '/subscribe') {
        const name = update.message.from.first_name;
        await this.telegramService.addTelegramSubscriber(chatId, name);
        return { success: true, message: 'Subscribed successfully' };
      }

      // Handle /unsubscribe command
      if (text === '/unsubscribe') {
        await this.telegramService.removeTelegramSubscriber(chatId);
        return { success: true, message: 'Unsubscribed successfully' };
      }
    }

    return { success: true };
  }
}
