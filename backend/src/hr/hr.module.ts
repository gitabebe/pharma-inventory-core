import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';
import { PrismaService } from '../prisma.service'; // <--- Import

@Module({
  controllers: [HrController],
  providers: [HrService, PrismaService], // <--- Add Here
})
export class HrModule {}