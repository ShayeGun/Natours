const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRoute = require('./reviewRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

router.use('/:tourId/reviews', reviewRoute);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.strictTo('admin', 'lead_guide'),
    tourController.createTour
  );

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.strictTo('admin', 'lead_guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.strictTo('admin', 'lead_guide'),
    tourController.deleteTour
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

module.exports = router;
