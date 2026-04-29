# Real-Time Updates Documentation

## Overview

Система real-time обновлений позволяет мгновенно обновлять статистику в менеджер панели при добавлении нового сотрудника или изменении данных посещаемости без необходимости перезагрузки страницы.

## Architecture

### Server-Side Components

1. **Event Manager** (`server/middleware/events.js`)
   - Управляет SSE (Server-Sent Events) соединениями
   - Рассылает события всем подключенным клиентам
   - Поддерживает автоматическое переподключение

2. **Events Router** (`server/routes/events.js`)
   - Эндпоинт `/api/events` для SSE соединений
   - Отправляет ping каждые 30 секунд для поддержания соединения

3. **Event Triggers**
   - `oauth.js`: Уведомление о регистрации нового сотрудника
   - `employees.js`: Уведомление об удалении сотрудника
   - `attendance.js`: Уведомление об обновлении посещаемости

### Client-Side Components

1. **Real-Time Hook** (`client/src/hooks/useRealTimeUpdates.js`)
   - Управляет SSE соединением из React
   - Автоматическое переподключение при обрыве
   - Обработка различных типов событий

2. **Manager Panel Integration** (`client/src/pages/ManagerPanel.jsx`)
   - Получает real-time события
   - Мгновенно обновляет данные без перезагрузки
   - Показывает уведомления о изменениях

## Event Types

### employee_registered
```json
{
  "type": "employee_registered",
  "employee": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "managerId": 456,
  "timestamp": "2026-03-26T15:00:00.000Z"
}
```

### employee_deleted
```json
{
  "type": "employee_deleted",
  "employeeId": 123,
  "managerId": 456,
  "timestamp": "2026-03-26T15:00:00.000Z"
}
```

### attendance_updated
```json
{
  "type": "attendance_updated",
  "data": {
    "type": "checkin" | "checkout",
    "employeeId": 123,
    "attendance": { ... }
  },
  "managerId": 456,
  "timestamp": "2026-03-26T15:00:00.000Z"
}
```

### stats_updated
```json
{
  "type": "stats_updated",
  "stats": { ... },
  "managerId": 456,
  "timestamp": "2026-03-26T15:00:00.000Z"
}
```

## Features

### Automatic Reconnection
- Клиент автоматически переподключается при обрыве соединения
- Экспоненциальная задержка между попытками (максимум 30 секунд)
- Максимум 5 попыток переподключения

### Connection Health
- Ping сообщения каждые 30 секунд
- Автоматическое обнаружение отключенных клиентов
- Graceful shutdown при закрытии страницы

### Real-Time Notifications
- Toast уведомления о важных событиях
- Мгновенное обновление статистики
- Обновление списков сотрудников

## Usage in Manager Panel

```javascript
const handleEmployeeUpdate = useCallback((data) => {
  switch (data.type) {
    case 'employee_registered':
      fetchEmployees();
      fetchDashboardData();
      toast.success(`Новый сотрудник добавлен!`);
      break;
    case 'deleted':
      setEmployees(prev => prev.filter(e => e.id !== data.employeeId));
      fetchDashboardData();
      break;
  }
}, []);

useRealTimeUpdates(handleEmployeeUpdate, handleStatsUpdate);
```

## Testing

### Server Test
```bash
node test-realtime-updates.js
```

### Manual Testing
1. Откройте менеджер панель в браузере
2. Зарегистрируйте нового сотрудника через QR-код
3. Статистика должна обновиться мгновенно без перезагрузки

## Benefits

1. **Мгновенные обновления** - Статистика обновляется в реальном времени
2. **Улучшенный UX** - Не нужно перезагружать страницу
3. **Надежность** - Автоматическое переподключение
4. **Масштабируемость** - Поддерживает множество клиентов
5. **Low latency** - SSE быстрее чем polling

## Troubleshooting

### Connection Issues
- Проверьте что сервер запущен на порту 5000
- Убедитесь что CORS настроен правильно
- Проверьте сетевое подключение

### Events Not Received
- Проверьте консоль браузера на ошибки
- Убедитесь что eventManager импортирован
- Проверьте что события отправляются на сервере

### Performance
- SSE использует минимальную пропускную способность
- Только одно соединение на страницу
- Автоматическая очистка мертвых соединений
