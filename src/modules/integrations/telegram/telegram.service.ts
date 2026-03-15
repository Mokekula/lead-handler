import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { Lead } from '@prisma/client';
import axios from 'axios';
import { Env } from 'src/common/config/env.validation';
import { CreateLeadDto } from 'src/modules/lead/dto/create-lead.dto';
import { LogsService } from 'src/modules/logs/logs.service';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Telegram Bot API integration service.
 * Manages subscriber list and sends formatted lead notifications
 * to all active subscribers via Telegram Bot API.
 */
@Injectable()
export class TelegramService {
  private readonly telegramBotToken: string;

  constructor(
    private prisma: PrismaService,
    private logger: LogsService,
    private config: ConfigService<Env, true>,
  ) {
    this.telegramBotToken = this.config.get('TELEGRAM_BOT_TOKEN');
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
  public async sendTelegramNotification(lead: Lead, createLeadDto: CreateLeadDto): Promise<void> {
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
        await axios({
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
