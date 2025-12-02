import { Module } from '@nestjs/common';
import { InventoryModule } from './inventory/inventory.module';
import { PrismaService } from './prisma.service'; // <--- Import this

@Module({
  imports: [InventoryModule],
  controllers: [],
  providers: [PrismaService], // <--- Add this
})
export class AppModule {}