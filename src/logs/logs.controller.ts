import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/logs')
export class LogsController {
  constructor(
    private logsService: LogsService,
    private prisma: PrismaService,
  ) {}

  @Get('')
  async getLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('severity') severity?: string,
    @Query('context') context?: string,
    @Query('leadId') leadId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 25;
    const leadIdNum = leadId ? parseInt(leadId, 10) : undefined;

    // Build where conditions based on filters
    const where: any = {};

    if (severity) {
      where.severity = severity;
    }

    if (context) {
      where.context = context;
    }

    if (leadIdNum) {
      where.leadId = leadIdNum;
    }

    if (startDate || endDate) {
      where.timestamp = {};

      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }

      if (endDate) {
        // Set endDate to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.timestamp.lte = endDateTime;
      }
    }

    if (search) {
      where.message = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count for pagination
    const total = await this.prisma.logs.count({ where });

    // Get logs with pagination
    const logs = await this.prisma.logs.findMany({
      where,
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        FBData: true,
        ConversionEvent: true,
      },
    });

    return { logs, total };
  }

  @Get('contexts')
  async getContexts() {
    const contexts = await this.prisma.logs.findMany({
      select: {
        context: true,
      },
      distinct: ['context'],
    });

    return contexts.map((c) => c.context).filter(Boolean);
  }

  @Get(':id')
  async getLogById(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.logs.findUnique({
      where: { id },
      include: {
        FBData: true,
        ConversionEvent: true,
      },
    });
  }
}
