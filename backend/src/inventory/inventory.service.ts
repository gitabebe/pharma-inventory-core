import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class InventoryService {
  
  // 1. Add Stock
  async addBatch(productId: string, batchNumber: string, expiryDate: string, quantity: number) {
    return await prisma.batch.create({
      data: {
        productId,
        batchNumber,
        expiryDate: new Date(expiryDate),
        quantity,
      },
    });
  }

  // 2. FIFO Sale Logic
  async processSale(sku: string, quantityRequested: number) {
    return await prisma.$transaction(async (tx) => {
      
      // A. Get Product & Batches
      const product = await tx.product.findUnique({
        where: { sku },
        include: {
          batches: {
            where: { quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' }, // FIFO: Oldest first
          },
        },
      });

      if (!product) throw new BadRequestException(`Product SKU ${sku} not found`);

      let remainingToSell = quantityRequested;
      
      // FIX 1: Explicitly tell TypeScript this is an array of objects
      const deductions: any[] = []; 

      // B. Deduct Stock
      for (const batch of product.batches) {
        if (remainingToSell <= 0) break;

        const amountToTake = Math.min(batch.quantity, remainingToSell);

        await tx.batch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - amountToTake },
        });

        deductions.push({
          batchId: batch.id, // FIX 2: We must save the ID to link it later
          batchNumber: batch.batchNumber,
          deducted: amountToTake,
          expiry: batch.expiryDate.toISOString().split('T')[0],
        });

        remainingToSell -= amountToTake;
      }

      // C. Check Stock
      if (remainingToSell > 0) {
        throw new BadRequestException(
          `Insufficient stock! Only sold ${quantityRequested - remainingToSell}, still need ${remainingToSell}.`
        );
      }

      // D. Record Sale
      const sale = await tx.sale.create({
        data: {
          totalAmount: 0, 
          items: {
            create: deductions.map(d => ({
              quantity: d.deducted,
              price: 0,
              // FIX 3: Connect the specific Batch ID
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