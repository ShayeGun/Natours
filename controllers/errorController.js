const appError = require('./../utils/appError');

function sendErrDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
}

function sendErrProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // for developer
    console.error('Error 💥 : ', err);

    // for user
    res.status(500).json({
      status: 'Error',
      message: 'sth went very very wrong!',
      err: err,
    });
  }
}

function handleCastErrDB(err) {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new appError(message, 400);
}

function handleDuplicateFieldDB(err) {
  const message = `duplicate name : ${err.keyValue.name}`;
  return new appError(message, 400);
}

function handleJWTError() {
  return new appError('invalid token Please login!', 401);
}

function handleTokenExpired() {
  return new appError('token expired Please login again!', 401);
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'wrong';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.kind === 'ObjectId') {
      error = handleCastErrDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateFieldDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleTokenExpired();
    }

    sendErrProd(error, res);
  }

  next();
};
