import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from '../prisma.service'; // <--- IMPORT THIS

@Module({
  controllers: [InventoryController],
  providers: [
    InventoryService, 
    PrismaService // <--- ADD THIS (This fixes the crash)
  ],
})
export class InventoryModule {}