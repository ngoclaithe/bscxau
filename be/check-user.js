require('dotenv').config({ path: '.env.development' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
    console.log('Checking users...');

    // Check TRADE_AUDITOR
    const email = 'auditor@quantax.io';
    const password = 'TradeAuditor@2024!';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('❌ User not found:', email);
    } else {
        console.log('✅ User found:', user.email);
        console.log('   Role:', user.role);
        console.log('   Password Hash:', user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NULL');

        // Test password
        if (user.passwordHash) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            console.log('   Password Match:', isValid ? '✅ YES' : '❌ NO');
        }
    }

    console.log('\n-------------------\n');

    // Check FINANCE_AUDITOR
    const finEmail = 'finance@quantax.io';
    const finPass = 'FinanceAuditor@2024!';

    const finUser = await prisma.user.findUnique({
        where: { email: finEmail }
    });

    if (!finUser) {
        console.log('❌ User not found:', finEmail);
    } else {
        console.log('✅ User found:', finUser.email);
        console.log('   Role:', finUser.role);

        if (finUser.passwordHash) {
            const isValid = await bcrypt.compare(finPass, finUser.passwordHash);
            console.log('   Password Match:', isValid ? '✅ YES' : '❌ NO');
        }
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
