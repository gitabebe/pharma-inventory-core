import { Controller, Post, Get, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // Get User's Status
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async getStatus(@Request() req: any) {
    // The "req.user" comes from the JWT Token we built earlier
    return this.hrService.getStatus(req.user.userId);
  }

  // Clock In
  @UseGuards(AuthGuard('jwt'))
  @Post('clock-in')
  async clockIn(@Request() req: any) {
    return this.hrService.clockIn(req.user.userId);
  }

  // Clock Out
  @UseGuards(AuthGuard('jwt'))
  @Post('clock-out')
  async clockOut(@Request() req: any) {
    return this.hrService.clockOut(req.user.userId);
  }
}