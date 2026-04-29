const axios = require('axios');

async function testTariffDropdown() {
  try {
    console.log('🔍 Проверка доступных тарифов через API...\n');  // Получаем тарифы через публичный API
    const response = await axios.get('http://localhost:3001/api/managers/tariffs/public');
    const tariffs = response.data;  console.log(`📋 Получено тарифов: ${tariffs.length}\n`);  // Сортируем по длительности
    tariffs.sort((a, b) => a.duration - b.duration);  tariffs.forEach((tariff, index) => {
      console.log(`${index + 1}. "${tariff.name}" - ${tariff.duration} дней (ID: ${tariff.id})`);
    });  console.log('\n✅ Проверка завершена! Теперь в выпадающем списке должны быть все опции:');
    console.log('   • Пробный (7 дней)');
    console.log('   • 1 месяц (30 дней)');
    console.log('   • 2 месяца (60 дней)');
    console.log('   • 3 месяца (90 дней)');
    console.log('   • 4 месяца (120 дней) ✨ НОВЫЙ');
    console.log('   • 5 месяцев (150 дней) ✨ НОВЫЙ');
    console.log('   • 6 месяцев (180 дней)');
    console.log('   • 7 месяцев (210 дней) ✨ НОВЫЙ');
    console.log('   • 8 месяцев (240 дней) ✨ НОВЫЙ');
    console.log('   • 9 месяцев (270 дней) ✨ НОВЫЙ');
    console.log('   • 10 месяцев (300 дней) ✨ НОВЫЙ');
    console.log('   • 11 месяцев (330 дней) ✨ НОВЫЙ');
    console.log('   • 1 год (365 дней)');} catch (error) {
    console.error('❌ Ошибка при проверке тарифов:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Сервер не запущен. Запустите сервер командой: npm start');
    }
  }
}

testTariffDropdown();
