const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.get('/me', userController.getMe);
router.put('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Admin only routes
router.use(authMiddleware.restrictTo('Admin'));
router.get('/admin/stats', userController.getDashboardStats);
router.get('/admin/all', userController.getAllUsers);
router.get('/admin/pending-experts', userController.getPendingExperts);
router.patch('/admin/verify-expert/:id', userController.verifyExpert);
router.post('/admin/create', userController.createUserByAdmin);
router.put('/admin/update/:id', userController.updateUserByAdmin);
router.delete('/admin/delete/:id', userController.deleteUserByAdmin);

// Expert resubmission (accessible to experts themselves)
router.post('/resubmit-expert', authMiddleware.restrictTo('Expert'), userController.resubmitExpertRequest);

module.exports = router;
