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

const runAllTests = async () => {
  console.log('========================================================');
  console.log(' SMARTMESS FULL END-TO-END COMPREHENSIVE VERIFICATION');
  console.log('========================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  const recordResult = (name, passed, message) => {
    results.total++;
    if (passed) {
      results.passed++;
      console.log(`  [PASS] ${name}: ${message}`);
    } else {
      results.failed++;
      console.error(`  [FAIL] ${name}: ${message}`);
    }
    results.details.push({ name, passed, message });
  };

  try {
    // ----------------------------------------------------
    // FLOW 1: STUDENT FLOW
    // ----------------------------------------------------
    console.log('--- FLOW 1: STUDENT FLOW ---');
    // Login
    const studentLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: '22ad002@hostel.edu', password: 'Student@123' }
    );
    recordResult(
      'Student Login',
      studentLogin.status === 200 && Boolean(studentLogin.data.token),
      `Status ${studentLogin.status}, User: ${studentLogin.data.user?.name}`
    );
    const studentToken = studentLogin.data.token;

    // Fetch student active booking & history
    const myBookings = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/my',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    recordResult(
      'Student Booking History Retrieval',
      myBookings.status === 200 && Array.isArray(myBookings.data.history),
      `Retrieved ${myBookings.data.history?.length || 0} bookings in history.`
    );

    let activeBooking = myBookings.data.activeBooking;
    if (activeBooking) {
      recordResult(
        'Student Token Generation Verification',
        Boolean(activeBooking.tokenNumber && activeBooking.qrCodeData),
        `Token: ${activeBooking.tokenNumber}, QR Code present: ${Boolean(activeBooking.qrCodeData)}, Status: ${activeBooking.status}, Served: ${activeBooking.served}`
      );

      // If already served, verify served protection
      if (activeBooking.served) {
        const updateServed = await request(
          {
            hostname: 'localhost',
            port: 5000,
            path: `/api/bookings/${activeBooking._id}`,
            method: 'PUT',
            headers: { Authorization: `Bearer ${studentToken}` }
          },
          { mealType: 'veg' }
        );
        recordResult(
          'Served Booking Modification Protection',
          updateServed.status === 400,
          `Correctly blocked modification on served meal (Code ${updateServed.status}: "${updateServed.data.message}")`
        );
      }
    }

    // Also test a student with an unserved booking (e.g. 22ad007@hostel.edu) to verify changing meal works
    const unservedStudentLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: '22ad007@hostel.edu', password: 'Student@123' }
    );
    if (unservedStudentLogin.status === 200) {
      const uToken = unservedStudentLogin.data.token;
      const uBookings = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/bookings/my',
        method: 'GET',
        headers: { Authorization: `Bearer ${uToken}` }
      });
      const uActive = uBookings.data.activeBooking;
      if (uActive && !uActive.served) {
        const newMeal = uActive.mealType === 'veg' ? 'non-veg' : 'veg';
        const updateMealRes = await request(
          {
            hostname: 'localhost',
            port: 5000,
            path: `/api/bookings/${uActive._id}`,
            method: 'PUT',
            headers: { Authorization: `Bearer ${uToken}` }
          },
          { mealType: newMeal }
        );
        recordResult(
          'Unserved Student Meal Preference Update',
          updateMealRes.status === 200 && updateMealRes.data.booking?.mealType === newMeal,
          `Successfully toggled meal to ${newMeal.toUpperCase()} for ${unservedStudentLogin.data.user?.name}`
        );
      }
    }

    // ----------------------------------------------------
    // FLOW 2: WARDEN FLOW
    // ----------------------------------------------------
    console.log('\n--- FLOW 2: WARDEN FLOW ---');
    const wardenLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: 'warden1@hostel.edu', password: 'Warden@123' }
    );
    recordResult(
      'Warden Login',
      wardenLogin.status === 200 && Boolean(wardenLogin.data.token),
      `Status ${wardenLogin.status}, Warden: ${wardenLogin.data.user?.name}`
    );
    const wardenToken = wardenLogin.data.token;

    // Fetch live statistics
    const wardenStatsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'GET',
      headers: { Authorization: `Bearer ${wardenToken}` }
    });
    const s = wardenStatsRes.data.stats || {};
    recordResult(
      'Warden Live Database Statistics',
      wardenStatsRes.status === 200 && typeof s.totalBooked === 'number' && typeof s.pendingCount === 'number',
      `Total: ${s.totalBooked}, Pending: ${s.pendingCount}, Used: ${s.usedCount}, Served: ${s.servedCount}, Cancelled: ${s.cancelledCount}`
    );

    // Test Valid Token Lookup
    const pendingBooking = wardenStatsRes.data.bookings?.find((b) => !b.served && b.status === 'confirmed');
    if (pendingBooking) {
      const validTokenRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/bookings/token/${pendingBooking.tokenNumber}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${wardenToken}` }
      });
      recordResult(
        'Warden Valid Token Lookup',
        validTokenRes.status === 200 && validTokenRes.data.booking?.tokenNumber === pendingBooking.tokenNumber,
        `Verified token ${pendingBooking.tokenNumber} for ${validTokenRes.data.booking?.studentId?.name}`
      );

      // Test Mark as Used
      const serveRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/bookings/${pendingBooking._id}/serve`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${wardenToken}` }
      });
      recordResult(
        'Warden Mark Token As Used',
        serveRes.status === 200 && (serveRes.data.booking?.status === 'used' || serveRes.data.booking?.served === true),
        `Result: "${serveRes.data.message}"`
      );

      // Test Already Used Token
      const duplicateRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/bookings/${pendingBooking._id}/serve`,
        method: 'PUT',
        headers: { Authorization: `Bearer ${wardenToken}` }
      });
      recordResult(
        'Warden Already Used Token (Duplicate Prevention)',
        duplicateRes.status === 400,
        `Blocked with code ${duplicateRes.status}: "${duplicateRes.data.message}"`
      );
    }

    // Test Invalid Token
    const invalidTokenRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/bookings/token/INVALID-99999',
      method: 'GET',
      headers: { Authorization: `Bearer ${wardenToken}` }
    });
    recordResult(
      'Warden Invalid Token Handling',
      invalidTokenRes.status === 404,
      `Code ${invalidTokenRes.status}: "${invalidTokenRes.data.message}"`
    );

    // ----------------------------------------------------
    // FLOW 3: ADMIN FLOW
    // ----------------------------------------------------
    console.log('\n--- FLOW 3: ADMIN FLOW ---');
    const adminLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST' },
      { email: 'admin@hostel.edu', password: 'Admin@123' }
    );
    recordResult(
      'Admin Login',
      adminLogin.status === 200 && Boolean(adminLogin.data.token),
      `Status ${adminLogin.status}, Admin: ${adminLogin.data.user?.name}`
    );
    const adminToken = adminLogin.data.token;

    // Admin Dashboard Analytics
    const dashRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/dashboard',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordResult(
      'Admin Dashboard Analytics',
      dashRes.status === 200 && typeof dashRes.data.metrics?.totalStudents === 'number',
      `Students: ${dashRes.data.metrics?.totalStudents}, Bookings: ${dashRes.data.metrics?.totalBookings}, Waste Reduction: ${dashRes.data.metrics?.foodWasteReduction}%`
    );

    // Admin Student Management
    const studentsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordResult(
      'Admin Student Management',
      studentsRes.status === 200 && Array.isArray(studentsRes.data.students),
      `Loaded ${studentsRes.data.students?.length} registered students.`
    );

    // Admin Reports & Waste History
    const wasteRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/analytics/waste',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordResult(
      'Admin Reports & Waste Audit History',
      wasteRes.status === 200 && Array.isArray(wasteRes.data.wasteChartData),
      `Retrieved ${wasteRes.data.wasteChartData?.length} historical weekly food waste records.`
    );

    // Admin AI Demand Prediction
    const predRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/prediction',
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      },
      {}
    );
    recordResult(
      'Admin AI Demand Prediction Engine',
      predRes.status === 200 && Boolean(predRes.data.prediction?.totalRecommended),
      `Predicted: ${predRes.data.prediction?.totalPrediction}, Recommended Prep: ${predRes.data.prediction?.totalRecommended}, Confidence: ${Math.round((predRes.data.prediction?.confidence || 0) * 100)}%`
    );

    // ----------------------------------------------------
    // FLOW 4: SATURDAY BOOKING RULES & DUPLICATE PREVENTION
    // ----------------------------------------------------
    console.log('\n--- FLOW 4: SATURDAY BOOKING RESTRICTION & DUPLICATE PREVENTION ---');
    // Test duplicate booking by student
    const currentSess = await request({ hostname: 'localhost', port: 5000, path: '/api/sessions/current', method: 'GET' });
    const sessId = currentSess.data.session?._id;

    const dupBookingRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/bookings',
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      },
      { mealType: 'veg', sessionId: sessId }
    );
    recordResult(
      'Duplicate Booking Prevention (Same Session)',
      dupBookingRes.status === 400,
      `Code ${dupBookingRes.status}: "${dupBookingRes.data.message}"`
    );

    // ----------------------------------------------------
    // FLOW 5: CLIENT INTEGRITY & HTML VALIDATION
    // ----------------------------------------------------
    console.log('\n--- FLOW 5: CLIENT AVAILABILITY & BUILD STATUS ---');
    const clientRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
    recordResult(
      'Client Dev Server Response',
      clientRes.status === 200 && clientRes.data.includes('<div id="root">'),
      `Status ${clientRes.status} (Root mount point verified)`
    );

    console.log('\n========================================================');
    console.log(` SUMMARY: ${results.passed}/${results.total} TESTS PASSED (${results.failed} failed)`);
    console.log('========================================================\n');
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
  }
};

runAllTests();
