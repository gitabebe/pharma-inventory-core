import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // 1. Get Current Status (Are they working right now?)
  async getStatus(userId: string) {
    // Look for an "Open" session (where checkOut is null)
    const activeSession = await this.prisma.attendance.findFirst({
      where: {
        userId: userId,
        checkOut: null
      }
    });
    return { isWorking: !!activeSession, session: activeSession };
  }

  // 2. Clock In
  async clockIn(userId: string) {
    // Rule: Check if already working
    const activeSession = await this.prisma.attendance.findFirst({
      where: { userId, checkOut: null }
    });

    if (activeSession) {
      throw new BadRequestException("You are already clocked in!");
    }

    return await this.prisma.attendance.create({
      data: { userId } // checkIn defaults to NOW()
    });
  }

  // 3. Clock Out
  async clockOut(userId: string) {
    // Rule: Find the open session
    const activeSession = await this.prisma.attendance.findFirst({
      where: { userId, checkOut: null }
    });

    if (!activeSession) {
      throw new BadRequestException("You have not clocked in yet.");
    }

    // Update the record with the current time
    return await this.prisma.attendance.update({
      where: { id: activeSession.id },
      data: { checkOut: new Date() }
    });
  }
}