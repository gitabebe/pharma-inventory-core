import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma.service';

// 1. Mock Data: This simulates what's inside your "Fake Database"
const mockProduct = {
  id: 'prod-1',
  sku: 'PAN-001',
  batches: [
    { id: 'batch-old', batchNumber: 'OLD', quantity: 10, expiryDate: new Date('2024-01-01') },
    { id: 'batch-new', batchNumber: 'NEW', quantity: 10, expiryDate: new Date('2025-01-01') },
  ],
};

// 2. Mock Transaction: Intercepts the database calls
const mockTransaction = {
  product: { findUnique: jest.fn().mockResolvedValue(mockProduct) },
  batch: { update: jest.fn() },
  sale: { create: jest.fn() },
};

describe('InventoryService (FIFO Logic)', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: PrismaService,
          useValue: {
            // When the app asks for a transaction, give it our fake one
            $transaction: jest.fn().mockImplementation((cb) => cb(mockTransaction)),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should correctly split sales between Old and New batches (FIFO)', async () => {
    // ACT: Try to sell 15 units (We have 10 Old, 10 New)
    const result = await service.processSale('PAN-001', 15);

    // ASSERT: Check if the math is correct
    expect(result.status).toBe('SUCCESS');
    
    // It should have taken ALL 10 from the OLD batch
    expect(result.details[0].batchNumber).toBe('OLD');
    expect(result.details[0].deducted).toBe(10);

    // It should have taken 5 from the NEW batch
    expect(result.details[1].batchNumber).toBe('NEW');
    expect(result.details[1].deducted).toBe(5);
  });
});