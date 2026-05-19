import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  try {
    // Clean up (optional - comment out for production)
    // await prisma.device.deleteMany({});
    // await prisma.deviceLog.deleteMany({});
    // await prisma.user.deleteMany({});

    // Create Master User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const masterUser = await prisma.user.upsert({
      where: { email: 'admin@nutika.ee' },
      update: {},
      create: {
        email: 'admin@nutika.ee',
        password: hashedPassword,
        role: 'MASTER',
      },
    });

    console.log('✅ Master user created: admin@nutika.ee / admin123');

    // Create Standard User
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

    console.log('✅ Standard user created: user@nutika.ee / user123');
    
    // Seed devices for master user
    const device1 = await prisma.device.create({
      data: {
        name: 'Water Heater',
        description: 'Main water heating system',
        connectionType: 'IP',
        connectionParams: JSON.stringify({ ip: '192.168.1.100', port: 80 }),
        thresholdPrice: 10.5,
        isCritical: false,
        userId: masterUser.id
      }
    });

    const device2 = await prisma.device.create({
      data: {
        name: 'Heat Pump',
        description: 'Apartment heating system',
        connectionType: 'API',
        connectionParams: JSON.stringify({ endpoint: 'https://api.example.com/devices/heater' }),
        thresholdPrice: 8.0,
        isCritical: true,
        userId: masterUser.id
      }
    });

    const device3 = await prisma.device.create({
      data: {
        name: 'EV Charger',
        description: 'Electric vehicle charging station',
        connectionType: 'MQTT',
        connectionParams: JSON.stringify({ ip: '192.168.1.50', topic: 'home/ev-charger/command' }),
        thresholdPrice: 5.0,
        isCritical: false,
        userId: masterUser.id
      }
    });

    console.log('✅ Demo devices created');
    console.log(`   - Water Heater (IP)`);
    console.log(`   - Heat Pump (API)`);
    console.log(`   - EV Charger (MQTT)`);

    // Create some sample logs
    await prisma.deviceLog.createMany({
      data: [
        { deviceId: device1.id, command: 'ON' },
        { deviceId: device1.id, command: 'OFF' },
        { deviceId: device2.id, command: 'ON' },
        { deviceId: device3.id, command: 'STATUS_CHECK' },
      ]
    });

    console.log('✅ Sample logs created');
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
