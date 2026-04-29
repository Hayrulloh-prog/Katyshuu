const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing manager login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/manager', {
      login: 'hayrulloh13@gmail.com',
      password: '2005061713'
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();
