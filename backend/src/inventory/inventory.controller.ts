import { Controller, Post, Body, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // 1. Create Product (Removed 'price' to match your Schema)
  //@UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  @Post('batch')
  async addBatch(@Body() body: { productId: string; batchNumber: string; expiry: string; qty: number }) {
    return this.inventoryService.addBatch(body.productId, body.batchNumber, body.expiry, body.qty);
  }

  // 3. Sell Stock (FIFO)
  @UseGuards(AuthGuard('jwt'))
  @Post('sell')
  async sellProduct(@Body() body: { sku: string; qty: number }) {
    return this.inventoryService.processSale(body.sku, body.qty);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async getHistory() {
    return this.inventoryService.getSalesHistory();
  }

   @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  async getStats() {
    return this.inventoryService.getWeeklyStats();
  }

   @UseGuards(AuthGuard('jwt'))
  @Get('report')
  async downloadReport(@Res() res: Response) {
    const buffer = await this.inventoryService.generateReport();

    // Tell the browser: "This is a PDF file, please download it"
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=pharmacore-report.pdf',
    });

    buffer.pipe(res);
  }


  //@UseGuards(AuthGuard('jwt'))
  @Get()
  async getStock() {
    return await prisma.product.findMany({
      include: { batches: true }
    });
  }
}