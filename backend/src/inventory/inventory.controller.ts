import { Controller, Get, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  getInventory() {
    return this.inventoryService.getInventory();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  getHistory() {
    return this.inventoryService.getSalesHistory();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  getStats() {
    return this.inventoryService.getWeeklyStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('report')
  async downloadReport(@Res() res: Response) {
    const buffer = await this.inventoryService.generateReport();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=report.pdf',
    });
    buffer.pipe(res);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('sell')
  sellProduct(@Request() req: any, @Body() body: { sku: string; qty: number }) {
    return this.inventoryService.processSale(body.sku, body.qty, req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('batch')
  addBatch(@Body() body: { productId: string; batchNumber: string; expiry: string; qty: number; cost: number }) {
    return this.inventoryService.addBatch(body.productId, body.batchNumber, body.expiry, body.qty, body.cost);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('transfer')
  transferStock(@Body() body: { sku: string; qty: number }) {
    return this.inventoryService.transferStock(body.sku, body.qty);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('product')
  createProduct(@Body() body: { name: string; sku: string; minStock: number }) {
    return this.inventoryService.createProduct(body.name, body.sku, body.minStock);
  }
}