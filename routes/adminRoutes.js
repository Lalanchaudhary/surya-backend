const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const auth = require('../middleware/auth');
// This route is protected but doesn't require admin role
router.get('/details', auth, adminController.getAdminDetails);
// Admins
router.get('/admins', adminController.getAllAdmins);
// FCM Token Management
router.post('/update-fcm-token', adminController.updateFCMToken);
// Protect all admin routes
router.use(auth);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);



// Users Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Products Management
router.get('/products', adminController.getAllProducts);
router.post('/products', adminController.createProduct);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Orders Management
router.get('/orders', adminController.getAllOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.put('/orders/:orderId/assign-admin', adminController.assignOrderToAdmin);



// Analytics
router.get('/analytics/sales', adminController.getSalesAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/products', adminController.getProductAnalytics);

// Delivery Management
router.get('/delivery', adminController.getAllDeliveryBoys);
router.post('/delivery', adminController.createDeliveryBoy);
router.put('/delivery/:id', adminController.updateDeliveryBoy);
router.delete('/delivery/:id', adminController.deleteDeliveryBoy);
router.post('/delivery/assign', adminController.assignOrderToDeliveryBoy);

module.exports = router; 