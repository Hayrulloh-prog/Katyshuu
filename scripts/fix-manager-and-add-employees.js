const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixManagerAndAddEmployees() {
  try {
    console.log('=== Исправление менеджера и добавление сотрудников ===');

    // Находим менеджера
    const manager = await prisma.manager.findFirst({
      where: { login: 'hayrulloh1@gmail.com' }
    });  if (!manager) {
      console.log('❌ Менеджер не найден!');
      return;
    }  console.log('✅ Менеджер найден:');
    console.log('- ID:', manager.id);
    console.log('- Login:', manager.login);
    console.log('- Текущий телефон:', manager.phone);

    // Исправляем телефон
    await prisma.manager.update({
      where: { id: manager.id },
      data: { phone: '+996224209601' }
    });
    console.log('✅ Телефон обновлен на: +996224209601');

    // Проверяем текущих сотрудников
    const currentEmployees = await prisma.employee.findMany({
      where: { managerId: manager.id },
      select: {
        id: true,
        login: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true
      }
    });

    console.log('\nТекущие сотрудники:', currentEmployees.length);
    currentEmployees.forEach(emp => {
      console.log(`- ${emp.firstName} ${emp.lastName} (${emp.phone})`);
    });

    // Создаем 10 сотрудников, если их нет
    if (currentEmployees.length === 0) {
      console.log('\nСоздаем 10 сотрудников...');

      const employees = [
        { firstName: 'Али', lastName: 'Алиев', phone: '+996224209601' },
        { firstName: 'Бек', lastName: 'Беков', phone: '+996224209602' },
        { firstName: 'Чынгыз', lastName: 'Чынгызов', phone: '+996224209603' },
        { firstName: 'Данияр', lastName: 'Данияров', phone: '+996224209604' },
        { firstName: 'Ермек', lastName: 'Ермеков', phone: '+996224209605' },
        { firstName: 'Фарух', lastName: 'Фарухов', phone: '+996224209606' },
        { firstName: 'Гулмира', lastName: 'Гулмирова', phone: '+996224209607' },
        { firstName: 'Нурбек', lastName: 'Нурбеков', phone: '+996224209608' },
        { firstName: 'Султан', lastName: 'Султанов', phone: '+996224209609' },
        { firstName: 'Тилек', lastName: 'Тилеков', phone: '+996224209610' }
      ];

      for (let i = 0; i < employees.length; i++) {
        const emp = employees[i];
        const login = `employee${i + 1}@company.com`;
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
          await prisma.employee.create({
            data: {
              login: login,
              password: hashedPassword,
              firstName: emp.firstName,
              lastName: emp.lastName,
              phone: emp.phone,
              managerId: manager.id,
              isActive: true
            }
          });

          console.log(`✅ Создан: ${emp.firstName} ${emp.lastName} (${emp.phone})`);
          console.log(`   Логин: ${login}, Пароль: ${password}`);
        } catch (e) {
          console.log(`❌ Ошибка при создании ${emp.firstName}: ${e.message}`);
        }
      }

      console.log('\n🎉 Создано 10 сотрудников!');
      console.log('Все сотрудники имеют пароль: password123');
    }

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixManagerAndAddEmployees();
