import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogDto } from './create-log.dto';
import { LogSeverity } from '@prisma/client';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new log entry
   */
  async createLog(createLogDto: CreateLogDto) {
    return this.prisma.logs.create({
      data: {
        ...createLogDto,
      },
    });
  }

  /**
   * Log with debug severity
   */
  async debug(message: string, leadId: number, metadata?: Partial<CreateLogDto>) {
    return this.createLog({
      message,
      severity: LogSeverity.DEBUG,
      context: 'debug',
      leadId,
      ...metadata,
    });
  }

  /**
   * Log with info severity
   */
  async info(message: string, leadId: number, context: string, metadata?: Partial<CreateLogDto>) {
    return this.createLog({
      message,
      severity: LogSeverity.INFO,
      leadId,
      context: context ? context : 'general',
      ...metadata,
    });
  }

  /**
   * Log with warning severity
   */
  async warning(message: string, leadId: number, metadata?: Partial<CreateLogDto>) {
    return this.createLog({
      message,
      severity: LogSeverity.WARNING,
      leadId,
      ...metadata,
    });
  }

  /**
   * Log with error severity
   */
  async error(message: string, leadId: number, context: string, metadata?: Partial<CreateLogDto>) {
    return this.createLog({
      message,
      severity: LogSeverity.ERROR,
      leadId,
      context: context ? context : 'error',
      ...metadata,
    });
  }

  /**
   * Log with critical severity
   */
  async critical(message: string, leadId: number, metadata?: Partial<CreateLogDto>) {
    return this.createLog({
      message,
      severity: LogSeverity.CRITICAL,
      leadId,
      ...metadata,
    });
  }
}
