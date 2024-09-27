const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { auth, isAdmin } = require('../middleware/auth')

// User routes
router.post('/create', auth, orderController.createOrder)
router.post('/confirm', auth, orderController.confirmOrder)
router.get('/all', auth, orderController.getAllOrders)

router.get('/order-stats', auth, isAdmin, orderController.getAdminOrderStats)
router.get('/downloadcsv', auth, isAdmin, orderController.exportOrdersToCsv)
router.get('/downloadxlsx', auth, isAdmin, orderController.exportOrdersToXlsx)

// Admin routes
router.get('/admin/user/:userId', auth, isAdmin, orderController.getOrdersForUserByAdmin)

router.get('/:orderId', auth, orderController.getSingleOrder)



module.exports = router
