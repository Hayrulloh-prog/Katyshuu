const express = require('express');
const eventManager = require('../middleware/events');

const router = express.Router();

// Эндпоинт для Server-Sent Events
router.get('/', (req, res) => {
  // Устанавливаем заголовки для SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });console.log('New SSE client connected');// Добавляем клиента к менеджеру событий
  eventManager.addClient(res);// Отправляем ping каждые 30 секунд для поддержания соединения
  const pingInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
    } catch (error) {
      clearInterval(pingInterval);
      console.log('Client disconnected, stopping ping');
    }
  }, 30000);// Очищаем при отключении
  res.on('close', () => {
    clearInterval(pingInterval);
    console.log('SSE client disconnected');
  });
});

module.exports = router;
