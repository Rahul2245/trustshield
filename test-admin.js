const http = require('http');

const postData = JSON.stringify({
  email: 'admin@trustshield.io',
  password: 'Admin@Trust123'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/admin-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Login Status:', res.statusCode);
    const result = JSON.parse(data);
    const token = result.data?.tokens?.accessToken;
    console.log('Access Token:', token ? 'Exists' : 'Missing');
    const cookies = res.headers['set-cookie'];
    console.log('Cookies:', cookies);

    if (token) {
      // Test Stats
      http.get('http://localhost:3000/api/v1/admin/stats', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, (res2) => {
        console.log('Stats Status:', res2.statusCode);
      });

      // Test Auth Me
      http.get('http://localhost:3000/api/v1/auth/me', {
        headers: { 'Authorization': 'Bearer ' + token }
      }, (res2) => {
        console.log('Auth Me Status:', res2.statusCode);
      });
      
      // Test refresh
      const req3 = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/refresh',
        method: 'POST',
        headers: {
          'Cookie': cookies[0]
        }
      }, (res3) => {
        console.log('Refresh Status:', res3.statusCode);
      });
      req3.end();
    }
  });
});

req.write(postData);
req.end();
