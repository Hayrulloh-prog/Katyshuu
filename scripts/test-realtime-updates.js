// Тест для проверки real-time обновлений
const EventSource = require('eventsource');

console.log('=== Тест Real-Time Updates ===');

// Подключаемся к SSE
const eventSource = new EventSource('http://localhost:5000/api/events');

eventSource.onopen = () => {
  console.log('✅ Connected to SSE');
};

eventSource.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    console.log('📨 Received event:', data);
    
    switch (data.type) {
      case 'employee_registered':
        console.log(`👋 Новый сотрудник: ${data.employee.firstName} ${data.employee.lastName}`);
        break;
      case 'employee_deleted':
        console.log(`🗑️ Сотрудник удален: ${data.employeeId}`);
        break;
      case 'attendance_updated':
        console.log(`⏰ Обновление посещаемости: ${data.data.type}`);
        break;
      case 'stats_updated':
        console.log(`📊 Статистика обновлена`);
        break;
      case 'ping':
        console.log('🏓 Ping received');
        break;
      case 'connected':
        console.log('🔗 Connection confirmed');
        break;
      default:
        console.log(`❓ Неизвестный тип: ${data.type}`);
    }
  } catch (error) {
    console.error('❌ Error parsing event:', error);
  }
};

eventSource.onerror = (error) => {
  console.error('❌ SSE Error:', error);
};

// Закрытие через 30 секунд для теста
setTimeout(() => {
  console.log('🔚 Closing test connection');
  eventSource.close();
  process.exit(0);
}, 30000);

console.log('⏳ Ожидание событий в течение 30 секунд...');
