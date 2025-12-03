import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { HrService } from './hr.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';

@Controller('hr')
export class HrController {
  constructor(private hrService: HrService, private prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('performance')
  async getPerformance(@Request() req: any) {
    const role = req.user.role;
    const myId = req.user.userId;

    // RULE: HR sees everyone. Everyone else sees ONLY themselves.
    if (role === 'HR_MANAGER') {
      return this.hrService.getPerformanceStats(); // Returns full list
    } else {
      // Filter the list to show only the logged-in user
      const allStats = await this.hrService.getPerformanceStats();
      const myStats = allStats.filter(stat => stat.email === req.user.email);
      return myStats;
    }
  }
}