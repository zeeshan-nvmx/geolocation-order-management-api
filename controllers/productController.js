const Product = require('../models/Product')

exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      createdBy: req.user.id,
    })
    await product.save()
    return res.status(201).json(product)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
    return res.status(200).json(products)
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    return res.status(200).json(product)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    return res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}
