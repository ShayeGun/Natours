const mongoose = require('mongoose');
const Tour = require('../models/tourModel');

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must have a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must have a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// each user only can write one review for every single tour no more !
reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'user tour',
  //   select: '-__v',
  // });
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAvgRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: stats[0].nRating,
    ratingsAverage: stats[0].avgRating,
  });
};

reviewSchema.post('save', function() {
  this.constructor.calcAvgRatings(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function() {
  const thisReview = await this.findOne().clone();
  if (thisReview != null)
    await thisReview.constructor.calcAvgRatings(thisReview.tour._id);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
