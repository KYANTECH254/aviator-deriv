const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const app = {
  name: 'TiltTrader Dev',
  apiKey: 'dev_api_key_123',
  platform: 'tilttrader',
  platformId: '53052',
  deriv_id: '53052',
  origin: 'localhost:3000',
  permissions: JSON.stringify(['authorize', 'query-user', 'websocket']),
};

async function main() {
  await prisma.app.upsert({
    where: {
      apiKey: app.apiKey,
    },
    update: app,
    create: app,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });