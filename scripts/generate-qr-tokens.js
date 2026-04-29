const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateRandomToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function main() {
  console.log('🎫 Generating QR tokens...');// Check existing tokens count
  const existingCount = await prisma.qrToken.count({
    where: { type: 'MANAGER_REG', isUsed: false }
  });console.log(`Found ${existingCount} unused MANAGER_REG tokens`);if (existingCount >= 100) {
    console.log('✅ Already have enough QR tokens');
    return;
  }// Generate new tokens
  const needed = 100 - existingCount;
  console.log(`Generating ${needed} new tokens...`);for (let i = 0; i < needed; i++) {
    const token = generateRandomToken();
    await prisma.qrToken.create({
      data: {
        token,
        type: 'MANAGER_REG',
        isUsed: false,
        managerId: null
      }
    });
  }console.log(`✅ Generated ${needed} new QR tokens`);
  console.log('\n📋 Sample tokens (for testing):');// Show first 5 tokens
  const sampleTokens = await prisma.qrToken.findMany({
    where: { type: 'MANAGER_REG', isUsed: false },
    take: 5
  });sampleTokens.forEach((t, i) => {
    console.log(`  ${i + 1}. http://localhost:3000/qr/${t.token}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
