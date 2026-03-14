import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

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
    return this.logsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 25,
      severity,
      context,
      leadId: leadId ? parseInt(leadId, 10) : undefined,
      startDate,
      endDate,
      search,
    });
  }

  @Get('contexts')
  async getContexts() {
    return this.logsService.findDistinctContexts();
  }

  @Get(':id')
  async getLogById(@Param('id', ParseIntPipe) id: number) {
    return this.logsService.findById(id);
  }
}
