const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateManagerPassword() {
  try {
    const hashedPassword = await bcrypt.hash('2005061713', 10);
    
    const manager = await prisma.manager.update({
      where: { login: 'hayrulloh13@gmail.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password updated for:', manager.login);
    console.log('✅ New password: 2005061713');
    console.log('✅ Manager is active:', manager.isActive);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateManagerPassword();
