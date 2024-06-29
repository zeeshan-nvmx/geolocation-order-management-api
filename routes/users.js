const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { auth, isAdmin } = require('../middleware/auth')


router.get('/', auth, isAdmin, userController.getUsers)
router.get('/dashboard', auth, userController.getUserDashboard)
router.get('/:id', auth, userController.getSingleUser)

module.exports = router
