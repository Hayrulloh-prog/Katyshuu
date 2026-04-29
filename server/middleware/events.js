const EventEmitter = require('events');

class EventManager extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }// Добавить клиента для SSE
  addClient(res) {
    this.clients.add(res);

    // Отправляем начальное сообщение
    this.sendToClient(res, { type: 'connected', message: 'Connected to real-time updates' });  // Удаляем клиента при отключении
    res.on('close', () => {
      this.clients.delete(res);
    });  res.on('error', () => {
      this.clients.delete(res);
    });
  }// Отправить сообщение конкретному клиенту
  sendToClient(res, data) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending to client:', error);
      this.clients.delete(res);
    }
  }// Отправить сообщение всем клиентам
  broadcast(data) {
    console.log('Broadcasting to', this.clients.size, 'clients:', data);

    this.clients.forEach(res => {
      this.sendToClient(res, data);
    });
  }// Уведомить о регистрации нового сотрудника
  notifyEmployeeRegistered(employee, managerId) {
    this.broadcast({
      type: 'employee_registered',
      employee,
      managerId,
      timestamp: new Date().toISOString()
    });
  }// Уведомить об удалении сотрудника
  notifyEmployeeDeleted(employeeId, managerId) {
    this.broadcast({
      type: 'employee_deleted',
      employeeId,
      managerId,
      timestamp: new Date().toISOString()
    });
  }// Уведомить об обновлении статистики
  notifyStatsUpdated(stats, managerId) {
    this.broadcast({
      type: 'stats_updated',
      stats,
      managerId,
      timestamp: new Date().toISOString()
    });
  }// Уведомить об обновлении посещаемости
  notifyAttendanceUpdated(data, managerId) {
    this.broadcast({
      type: 'attendance_updated',
      data,
      managerId,
      timestamp: new Date().toISOString()
    });
  }
}

// Создаем глобальный экземпляр
const eventManager = new EventManager();

module.exports = eventManager;
