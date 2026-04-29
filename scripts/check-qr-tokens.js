const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkQRTokens() {
  try {
    console.log('=== QR TOKENS CHECK ===');  // Получаем все QR-токены с менеджерами
    const qrTokens = await prisma.qrToken.findMany({
      include: {
        manager: {
          select: {
            id: true,
            login: true, // Используем login вместо email
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    });  console.log(`Found ${qrTokens.length} QR tokens:`);  qrTokens.forEach((qrToken, index) => {
      console.log(`\n${index + 1}. Token: ${qrToken.token}`);
      if (qrToken.manager) {
        console.log(`   Manager: ${qrToken.manager.firstName} ${qrToken.manager.lastName} (${qrToken.manager.login})`);
        console.log(`   Manager ID: ${qrToken.manager.id}`);
        console.log(`   Manager Active: ${qrToken.manager.isActive}`);
      } else {
        console.log(`   Manager: NULL (orphaned token)`);
      }
      console.log(`   Token Type: ${qrToken.type}`);
      console.log(`   Created: ${qrToken.createdAt}`);
    });  // Получаем всех менеджеров
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        login: true, // Используем login вместо email
        firstName: true,
        lastName: true,
        isActive: true
      }
    });  console.log(`\n=== ALL MANAGERS ===`);
    managers.forEach((manager, index) => {
      console.log(`\n${index + 1}. ${manager.firstName} ${manager.lastName} (${manager.login})`);
      console.log(`   ID: ${manager.id}`);
      console.log(`   Active: ${manager.isActive}`);
    });  // Проверяем сотрудников и их менеджеров
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        managerId: true,
        manager: {
          select: {
            login: true, // Используем login вместо email
            firstName: true,
            lastName: true
          }
        }
      }
    });  console.log(`\n=== EMPLOYEES AND THEIR MANAGERS ===`);
    const employeesByManager = {};  employees.forEach(employee => {
      const managerLogin = employee.manager?.login || 'No Manager';
      if (!employeesByManager[managerLogin]) {
        employeesByManager[managerLogin] = [];
      }
      employeesByManager[managerLogin].push(`${employee.firstName} ${employee.lastName} (${employee.email})`);
    });  Object.keys(employeesByManager).forEach(managerLogin => {
      console.log(`\nManager: ${managerLogin}`);
      employeesByManager[managerLogin].forEach(emp => {
        console.log(`  - ${emp}`);
      });
    });} catch (error) {
    console.error('Error checking QR tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQRTokens();
