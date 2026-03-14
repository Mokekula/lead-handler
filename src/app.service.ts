import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogsService } from './logs/logs.service';
import type { Env } from './common/config/env.validation';
import { BUYER_IDS_MAP, createBuyerTokensMap } from './common/config/buyers.const';

/**
 * The AppService class provides methods for handling lead creation,
 * interaction with Facebook APIs, and supporting utility methods.
 * It includes database operations managed via Prisma, along with
 * data logging using the LogsService.
 */
@Injectable()
export class AppService {
  private isSendToRobotnik: boolean = true;

  constructor(
    private logger: LogsService,
    private config: ConfigService<Env, true>,
  ) {}

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

  /**
   * Generates a numeric buyer ID based on the buyer name provided.
   *
   * @param {string} buyer - The name of the buyer. Valid values include "vlasnyk", "legkokbbb", "taipan", "onion", "london", and "pool".
   * @return {number} The corresponding numeric buyer ID. Returns 0 if the buyer name does not match any predefined value.
   */
  private generate_buyer_id(buyer: string): number {
    return BUYER_IDS_MAP[buyer.toLowerCase()] ?? 0;
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
    const env = this.config.get<Env>('', { infer: true });
    const defaultBuyerToken = '0blYEt43pwdAa2VKdgrjcVb3Z2Jj0bn0iWhNem1ZOLF9mjGbCvn3WL6Mker4';

    return createBuyerTokensMap(env)[buyer.toLowerCase()] ?? defaultBuyerToken;
  }
}
