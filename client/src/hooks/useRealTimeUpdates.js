import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook для real-time обновлений
export const useRealTimeUpdates = (onEmployeeUpdate, onStatsUpdate) => {
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;const connect = () => {
    try {
      // Закрываем предыдущее соединение если есть
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const eventSource = new EventSource(`${apiUrl}/api/events`);    eventSourceRef.current = eventSource;    eventSource.onopen = () => {
        reconnectAttempts.current = 0;
      };    eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);        switch (data.type) {
            case 'employee_registered':
              if (onEmployeeUpdate) {
                onEmployeeUpdate(data);
              }
              break;

            case 'stats_updated':
              if (onStatsUpdate) {
                onStatsUpdate(data);
              }
              break;          case 'employee_deleted':
              if (onEmployeeUpdate) {
                onEmployeeUpdate({ type: 'deleted', employeeId: data.employeeId });
              }
              break;          case 'attendance_updated':
              // Обновляем статистику при изменении посещаемости
              if (onStatsUpdate) {
                onStatsUpdate({ type: 'attendance', data: data });
              }
              break;          default:
          }
        } catch (error) {      }
      };    eventSource.onerror = (error) => {
        eventSource.close();      // Попытка переподключения
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {      }
      };  } catch (error) {  }
  };useEffect(() => {
    connect();  return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [onEmployeeUpdate, onStatsUpdate]);return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  };
};
