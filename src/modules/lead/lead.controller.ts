import { Body, Controller, Get, Post } from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller()
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post('registration')
  async register(@Body() createLeadDto: CreateLeadDto): Promise<string> {
    return this.leadService.createLead(createLeadDto);
  }
}
