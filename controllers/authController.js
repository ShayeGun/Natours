const crypto = require('crypto');
const { promisify } = require('node:util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

function createSendToken(user, statusCode, res) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_AT,
  });

  const cookiesOpt = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_JWT_EXPIRES_AT * 24 * 60 * 60 * 1000
    ),
  };
  // only in production use HTTPs
  if (process.env.NODE_ENV === 'production') cookiesOpt.secure = true;

  // creating a cookie
  res.cookie('jwt', token, cookiesOpt);

  // not showing password in response
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    user: user,
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const addUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfig: req.body.passwordConfig,
    role: req.body.role,
  });
  createSendToken(addUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  // 1) if there is no email or password
  if (!email || !password) {
    return next(new appError('please enter email and password', 400));
  }

  // 2) check if email and password are valid
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new appError('email or password is invalid 😕', 401));
  }
  // 3) if every thing was OK
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // if token exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new appError('Not logged in 😒', 401));
  }

  // if token is valid
  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // checks if user still exist
  const existedUser = await User.findById(decode.id);
  if (!existedUser) {
    return next(new appError('RIP good old user 💀', 401));
  }

  // check if password was not changed
  // changedPasswordAfter() is a model method
  if (existedUser.changedPasswordAfter(decode.iat)) {
    return next(
      new appError('dear hacker password was changed, login again honey 😘')
    );
  }

  // grant access to protected routes
  req.user = existedUser;

  next();
});

exports.strictTo = (...authArr) => {
  return (req, res, next) => {
    if (!authArr[0].includes(req.user.role)) {
      return next(
        new appError(
          "you're not authorized darling to do this kind of things 😏",
          403
        )
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) if the user exist
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new appError('no such user exist!', 404));
  }

  // 2) generate a random reset token (user model method)
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  console.log(resetToken);

  // 3) send an email with a token
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    const opt = {
      email: req.body.email,
      subject: 'reset your password in 10 min',
      message: `go to this ${resetURL} URL 😉`,
    };
    sendEmail(opt);

    res.status(200).json({
      status: 'success',
      message: 'Email was sent :)',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new appError('there was a problem in sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  const hashedPass = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedPass,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if user is valid and token is not expired
  if (!user) {
    return next(new appError('user not found or token has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfig = req.body.passwordConfig;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update changePasswordAt property for user at User model as pre middleware
  // 4) login user + send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) find user in DB
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );

  // 2) check if password is correct or user doesn't exist
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new appError('pass is wrong Sir 😅', 401));

  // 3) update the password
  user.password = req.body.password;
  user.passwordConfig = req.body.passwordConfig;
  await user.save();

  // 4) login user with new JWT
  createSendToken(user, 200, res);
});
