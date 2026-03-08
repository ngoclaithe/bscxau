
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.development' });
const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
        select: { id: true, email: true, nickname: true, role: true }
    });
    console.table(users);

    console.log('\n--- COPY FOLLOWERS ---');
    const followers = await prisma.copyFollower.findMany({
        include: { trader: { select: { email: true } }, follower: { select: { email: true } } }
    });
    // Map manually to avoid formatting issues
    const followerData = followers.map(f => ({
        id: f.id,
        trader: f.trader ? f.trader.email : 'Unknown',
        follower: f.follower ? f.follower.email : 'Unknown',
        traderId: f.traderId,
        followerId: f.followerId,
        isActive: f.isActive,
        copyType: f.copyType,
        copyValue: f.copyValue ? f.copyValue.toString() : 'N/A',
        createdAt: f.createdAt
    }));
    console.table(followerData);

    console.log('\n--- RECENT TRADES (Last 5) ---');
    const trades = await prisma.tradeOrder.findMany({
        take: 5,
        orderBy: { openTime: 'desc' },
        include: { user: { select: { email: true } } }
    });
    const tradeData = trades.map(t => ({
        id: t.id,
        user: t.user ? t.user.email : 'Unknown',
        userId: t.userId,
        pairId: t.pairId,
        amount: t.amount ? t.amount.toString() : 'N/A',
        status: t.status,
        openTime: t.openTime
    }));
    console.table(tradeData);

    console.log('\n--- COPY TRADE ORDERS ---');
    const copyTrades = await prisma.copyTradeOrder.findMany({
        take: 5,
        include: {
            sourceTrade: { include: { user: true } },
            followerTrade: { include: { user: true } }
        }
    });

    if (copyTrades.length === 0) {
        console.log('No copy trades found.');
    } else {
        const copyTradeData = copyTrades.map(ct => ({
            id: ct.id,
            sourceUser: ct.sourceTrade.user.email,
            followerUser: ct.followerTrade.user.email,
            sourceTradeId: ct.sourceTradeId,
            followerTradeId: ct.followerTradeId
        }));
        console.table(copyTradeData);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
