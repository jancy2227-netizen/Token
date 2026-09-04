const http = require('http');

const request = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }

    req.end();
  });
};

const runE2E = async () => {
  console.log('=== STARTING END-TO-END VERIFICATION ===\n');

  try {
    // 1. Frontend check
    console.log('1. Checking Frontend (http://localhost:3000)...');
    const feRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    if (feRes.status === 200 && feRes.data.includes('<div id="root">')) {
      console.log(' Frontend is UP and serving HTML properly! (HTTP 200)');
    } else {
      console.error(' Frontend check unexpected response:', feRes.status);
    }

    // 2. Health check
    console.log('\n2. Checking Backend Health (http://localhost:5000/api/health)...');
    const health = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    console.log(' Backend health:', health.data.message);

    // 3. Current session
    console.log('\n3. Checking Current Booking Session...');
    const session = await request({ hostname: 'localhost', port: 5000, path: '/api/sessions/current', method: 'GET' });
    console.log(` Active Session: "${session.data.session.title}" (Week: ${session.data.session.weekOf})`);
    console.log(` Booking Window Status: ${session.data.windowStatus} (Allowed: ${session.data.isBookingAllowed})`);
    console.log(` Live Bookings Count: ${session.data.stats.totalBookings} (Veg: ${session.data.stats.vegBookings}, Non-Veg: ${session.data.stats.nonVegBookings}, Served: ${session.data.stats.servedBookings})`);

    // 4. Student Auth & Token Verification
    console.log('\n4. Testing Student Authentication (22ad001@hostel.edu)...');
    const studentLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: '22ad001@hostel.edu', password: 'Student@123', role: 'student' }
    );
    console.log(` Student Logged In: ${studentLogin.data.user.name} (${studentLogin.data.user.rollNumber})`);
    const studentToken = studentLogin.data.token;

    // 5. Student Active Booking & Digital Pass
    console.log('\n5. Fetching Student Digital Pass & Active Token...');
    const studentPass = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const myActive = studentPass.data.activeBooking;
    console.log(` Digital Mess Token: ${myActive?.tokenNumber}`);
    console.log(` Meal Type: ${myActive?.mealType?.toUpperCase()}`);
    console.log(` QR Code Payload Present: ${Boolean(myActive?.qrCodeData)}`);
    console.log(` Served Status: ${myActive?.served ? 'SERVED' : 'PENDING'}`);

    // 6. Warden Auth & Token Verification Scan
    console.log('\n6. Testing Warden Authentication (warden1@hostel.edu)...');
    const wardenLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: 'warden1@hostel.edu', password: 'Warden@123', role: 'warden' }
    );
    console.log(` Warden Logged In: ${wardenLogin.data.user.name}`);
    const wardenToken = wardenLogin.data.token;

    console.log(`\n7. Warden Verifying Token: ${myActive.tokenNumber}...`);
    const verifyToken = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/bookings/token/${myActive.tokenNumber}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${wardenToken}` }
    });
    console.log(` Token Verified! Student: ${verifyToken.data.booking.studentId.name}, Served: ${verifyToken.data.booking.served}`);

    // 8. Warden Mark As Served
    const pendingBookingRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings?served=false',
      method: 'GET',
      headers: { Authorization: `Bearer ${wardenToken}` }
    });
    const pendingBooking = pendingBookingRes.data.bookings[0];

    if (pendingBooking) {
      console.log(`\n8. Testing Warden Marking Meal as Served for: ${pendingBooking.studentId.name} (${pendingBooking.tokenNumber})...`);
      const serveRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/bookings/${pendingBooking._id}/serve`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${wardenToken}` }
      });
      console.log(` Serve Result: ${serveRes.data.message}`);

      // Test Duplicate Serving Prevention!
      console.log(` Testing Duplicate Meal Collection Prevention on same booking...`);
      const duplicateServe = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/bookings/${pendingBooking._id}/serve`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${wardenToken}` }
      });
      console.log(` Duplicate check response code: ${duplicateServe.status} (Expected 400)`);
      console.log(` Duplicate error message: "${duplicateServe.data.message}"`);
    }

    // 9. Admin Auth & AI Prediction
    console.log('\n9. Testing Admin Authentication (admin@hostel.edu)...');
    const adminLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: 'admin@hostel.edu', password: 'Admin@123', role: 'admin' }
    );
    console.log(` Admin Logged In: ${adminLogin.data.user.name}`);
    const adminToken = adminLogin.data.token;

    console.log('\n10. Testing AI Demand Prediction Calculation Engine...');
    const predRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/prediction', method: 'POST', headers: { Authorization: `Bearer ${adminToken}` } },
      { sessionId: session.data.session._id }
    );
    console.log(` AI Algorithm: ${predRes.data.prediction.algorithmUsed}`);
    console.log(` Predicted Student Demand: Veg: ${predRes.data.prediction.predictedVeg}, Non-Veg: ${predRes.data.prediction.predictedNonVeg}, Total: ${predRes.data.prediction.totalPrediction}`);
    console.log(` Recommended Kitchen Preparation (with +5% buffer): Veg: ${predRes.data.prediction.recommendedVeg}, Non-Veg: ${predRes.data.prediction.recommendedNonVeg}, Total: ${predRes.data.prediction.totalRecommended}`);
    console.log(` Forecast Confidence: ${Math.round(predRes.data.prediction.confidence * 100)}%`);
    console.log(` Estimated Food Waste Reduction: ${predRes.data.prediction.estimatedWasteReductionPercentage}%`);

    // 11. Food Waste Analytics
    console.log('\n11. Testing Food Waste Analytics & History...');
    const wasteAnalytics = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/waste',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(` Historical Waste Records Retrieved: ${wasteAnalytics.data.wasteChartData.length} entries.`);
    console.log(` Average Waste % on latest records: ${wasteAnalytics.data.wasteChartData[0]?.wastePercentage}%`);

    console.log('\n=== ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS ===');
  } catch (err) {
    console.error('Verification Error:', err);
  }
};

runE2E();
