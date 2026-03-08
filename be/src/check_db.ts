
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database...');

    const symbols = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD'];

    for (const symbol of symbols) {
        const count = await prisma.priceCandle.count({
            where: { symbol },
        });

        const latest = await prisma.priceCandle.findFirst({
            where: { symbol },
            orderBy: { time: 'desc' },
        });

        console.log(`Symbol: ${symbol}, Count: ${count}, Latest Close: ${latest?.close}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
