// routes/stores.js
const express = require('express')
const router = express.Router()
const storeController = require('../controllers/storeController')
const { auth } = require('../middleware/auth')

router.post('/', auth, storeController.createStore)
router.get('/', auth, storeController.getStores)

module.exports = router
