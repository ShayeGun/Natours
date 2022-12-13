const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// all the routes beneath this router.use() will be checked for authentication and then proceed
router.use(authController.protect);

router.patch('/updatePassword', authController.updatePassword);

router
  .route('/updateInfo')
  .patch(userController.uploadUserPhoto, userController.updateInfo);

router.route('/deleteMe').delete(userController.deleteMe);

router.route('/me').get(userController.getMe, userController.getUser);

// only admins have access to routes below
router.use(authController.strictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
