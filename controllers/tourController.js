const Tour = require('../models/tourModel');
const appError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'review' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stat = await Tour.aggregate([
    {
      $match: { duration: { $gte: 5 } },
    },
    {
      $group: {
        _id: '$ratingsAverage',
        avgPrice: { $avg: '$price' },
        counter: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stat,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    next(new appError('need latitude and longitude baby 🤗'), 400);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success😀',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    next(new appError('need latitude and longitude baby 🤗'), 400);

  const multiplier = unit === 'mi' ? 0.0006213712 : 0.001;

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [Number(lng), Number(lat)],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
        key: 'startLocation',
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: 'success😀',
    data: {
      data: distances,
    },
  });
});
