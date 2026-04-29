const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testCycles() {
  try {
    console.log('=== Testing Cycles ===');

    // 1. Создаем тестового менеджера
    const manager = await prisma.manager.create({
      data: {
        firstName: 'Test',
        lastName: 'Manager',
        phone: '+996123456789',
        login: 'test.manager@example.com',
        password: 'manager123',
        isActive: true,
        maxEmployees: 100
      }
    });  console.log('✅ Test manager created:', manager.id);  // 2. Создаем цикл
    const cycle = await prisma.cycle.create({
      data: {
        name: 'Test Cycle 2026',
        startDate: new Date(),
        managerId: manager.id
      }
    });  console.log('✅ Test cycle created:', cycle.id);  // 3. Создаем тестового сотрудника
    const testEmployee = await prisma.employee.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test.cycle@example.com',
        phone: '+996123456799',
        login: 'test.cycle@example.com',
        password: 'password123',
        managerId: manager.id
      }
    });  console.log('✅ Test employee created:', testEmployee.id);  // 4. Привязываем сотрудника к циклу
    await prisma.cycle.update({
      where: { id: cycle.id },
      data: {
        employees: {
          connect: { id: testEmployee.id }
        }
      }
    });  console.log('✅ Employee connected to cycle');  // 5. Получаем все циклы
    const cycles = await prisma.cycle.findMany({
      where: { managerId: manager.id },
      include: {
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });  console.log('✅ Found cycles:', cycles.length);

    cycles.forEach((c, index) => {
      console.log(`Cycle ${index + 1}: ${c.name} - ${c.employees.length} employees`);
      c.employees.forEach(emp => {
        console.log(`  - ${emp.firstName} ${emp.lastName} (${emp.email})`);
      });
    });  // 6. Очищаем
    await prisma.cycle.deleteMany({
      where: { managerId: manager.id }
    });  await prisma.employee.deleteMany({
      where: { id: testEmployee.id }
    });  await prisma.manager.delete({
      where: { id: manager.id }
    });  console.log('✅ Test data cleaned up');} catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCycles();
