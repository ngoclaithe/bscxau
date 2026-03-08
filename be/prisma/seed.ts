import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // ─── Trading Pairs: chỉ BTC/USD theo yêu cầu BSCXAU ───
    const pairs = [
        { symbol: 'BTC/USD', payoutRate: 0.85 },
        { symbol: 'WTI/USD', payoutRate: 0.85 },
    ];

    for (const pair of pairs) {
        await prisma.tradingPair.upsert({
            where: { symbol: pair.symbol },
            update: { isActive: true },
            create: pair,
        });
    }

    // Xoá các pair cũ nếu còn tồn tại
    await prisma.tradingPair.deleteMany({
        where: { symbol: { in: ['ETH/USD', 'BNB/USD', 'SOL/USD', 'XRP/USD'] } },
    });

    console.log('✅ Trading pairs seeded: BTC/USD only (BSCXAU)');

    // ─── Admin User ───
    const adminEmail = 'admin@bscxau.io';
    const adminPassword = 'BSCXAUAdmin@2026!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.adminUser.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            role: 'admin',
        },
    });

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: { role: 'ADMIN' },
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            nickname: 'BSCXAU Admin',
            role: 'ADMIN',
            isPublic: false,
            wallet: {
                create: {
                    balance: 1000000,
                    lockedBalance: 0,
                },
            },
        },
    });

    console.log('✅ Admin user seeded');
    console.log('   Email   :', adminEmail);
    console.log('   Password:', adminPassword);

    // ─── Trade Auditor ───
    const tradeAuditorEmail = 'auditor@bscxau.io';
    const tradeAuditorPassword = 'BSCXAUAudit@2026!';
    const tradeAuditorHash = await bcrypt.hash(tradeAuditorPassword, 10);

    await prisma.user.upsert({
        where: { email: tradeAuditorEmail },
        update: { role: 'TRADE_AUDITOR' },
        create: {
            email: tradeAuditorEmail,
            passwordHash: tradeAuditorHash,
            nickname: 'Trade Auditor',
            role: 'TRADE_AUDITOR',
            isPublic: false,
            bio: 'Trade monitoring and user activity auditor',
            wallet: { create: { balance: 0, lockedBalance: 0 } },
        },
    });

    console.log('✅ Trade Auditor seeded');
    console.log('   Email   :', tradeAuditorEmail);
    console.log('   Password:', tradeAuditorPassword);

    // ─── Finance Auditor ───
    const financeAuditorEmail = 'finance@bscxau.io';
    const financeAuditorPassword = 'BSCXAUFinance@2026!';
    const financeAuditorHash = await bcrypt.hash(financeAuditorPassword, 10);

    await prisma.user.upsert({
        where: { email: financeAuditorEmail },
        update: { role: 'FINANCE_AUDITOR' },
        create: {
            email: financeAuditorEmail,
            passwordHash: financeAuditorHash,
            nickname: 'Finance Auditor',
            role: 'FINANCE_AUDITOR',
            isPublic: false,
            bio: 'Deposit and withdrawal approval specialist',
            wallet: { create: { balance: 0, lockedBalance: 0 } },
        },
    });

    console.log('✅ Finance Auditor seeded');
    console.log('   Email   :', financeAuditorEmail);
    console.log('   Password:', financeAuditorPassword);

    // ─── Demo User ───
    const demoEmail = 'demo@bscxau.io';
    const demoPassword = 'demo123456';
    const demoHash = await bcrypt.hash(demoPassword, 10);

    await prisma.user.upsert({
        where: { email: demoEmail },
        update: {},
        create: {
            email: demoEmail,
            passwordHash: demoHash,
            nickname: 'GoldTrader_Demo',
            role: 'USER',
            bio: 'BSCXAU demo account for testing Gold & Oil trading.',
            wallet: { create: { balance: 10000, lockedBalance: 0 } },
        },
    });

    console.log('✅ Demo user seeded');
    console.log('   Email   :', demoEmail);
    console.log('   Password:', demoPassword);

    // ─── System Config ───
    await prisma.systemConfig.upsert({
        where: { key: 'platform_name' },
        update: { value: 'BSCXAU' },
        create: { key: 'platform_name', value: 'BSCXAU' },
    });

    await prisma.systemConfig.upsert({
        where: { key: 'platform_description' },
        update: { value: 'Gold & Oil Trading Platform' },
        create: { key: 'platform_description', value: 'Gold & Oil Trading Platform' },
    });

    console.log('\n🎉 BSCXAU seed completed successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Platform : BSCXAU - Gold & Oil Trading');
    console.log('Database : BSCXAU');
    console.log('Pairs    : BTC/USD only');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
