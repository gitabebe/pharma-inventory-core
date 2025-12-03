import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Locations
  const warehouse = await prisma.location.create({ data: { name: 'Central Warehouse', type: 'WAREHOUSE' } });
  const shop = await prisma.location.create({ data: { name: 'Shop Floor', type: 'STORE' } });

  // 2. Users (The 4 Roles)
  const hash = await bcrypt.hash('123456', 10);

  // ADMIN (IT)
  await prisma.user.create({
    data: { email: 'admin@pharmacy.com', name: 'IT Admin', password: hash, role: Role.SUPER_ADMIN, baseSalary: 0 }
  });

  // HR (People)
  await prisma.user.create({
    data: { email: 'hr@pharmacy.com', name: 'Sarah HR', password: hash, role: Role.HR_MANAGER, baseSalary: 5000 }
  });

  // STORE (Ops)
  await prisma.user.create({
    data: { email: 'store@pharmacy.com', name: 'Mike Store', password: hash, role: Role.STORE_MANAGER, baseSalary: 4000 }
  });

  // PHARMACIST (Sales)
  await prisma.user.create({
    data: { email: 'pharm@pharmacy.com', name: 'John Doe', password: hash, role: Role.PHARMACIST, baseSalary: 3500 }
  });

  // 3. Initial Product
  const product = await prisma.product.create({
    data: {
      name: 'Amoxicillin 500mg', sku: 'AMOX-500', minStock: 50,
      batches: {
        create: {
          batchNumber: 'INIT-BATCH', expiryDate: new Date('2026-12-31'), quantity: 200, costPrice: 5.00, locationId: warehouse.id
        }
      }
    }
  });

  console.log('✅ Database Seeding Complete. All passwords are "123456"');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());