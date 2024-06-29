const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { auth, isAdmin } = require('../middleware/auth')

router.post('/', auth, isAdmin, productController.createProduct)
router.get('/', auth, productController.getProducts)
router.put('/:id', auth, isAdmin, productController.updateProduct)
router.delete('/:id', auth, isAdmin, productController.deleteProduct)

module.exports = router
