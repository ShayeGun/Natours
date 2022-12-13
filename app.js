const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const appError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL MIDDLE WARES
// set security HTTP headers / returns a function that's why we call it
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'give a break to server for one hour 😮‍💨',
});

app.use('/api', limiter);

// bode parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// data sanitization against NoSQL query injection
app.use(mongoSanitize());
// data sanitization against XSS
app.use(xss());
// serving static files
app.use(express.static(`${__dirname}/public`));
// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// UNHANDLED ROUTES
app.all('*', (req, res, next) => {
  next(new appError(`this URL: ${req.originalUrl} isn't valid`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
