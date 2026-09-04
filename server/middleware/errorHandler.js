const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'An account with this email address already exists.';
    } else if (field === 'rollNumber') {
      message = 'An account with this roll number already exists.';
    } else if (field === 'studentId' || field === 'sessionId') {
      message = 'You have already booked a meal for this Sunday session.';
    } else {
      message = `Duplicate field value entered for ${field}.`;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };
