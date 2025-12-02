import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Use the injected service

@Injectable()
export class InventoryService {

  // Get Sales for the last 7 days
  async getWeeklyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: { items: true },
    });

    // Group by Day (Simple Aggregation)
    const stats: Record<string, number> = {};
    
    // Initialize last 7 days with 0
    for(let i=0; i<7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0]; // "2023-10-25"
        stats[dateStr] = 0;
    }

    // Fill in real data
    sales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      // Since we didn't save price in Sale model, we count Quantity sold
      const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      
      if (stats[dateStr] !== undefined) {
        stats[dateStr] += totalQty;
      }
    });

    // Convert to Array for Recharts
    return Object.entries(stats)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort Oldest -> Newest
  }
  
  // Inject the database service
  constructor(private prisma: PrismaService) {}
  
  // Get recent sales history
  async getSalesHistory() {
    return await this.prisma.sale.findMany({
      take: 20, // Limit to last 20 records
      orderBy: { createdAt: 'desc' }, // Newest first
      include: {
        items: {
          include: {
            batch: {
              include: { product: true } // We need the product name!
            }
          }
        }
      }
    });
  }

  async addBatch(productId: string, batchNumber: string, expiryDate: string, quantity: number) {
    return await this.prisma.batch.create({
      data: {
        productId,
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity,
      },
    });
  }

  async processSale(sku: string, quantityRequested: number) {
    // We use this.prisma instead of global prisma
    return await this.prisma.$transaction(async (tx) => {
      
      const product = await tx.product.findUnique({
        where: { sku },
        include: {
          batches: {
            where: { quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' }, 
          },
        },
      });

      if (!product) throw new BadRequestException(`Product SKU ${sku} not found`);

      let remainingToSell = quantityRequested;
      const deductions: any[] = []; 

      for (const batch of product.batches) {
        if (remainingToSell <= 0) break;
        const amountToTake = Math.min(batch.quantity, remainingToSell);

        await tx.batch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - amountToTake },
        });

        deductions.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          deducted: amountToTake,
          expiry: batch.expiryDate.toISOString().split('T')[0],
        });

        remainingToSell -= amountToTake;
      }

      if (remainingToSell > 0) {
        throw new BadRequestException(
          `Insufficient stock! Only sold ${quantityRequested - remainingToSell}, still need ${remainingToSell}.`
        );
      }

      await tx.sale.create({
        data: {
          totalAmount: 0, 
          items: {
            create: deductions.map(d => ({
              quantity: d.deducted,
              price: 0,
              batch: { connect: { id: d.batchId } } 
            }))
          }
        }
      });

      return {
        status: 'SUCCESS',
        message: `Sold ${quantityRequested} units using FIFO.`,
        details: deductions,
      };
    });
  }
}