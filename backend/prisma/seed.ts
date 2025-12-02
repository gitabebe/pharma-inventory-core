import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@pharmacy.com';

  // 1. Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists.');
    return;
  }

  // 2. Hash the password (The most important step!)
  // "10" is the salt rounds (complexity)
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 3. Create the user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'System Admin',
      password: hashedPassword, // Store the hash, NOT 'admin123'
      role: 'ADMIN',
    },
  });

  console.log('Created Admin User:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });