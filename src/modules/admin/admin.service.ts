import { Injectable } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';

/**
 * Admin control service for managing lead routing.
 * Handles toggling between CRM destinations (Robotnik/Elnopy).
 */
@Injectable()
export class AdminService {
  // TODO: не бажано зберігати стан в пам'яті, краще зберігати в базі даних або кеші
  private isSendToRobotnik: boolean = true;

  constructor(private logger: LogsService) {}

  async toggleLeadDestination(
    destination: 'robotnik' | 'elnopy',
  ): Promise<{ currentDestination: string }> {
    this.isSendToRobotnik = destination === 'robotnik';

    await this.logger.info(`Lead destination switched to ${destination}`, 0, 'toggle');

    return {
      currentDestination: this.isSendToRobotnik ? 'robotnik' : 'elnopy',
    };
  }

  async getCurrentLeadDestination(): Promise<{ currentDestination: string }> {
    return {
      currentDestination: this.isSendToRobotnik ? 'robotnik' : 'elnopy',
    };
  }
}
