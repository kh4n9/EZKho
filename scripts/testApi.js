const { fetch } = require('node-fetch');

async function testReportsApi() {
  try {
    // First, let's try to login to get a token
    console.log('=== Testing Login ===');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      console.error('Login failed:', loginData.message);
      return;
    }

    const token = loginData.data.token;
    console.log('Token obtained:', token ? 'Yes' : 'No');

    // Now test the reports API
    console.log('\n=== Testing Reports API ===');
    const reportsResponse = await fetch('http://localhost:3000/api/dashboard/reports?period=current_month&type=overview', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const reportsData = await reportsResponse.json();
    console.log('Reports API status:', reportsResponse.status);
    console.log('Reports API response:', JSON.stringify(reportsData, null, 2));

    // Test different report types
    console.log('\n=== Testing Products Report ===');
    const productsResponse = await fetch('http://localhost:3000/api/dashboard/reports?period=current_month&type=products_detail', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const productsData = await productsResponse.json();
    console.log('Products report:', JSON.stringify(productsData, null, 2));

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testReportsApi();