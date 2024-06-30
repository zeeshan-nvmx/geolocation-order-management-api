const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { auth, isAdmin } = require('../middleware/auth')

// User routes
router.post('/create', auth, orderController.createOrder)
router.post('/confirm', auth, orderController.confirmOrder)
router.get('/user', auth, orderController.getAllOrdersForUser)
router.get('/:orderId', auth, orderController.getSingleOrder)

// Admin routes
router.get('/admin/allorders', auth, isAdmin, orderController.getAllOrdersForAdmin)
router.get('/admin/user/:userId', auth, isAdmin, orderController.getOrdersForUserByAdmin)

module.exports = router
