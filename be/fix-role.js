const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRawUnsafe(`UPDATE users SET role='USER' WHERE role='TRADER'`);
    console.log('Done');
}

main().finally(() => prisma.$disconnect());
