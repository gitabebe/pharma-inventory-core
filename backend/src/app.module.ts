import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaService } from './prisma.service'; // <--- Import this
import { AuthModule } from './auth/auth.module';
import { HrModule } from './hr/hr.module';

@Module({
  imports: [InventoryModule, AuthModule, HrModule],
  controllers: [],
  providers: [PrismaService], // <--- Add this
})
export class AppModule {}