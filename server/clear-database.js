require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️ Начинаю очистку базы данных...');try {
    // Подтверждение
    console.log('⚠️  ВНИМАНИЕ: Это действие удалит ВСЕ данные из базы!');
    console.log('⚠️  包括 менеджеры, сотрудники, посещаемость, QR токены и т.д.');  // Получаем подтверждение
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });  const confirmation = await new Promise((resolve) => {
      rl.question('❓ Вы уверены, что хотите удалить ВСЕ данные? (yes/no): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      });
    });  if (!confirmation) {
      console.log('❌ Операция отменена');
      process.exit(0);
      return;
    }  console.log('🔄 Начинаю удаление данных...');  // Очередь удаления для правильного порядка (от зависимых к независимым)
    const deleteOrder = [
      { name: 'Attendance', model: 'attendance' },
      { name: 'Attendance History', model: 'attendanceHistory' },
      { name: 'Employees', model: 'employee' },
      { name: 'QR Tokens', model: 'qrToken' },
      { name: 'Managers', model: 'manager' },
      { name: 'Tariffs', model: 'tariff' }
    ];  let totalDeleted = 0;  for (const item of deleteOrder) {
      try {
        console.log(`🗑️  Удаление ${item.name}...`);      let result;
        if (item.model === 'attendance') {
          result = await prisma.attendance.deleteMany({});
        } else if (item.model === 'attendanceHistory') {
          result = await prisma.attendanceHistory.deleteMany({});
        } else if (item.model === 'employee') {
          result = await prisma.employee.deleteMany({});
        } else if (item.model === 'manager') {
          result = await prisma.manager.deleteMany({});
        } else if (item.model === 'qrToken') {
          result = await prisma.qrToken.deleteMany({});
        } else if (item.model === 'tariff') {
          result = await prisma.tariff.deleteMany({});
        }      const deletedCount = result.count;
        totalDeleted += deletedCount;
        console.log(`✅ ${item.name}: удалено ${deletedCount} записей`);      // Небольшая задержка для визуализации
        await new Promise(resolve => setTimeout(resolve, 100));    } catch (error) {
        console.error(`❌ Ошибка при удалении ${item.name}:`, error);
      }
    }  console.log('🎉 Очистка базы данных завершена!');
    console.log(`📊 Всего удалено записей: ${totalDeleted}`);  // Сброс автоинкремента (если используется)
    try {
      await prisma.$executeRaw`ALTER SEQUENCE managers_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE employees_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE attendance_history_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE qrTokens_id_seq RESTART WITH 1`;
      await prisma.$executeRaw`ALTER SEQUENCE tariffs_id_seq RESTART WITH 1`;
      console.log('🔄 Автоинкременты сброшены');
    } catch (error) {
      console.warn('⚠️  Не удалось сбросить автоинкременты:', error);
    }  // Выводим инструкцию по очистке localStorage
    console.log('\n📱 ВАЖНО: После очистки базы данных очистите localStorage в браузере:');
    console.log('1. Откройте консоль разработчика (F12)');
    console.log('2. Выполните команду: localStorage.clear()');
    console.log('3. Перезагрузите страницу');
    console.log('4. Или просто закройте и откройте браузер заново');} catch (error) {
    console.error('❌ Критическая ошибка при очистке базы:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Соединение с базой данных закрыто');
  }
}

// Запуск функции
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };
