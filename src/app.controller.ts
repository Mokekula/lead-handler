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
}
