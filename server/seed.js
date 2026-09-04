require('dotenv').config();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const { connectDB, disconnectDB } = require('./config/db');

// Models
const User = require('./models/User');
const BookingSession = require('./models/BookingSession');
const Booking = require('./models/Booking');
const FoodRecord = require('./models/FoodRecord');
const Prediction = require('./models/Prediction');
const Notification = require('./models/Notification');

const seedData = async () => {
  try {
    console.log('--- Starting Database Seeding ---');
    await connectDB();

    // Clear existing data
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      BookingSession.deleteMany({}),
      Booking.deleteMany({}),
      FoodRecord.deleteMany({}),
      Prediction.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // 1. Create Admin
    console.log('Creating Admin account...');
    const admin = await User.create({
      name: 'Dr. Ramesh Kumar (Chief Warden)',
      email: 'admin@hostel.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98765 43210'
    });

    // 2. Create Wardens
    console.log('Creating Warden accounts...');
    const warden1 = await User.create({
      name: 'Mr. Rajesh Sharma (Mess Warden A)',
      email: 'warden1@hostel.edu',
      password: 'Warden@123',
      role: 'warden',
      phone: '+91 98765 11111'
    });

    const warden2 = await User.create({
      name: 'Mrs. Sunita Verma (Mess Warden B)',
      email: 'warden2@hostel.edu',
      password: 'Warden@123',
      role: 'warden',
      phone: '+91 98765 22222'
    });

    // 3. Create 20 Students
    console.log('Creating 20 Student accounts...');
    const studentProfiles = [
      { name: 'Aarav Patel', roll: '22AD001', room: 'A-201', dept: 'AI & Data Science', year: '3rd Year', pref: 'veg' },
      { name: 'Diya Sharma', roll: '22AD002', room: 'B-104', dept: 'Computer Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Rohan Iyer', roll: '22AD003', room: 'A-205', dept: 'AI & Data Science', year: '3rd Year', pref: 'veg' },
      { name: 'Ananya Reddy', roll: '22AD004', room: 'B-212', dept: 'Information Tech', year: '3rd Year', pref: 'non-veg' },
      { name: 'Aditya Verma', roll: '22AD005', room: 'A-310', dept: 'AI & Data Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Kavya Nair', roll: '22AD006', room: 'B-118', dept: 'Computer Science', year: '2nd Year', pref: 'veg' },
      { name: 'Siddharth Rao', roll: '22AD007', room: 'A-102', dept: 'Data Science', year: '4th Year', pref: 'non-veg' },
      { name: 'Pooja Hegde', roll: '22AD008', room: 'B-304', dept: 'Electronics & Comm', year: '3rd Year', pref: 'veg' },
      { name: 'Varun Joshi', roll: '22AD009', room: 'A-412', dept: 'AI & Machine Learning', year: '2nd Year', pref: 'non-veg' },
      { name: 'Sneha Kulkarni', roll: '22AD010', room: 'B-201', dept: 'Computer Science', year: '3rd Year', pref: 'veg' },
      { name: 'Gautam Menon', roll: '22AD011', room: 'A-208', dept: 'AI & Data Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Meera Nambiar', roll: '22AD012', room: 'B-109', dept: 'Information Tech', year: '1st Year', pref: 'veg' },
      { name: 'Karthik Subramanian', roll: '22AD013', room: 'A-315', dept: 'AI & Data Science', year: '4th Year', pref: 'non-veg' },
      { name: 'Ishita Sen', roll: '22AD014', room: 'B-310', dept: 'Computer Science', year: '2nd Year', pref: 'veg' },
      { name: 'Pranav Deshmukh', roll: '22AD015', room: 'A-110', dept: 'Data Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Riya Mukherjee', roll: '22AD016', room: 'B-215', dept: 'Computer Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Harshvardhan Singh', roll: '22AD017', room: 'A-404', dept: 'Information Tech', year: '4th Year', pref: 'veg' },
      { name: 'Nandini Choudhury', roll: '22AD018', room: 'B-112', dept: 'AI & Data Science', year: '2nd Year', pref: 'veg' },
      { name: 'Yash Agarwal', roll: '22AD019', room: 'A-302', dept: 'Computer Science', year: '3rd Year', pref: 'non-veg' },
      { name: 'Tanvi Saxena', roll: '22AD020', room: 'B-208', dept: 'AI & Data Science', year: '3rd Year', pref: 'veg' }
    ];

    const students = [];
    for (let i = 0; i < studentProfiles.length; i++) {
      const p = studentProfiles[i];
      const student = await User.create({
        name: p.name,
        email: `${p.roll.toLowerCase()}@hostel.edu`,
        password: 'Student@123',
        role: 'student',
        rollNumber: p.roll,
        roomNumber: p.room,
        department: p.dept,
        year: p.year,
        phone: `+91 91234 ${String(10000 + i)}`,
        mealPreference: p.pref
      });
      students.push(student);
    }

    // 4. Create Historical Sessions (Last 5 Weeks)
    console.log('Creating historical booking sessions...');
    const historicalSessions = [];
    const baseDate = new Date(); // Current date

    for (let w = 5; w >= 1; w--) {
      const sunDate = new Date(baseDate);
      sunDate.setDate(baseDate.getDate() - (w * 7));

      const satOpen = new Date(sunDate);
      satOpen.setDate(sunDate.getDate() - 1);
      satOpen.setHours(18, 0, 0, 0);

      const satClose = new Date(satOpen);
      satClose.setHours(21, 0, 0, 0);

      const session = await BookingSession.create({
        title: `Sunday Feast Week ${35 - w}`,
        weekOf: `2026-W${35 - w}`,
        sundayDate: sunDate,
        bookingOpen: satOpen,
        bookingClose: satClose,
        status: 'completed',
        isTestOverride: false,
        menuDetails: {
          vegItem: 'Paneer Butter Masala, Jeera Rice, Dal Tadka, Butter Naan',
          nonVegItem: 'Chicken Dum Biryani, Mirchi Ka Salan, Onion Raita',
          dessert: 'Gulab Jamun with Rabri',
          specialNotes: 'Historical session data archived.'
        }
      });
      historicalSessions.push(session);

      // Create past food waste record for each historical session
      const prepVeg = 190 + Math.floor(Math.random() * 20);
      const prepNonVeg = 320 + Math.floor(Math.random() * 25);
      const prepTotal = prepVeg + prepNonVeg;

      const servedVeg = prepVeg - (5 + Math.floor(Math.random() * 10));
      const servedNonVeg = prepNonVeg - (8 + Math.floor(Math.random() * 14));
      const servedTotal = servedVeg + servedNonVeg;

      const remTotal = prepTotal - servedTotal;
      const vegWaste = prepVeg - servedVeg;
      const nonVegWaste = prepNonVeg - servedNonVeg;
      const wastedTotal = vegWaste + nonVegWaste;
      const wastePct = Number(((wastedTotal / prepTotal) * 100).toFixed(2));

      await FoodRecord.create({
        sessionId: session._id,
        date: sunDate,
        preparedVeg: prepVeg,
        preparedNonVeg: prepNonVeg,
        preparedQuantity: prepTotal,
        servedVeg,
        servedNonVeg,
        servedQuantity: servedTotal,
        remainingQuantity: remTotal,
        vegWaste,
        nonVegWaste,
        wastedQuantity: wastedTotal,
        wastePercentage: wastePct,
        notes: `Week ${35 - w} Sunday meal completed. Food waste maintained below 8%.`,
        recordedBy: warden1._id,
        recordedAt: sunDate
      });

      // Create historical prediction record
      await Prediction.create({
        sessionId: session._id,
        predictedVeg: Math.round(prepVeg * 0.96),
        predictedNonVeg: Math.round(prepNonVeg * 0.95),
        totalPrediction: Math.round(prepTotal * 0.955),
        recommendedVeg: prepVeg,
        recommendedNonVeg: prepNonVeg,
        totalRecommended: prepTotal,
        confidence: 0.93,
        algorithmUsed: 'Scikit-Learn Multi-Feature Regression & Safety Buffer',
        estimatedWasteReductionPercentage: 35.0,
        createdAt: satClose
      });
    }

    // 5. Create Current Active / Upcoming Session
    console.log('Creating current active Sunday session...');
    const now = new Date();
    // Set current Sunday date to this upcoming Sunday
    const currentSunday = new Date(now);
    const dayOfWeek = now.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    currentSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 0 : daysUntilSunday));

    // Saturday 6:00 PM to 9:00 PM
    const satBookingOpen = new Date(currentSunday);
    satBookingOpen.setDate(currentSunday.getDate() - 1);
    satBookingOpen.setHours(18, 0, 0, 0);

    const satBookingClose = new Date(satBookingOpen);
    satBookingClose.setHours(21, 0, 0, 0);

    // Make current session active and enable test override so reviewers can immediately demo booking
    const currentSession = await BookingSession.create({
      title: 'Grand Sunday Feast & Royal Biryani',
      weekOf: '2026-W36',
      sundayDate: currentSunday,
      bookingOpen: satBookingOpen,
      bookingClose: satBookingClose,
      status: 'open',
      isTestOverride: true, // Allows instant booking demo out-of-the-box
      menuDetails: {
        vegItem: 'Shahi Paneer, Kashmiri Pulao, Dal Makhani, Garlic Butter Naan',
        nonVegItem: 'Hyderabadi Chicken Biryani, Chicken Tikka, Raita, Salan',
        dessert: 'Angoori Rasmalai & Ice Cream',
        specialNotes: 'Freshly prepared. Mess counter opens Sunday 12:30 PM - 3:00 PM.'
      }
    });

    // 6. Create realistic bookings for students in current session
    console.log('Generating realistic bookings and digital QR tokens...');
    for (let i = 0; i < 15; i++) {
      const student = students[i];
      const mealType = i % 3 === 0 ? 'veg' : 'non-veg';
      const tokenNumber = `SM-2026-${String(145 + i).padStart(6, '0')}`;

      const qrPayload = JSON.stringify({
        token: tokenNumber,
        studentId: student._id,
        rollNumber: student.rollNumber,
        name: student.name,
        mealType,
        sundayDate: currentSunday
      });

      const qrCodeData = await QRCode.toDataURL(qrPayload);

      // Mark first 4 bookings as already served to test warden badges and duplicate prevention
      const isServed = i < 4;

      await Booking.create({
        studentId: student._id,
        sessionId: currentSession._id,
        mealType,
        tokenNumber,
        qrCodeData,
        status: 'confirmed',
        served: isServed,
        bookedAt: new Date(Date.now() - (i * 3600000)),
        servedAt: isServed ? new Date(Date.now() - (i * 1800000)) : null,
        servedBy: isServed ? warden1._id : null
      });

      // Send initial welcome notification
      await Notification.create({
        userId: student._id,
        title: 'Sunday Meal Confirmed',
        message: `Your ${mealType.toUpperCase()} meal for Sunday is confirmed. Digital Token: ${tokenNumber}`,
        type: 'success'
      });
    }

    // 1 student with cancelled booking for testing re-booking logic
    const cancelledStudent = students[15];
    const cancelledToken = `SM-2026-000199`;
    const cancelledQr = await QRCode.toDataURL(JSON.stringify({ token: cancelledToken, student: cancelledStudent.name }));
    await Booking.create({
      studentId: cancelledStudent._id,
      sessionId: currentSession._id,
      mealType: 'veg',
      tokenNumber: cancelledToken,
      qrCodeData: cancelledQr,
      status: 'cancelled',
      served: false,
      bookedAt: new Date(Date.now() - 7200000),
      cancelledAt: new Date(Date.now() - 3600000)
    });

    // 7. Seed current session AI demand prediction
    console.log('Generating AI Demand Prediction for current session...');
    await Prediction.create({
      sessionId: currentSession._id,
      predictedVeg: 185,
      predictedNonVeg: 315,
      totalPrediction: 500,
      recommendedVeg: 195,
      recommendedNonVeg: 330,
      totalRecommended: 525,
      confidence: 0.94,
      algorithmUsed: 'Scikit-Learn Multi-Feature Regression & Heuristic Safety Buffer',
      estimatedWasteReductionPercentage: 34.2,
      featuresInput: {
        historicalSessionsSampled: 5,
        historicalAttendanceRate: 94.2,
        currentBookingsVeg: 6,
        currentBookingsNonVeg: 9
      }
    });

    console.log('=======================================================');
    console.log(' DATABASE SEEDED SUCCESSFULLY! ');
    console.log('=======================================================');
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@hostel.edu    / Admin@123');
    console.log('  Warden:  warden1@hostel.edu  / Warden@123');
    console.log('  Student: 22ad001@hostel.edu  / Student@123');
    console.log('  Student: 22ad002@hostel.edu  / Student@123');
    console.log('=======================================================');

    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };
