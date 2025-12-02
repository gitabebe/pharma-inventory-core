import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service'; // Use the injected service

@Injectable()
export class InventoryService {
  // Inject the database service
  constructor(private prisma: PrismaService) {}

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