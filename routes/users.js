const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { auth, isAdmin } = require('../middleware/auth')

// Route for regular users and admins retrieving their own login history
router.get('/loginhistory', auth, userController.getLoginHistory)

// Route for user dashboard
router.get('/dashboard', auth, userController.getUserDashboard)

// Route for getting all users (admin only)
router.get('/', auth, isAdmin, userController.getUsers)

// Route for getting a single user by ID
router.get('/:id', auth, userController.getSingleUser)

module.exports = router
