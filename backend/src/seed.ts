import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@nutika.ee' },
    update: {},
    create: {
      email: 'admin@nutika.ee',
      password: hashedPassword,
      role: 'MASTER',
    },
  });

  console.log('Master user created: admin@nutika.ee / admin123');

  const standardPassword = await bcrypt.hash('user123', 10);
  const standardUser = await prisma.user.upsert({
    where: { email: 'user@nutika.ee' },
    update: {},
    create: {
      email: 'user@nutika.ee',
      password: standardPassword,
      role: 'STANDARD',
    },
  });

  console.log('Standard user created: user@nutika.ee / user123');
  
  // Seed a dummy device for visual demo
  await prisma.device.create({
    data: {
      name: 'Test Water Heater',
      description: 'Demo device',
      connectionType: 'IP',
      connectionParams: JSON.stringify({ ip: '192.168.1.100' }),
      thresholdPrice: 10.5,
      userId: user.id
    }
  });
  
  console.log('Dummy device created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
