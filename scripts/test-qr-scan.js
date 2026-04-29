const http = require('http');

async function testQRScan() {
  try {
    console.log('=== ТЕСТ QR СКАНИРОВАНИЯ ===');  const token = '9J9ywIzaGZ5k77CChy7E4o4TOGwzzo4Q';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/qr/scan/${token}`,
      method: 'GET'
    };  console.log('Отправляем запрос на:', `http://localhost:5000/api/qr/scan/${token}`);  const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });  if (response.status === 200) {
      console.log('✅ Успешный ответ:');
      console.log('  Employee:', response.data.employee);
      console.log('  Today record:', response.data.todayRecord);
      console.log('  Recent records count:', response.data.recentRecords?.length || 0);    // Определяем следующее действие
      const action = response.data.todayRecord ? 'checkout' : 'checkin';
      console.log('  Следующее действие:', action);
    } else {
      console.error('❌ Ошибка HTTP:', response.status);
      console.error('  Ответ:', response.data);
    }} catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testQRScan();
