const express = require('express');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const router = express.Router({ mergeParams: true });

// only authorized users can access review routes
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.strictTo('user'),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.strictTo(['admin', 'user']),
    reviewController.updateReview
  )
  .delete(
    authController.strictTo(['admin', 'user']),
    reviewController.deleteReview
  );

module.exports = router;
