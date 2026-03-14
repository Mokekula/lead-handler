import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
