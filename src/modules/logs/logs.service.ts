import { Injectable } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { LogSeverity } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogsFilterParams } from './dto/logs-filter.dto';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: LogsFilterParams) {
    const where: Record<string, unknown> = {};

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.context) {
      where.context = filters.context;
    }

    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    if (filters.startDate || filters.endDate) {
      const timestamp: Record<string, Date> = {};

      if (filters.startDate) {
        timestamp.gte = new Date(filters.startDate);
      }

      if (filters.endDate) {
        // Set endDate to end of day
        const endDateTime = new Date(filters.endDate);
        endDateTime.setHours(23, 59, 59, 999);
        timestamp.lte = endDateTime;
      }

      where.timestamp = timestamp;
    }

    if (filters.search) {
      where.message = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.logs.findMany({
        where,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        orderBy: { timestamp: 'desc' },
        include: { FBData: true, ConversionEvent: true },
      }),
      this.prisma.logs.count({ where }),
    ]);

    return { logs, total };
  }

  async findDistinctContexts(): Promise<string[]> {
    const contexts = await this.prisma.logs.findMany({
      select: { context: true },
      distinct: ['context'],
    });

    return contexts.map((c) => c.context).filter(Boolean) as string[];
  }

  async findById(id: number) {
    return this.prisma.logs.findUnique({
      where: { id },
      include: { FBData: true, ConversionEvent: true },
    });
  }

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
