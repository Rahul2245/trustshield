const axios = require('axios');
const http = require('http');

async function run() {
  try {
    // 1. Admin Login
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/admin/login', {
      email: 'super_admin@trustshield.io',
      password: 'password123'
    });
    const token = loginRes.data.data.tokens.accessToken;
    console.log("Logged in, token:", token.slice(0, 20) + '...');
    
    // 2. Fetch stats
    const statsRes = await axios.get('http://localhost:5000/api/v1/admin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Stats success:", statsRes.status);
  } catch (err) {
    console.log("Error:", err.response ? err.response.data : err.message);
  }
}
run();
