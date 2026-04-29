const axios = require('axios');

async function testChartAPI() {
  try {
    // Токен для менеджера ID 4
    const managerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwicm9sZSI6Im1hbmFnZXIiLCJsb2dpbiI6ImhheXJ1bGxvaDRAZ21haWwuY29tIiwiaWF0IjoxNzc1NDYyMDIyLCJleHAiOjE3NzgwNTQwMjJ9.NtyUJ1PvOytjmVblCuVOcHvw5wSQfWU46j_VdCZbzwA';
    
    const response = await axios.get('http://localhost:5000/api/attendance/chart?filter=today', {
      headers: {
        'Authorization': `Bearer ${managerToken}`
      }
    });
    
    console.log('Chart API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Проверяем общее количество сотрудников
    const totalEmployees = response.data.length > 0 ? response.data[0].total : 'No data';
    console.log(`\nTotal employees from API: ${totalEmployees}`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testChartAPI();
