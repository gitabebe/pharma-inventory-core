import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument = require('pdfkit'); // <--- THIS WAS MISSING

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // 1. GET ALL STOCK (Warehouse + Store)
  // Logic: Managers need to see everything, filtering happens on Frontend
  async getInventory() {
    return this.prisma.product.findMany({
      include: {
        batches: {
          where: { quantity: { gt: 0 } }, 
          include: { location: true },
          orderBy: { expiryDate: 'asc' }
        }
      }
    });
  }

  // 2. PROCESS SALE (Safety Logic)
  async processSale(sku: string, quantitySold: number, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { sku },
        include: { 
          batches: { 
            // Sales still only happen from STORE location
            where: { quantity: { gt: 0 }, location: { type: 'STORE' } },
            orderBy: { expiryDate: 'asc' } 
          } 
        },
      });

      if (!product) throw new NotFoundException('Product not found or out of stock in Shop');

      // Safety: Check Expiry
      const today = new Date();
      const expiredBatch = product.batches.find(b => new Date(b.expiryDate) < today);
      if (expiredBatch) throw new BadRequestException(`Batch ${expiredBatch.batchNumber} has EXPIRED.`);

      // Safety: Check Stock
      const totalStock = product.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock < quantitySold) throw new BadRequestException(`Insufficient Shop stock! Have ${totalStock}.`);

      const sale = await tx.sale.create({ data: { userId: userId, totalAmount: 0 } });
      let remaining = quantitySold;
      let total = 0;

      for (const batch of product.batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.quantity, remaining);
        const price = Number(batch.costPrice) * 1.5 || 10; 

        await tx.batch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - take } });
        await tx.saleItem.create({ data: { saleId: sale.id, batchId: batch.id, quantity: take, price: price } });

        total += take * price;
        remaining -= take;
      }

      await tx.sale.update({ where: { id: sale.id }, data: { totalAmount: total } });
      return { status: 'SUCCESS' };
    });
  }

  // 3. TRANSFER (Warehouse -> Store)
  async transferStock(sku: string, qty: number) {
    return await this.prisma.$transaction(async (tx) => {
      const warehouse = await tx.location.findFirst({ where: { type: 'WAREHOUSE' } });
      const store = await tx.location.findFirst({ where: { type: 'STORE' } });
      
      const product = await tx.product.findUnique({
        where: { sku },
        include: { batches: { where: { locationId: warehouse?.id, quantity: { gt: 0 } }, orderBy: { expiryDate: 'asc' } } }
      });

      if (!product) throw new NotFoundException('Product not found in Warehouse');

      let remaining = qty;
      const totalAvailable = product.batches.reduce((sum, b) => sum + b.quantity, 0);
      
      if (totalAvailable < qty) throw new BadRequestException(`Only ${totalAvailable} in Warehouse.`);

      for (const batch of product.batches) {
        if (remaining <= 0) break;
        const take = Math.min(batch.quantity, remaining);

        await tx.batch.update({ where: { id: batch.id }, data: { quantity: batch.quantity - take } });
        await tx.batch.create({
          data: {
            batchNumber: batch.batchNumber,
            productId: product.id,
            locationId: store!.id,
            quantity: take,
            expiryDate: batch.expiryDate,
            costPrice: batch.costPrice
          }
        });
        remaining -= take;
      }
      return { message: 'Transferred' };
    });
  }

  // 4. RECEIVE STOCK (Supplier -> Warehouse)
  async addBatch(productId: string, batchNumber: string, expiry: string, qty: number, cost: number) {
    const warehouse = await this.prisma.location.findFirst({ where: { type: 'WAREHOUSE' } });
    return this.prisma.batch.create({
      data: { productId, batchNumber, expiryDate: new Date(expiry), quantity: qty, costPrice: cost, locationId: warehouse!.id }
    });
  }

  // 5. CATALOG
  async createProduct(name: string, sku: string, minStock: number) {
    return this.prisma.product.create({ data: { name, sku, minStock, description: 'Created via ERP' } });
  }

  // --- REPORTING (RESTORED) ---

  // History Sidebar
  async getSalesHistory() {
    return await this.prisma.sale.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        items: {
          include: {
            batch: { include: { product: true } }
          }
        }
      }
    });
  }

  // Chart Data
  async getWeeklyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const sales = await this.prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      include: { items: true }
    });

    const stats: Record<string, number> = {};
    for(let i=0; i<7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        stats[d.toISOString().split('T')[0]] = 0;
    }

    sales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      if (stats[dateStr] !== undefined) stats[dateStr] += totalQty;
    });

    return Object.entries(stats).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date));
  }

  // PDF Report
  async generateReport() {
    const doc = new PDFDocument();
    
    const sales = await this.prisma.sale.findMany({
      take: 20, orderBy: { createdAt: 'desc' },
      include: { user: true, items: { include: { batch: { include: { product: true } } } } }
    });

    doc.fontSize(20).text('PharmaCore Professional Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    sales.forEach(sale => {
      doc.fontSize(12).font('Helvetica-Bold').text(`Sale ID: #${sale.id.slice(0,6)} - Sold by: ${sale.user.name}`);
      sale.items.forEach(item => {
        doc.fontSize(10).font('Helvetica').text(`   - ${item.quantity}x ${item.batch.product.name} (Batch: ${item.batch.batchNumber})`);
      });
      doc.moveDown(0.5);
    });

    doc.end();
    return doc;
  }
}