import { Body, Controller, Get, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('toggle-destination')
  async toggleDestination(
    @Body() body: { destination: 'robotnik' | 'elnopy' },
  ): Promise<{ currentDestination: string }> {
    return this.adminService.toggleLeadDestination(body.destination);
  }

  @Get('current-destination')
  async getCurrentDestination(): Promise<{ currentDestination: string }> {
    return this.adminService.getCurrentLeadDestination();
  }
}
