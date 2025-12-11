#!/usr/bin/env node

const io = require('socket.io-client');
const axios = require('axios');

async function testWebSocket() {
  console.log('🧪 WebSocket E2E Test\n');

  // Step 1: Login to get token
  console.log('1️⃣ Logging in...');
  try {
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'superadmin@cipansor.id',
      password: 'SuperAdmin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 30)}...\n`);

    // Step 2: Connect to WebSocket with token
    console.log('2️⃣ Connecting to WebSocket...');
    const socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket']
    });

    // Handle connection
    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      console.log(`   Socket ID: ${socket.id}\n`);

      // Step 3: Subscribe to dashboard metrics
      console.log('3️⃣ Subscribing to dashboard metrics...');
      socket.emit('subscribe:dashboard');
    });

    // Handle metrics
    socket.on('dashboard:metrics', (data) => {
      console.log('✅ Received dashboard metrics:');
      console.log('   Students:', JSON.stringify(data.metrics.students, null, 2));
      console.log('   Teachers:', JSON.stringify(data.metrics.teachers, null, 2));
      console.log('   Attendance:', JSON.stringify(data.metrics.attendance, null, 2));
      console.log('   Timestamp:', data.metrics.timestamp);
      console.log('\n4️⃣ Testing unit-specific subscription...');
      
      // Step 4: Subscribe to unit-specific metrics
      socket.emit('subscribe:unit-dashboard', { unitId: '881da1dd-0b46-4f7c-a3ef-7c08275d5b8a' });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected:', reason);
    });

    // Handle connect_error
    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    });

    // Keep alive for 10 seconds
    setTimeout(() => {
      console.log('\n✅ Test completed successfully!');
      socket.disconnect();
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testWebSocket();
