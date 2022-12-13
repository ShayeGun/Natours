const multer = require('multer');
const User = require('../models/userModel');
const appError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '/home/shy/Pictures');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]
    );
  },
});

const fileFilter = function(req, file, cb) {
  if (file.mimetype.split('/')[0] != 'image')
    cb(new appError('upload an image you banana head 🍌', 400));

  cb(null, true);
};

const upload = multer({ storage, fileFilter });

exports.uploadUserPhoto = upload.single('photo');

const filterObj = (reqBody, ...allowedFields) => {
  const newObj = {};
  Object.keys(reqBody).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = reqBody[el];
  });
  return newObj;
};

exports.updateInfo = catchAsync(async (req, res, next) => {
  // 1) if no password or password config was in req
  if (req.body.password || req.body.passwordConfig)
    return next(new appError('this page is not for updating password', 401));

  // 2) filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'email', 'name');
  if (req.file) filteredBody.photo = req.file.filename;

  // 3) update user document
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    user,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  // 1) find the user and update it
  // 2) expiring previous tokens => changedPasswordAt
  const user = await User.findByIdAndUpdate(req.user.id, {
    active: false,
    changedPasswordAt: Date.now(),
  });

  console.log(user);

  // 3) send response
  res.status(200).json({
    status: 'success',
    message: 'user was deleted',
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route will never work use /signup instead',
  });
};

// req.user.id comes from auth.protect & make it work with factory-func .getOne()
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// don't use for password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
