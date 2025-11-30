const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testApi() {
  try {
    console.log('=== Testing Login ===');
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginRes = await makeRequest(loginOptions, loginData);
    console.log('Login status:', loginRes.statusCode);
    console.log('Login body:', loginRes.body);

    const loginResult = JSON.parse(loginRes.body);
    
    if (!loginResult.success) {
      console.error('Login failed:', loginResult.message);
      return;
    }

    const token = loginResult.data.token;
    console.log('Token obtained:', token ? 'Yes' : 'No');

    // Test reports API
    console.log('\n=== Testing Reports API ===');
    
    const reportsOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/dashboard/reports?period=current_month&type=overview',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const reportsRes = await makeRequest(reportsOptions);
    console.log('Reports API status:', reportsRes.statusCode);
    console.log('Reports API response:', reportsRes.body);

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi();