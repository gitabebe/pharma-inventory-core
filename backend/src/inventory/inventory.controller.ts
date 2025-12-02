import { Controller, Post, Body, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // 1. Create Product (Removed 'price' to match your Schema)
  @Post('product')
  async createProduct(@Body() body: { name: string; sku: string }) {
    return await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        // price is removed because it is not in your schema.prisma
      }
    });
  }

  // 2. Receive Stock (Add Batch)
  @Post('batch')
  async addBatch(@Body() body: { productId: string; batchNumber: string; expiry: string; qty: number }) {
    return this.inventoryService.addBatch(body.productId, body.batchNumber, body.expiry, body.qty);
  }

  // 3. Sell Stock (FIFO)
  @Post('sell')
  async sellProduct(@Body() body: { sku: string; qty: number }) {
    return this.inventoryService.processSale(body.sku, body.qty);
  }

  // 4. View All Stock
  @Get()
  async getStock() {
    return await prisma.product.findMany({
      include: { batches: true }
    });
  }
}