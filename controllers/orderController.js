const Order = require('../models/Order')
const Store = require('../models/Store')
const Product = require('../models/Product')
const axios = require('axios')

// Generate a 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// SMS sending logic 
const sendSMS = async (phone, message) => {
  const greenwebsms = new URLSearchParams()
  greenwebsms.append('token', process.env.BDBULKSMS_TOKEN)
  greenwebsms.append('to', phone)
  greenwebsms.append('message', message)
  await axios.post('https://api.greenweb.com.bd/api.php', greenwebsms)
}

exports.createOrder = async (req, res) => {
  try {
    const { storeId, products, phoneNumber } = req.body

    // Find store
    const store = await Store.findById(storeId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found' })
    }

    // Calculate total amount
    let totalAmount = 0
    for (let product of products) {
      const productInfo = await Product.findById(product.id)
      if (!productInfo) {
        return res.status(400).json({ message: `Product ${product.id} not found` })
      }
      totalAmount += productInfo.price * product.quantity
    }

    // Generate OTP
    const otp = generateOTP()

    // Create order
    const order = new Order({
      user: req.user.id,
      store: store._id,
      products: products.map((p) => ({ product: p.id, quantity: p.quantity })),
      totalAmount,
      status: 'pending',
      otp,
    })
    await order.save()

    // Send OTP via SMS
    const phoneToUse = phoneNumber || store.ownerPhone
    const message = `Your OTP for order confirmation is: ${otp}`
    await sendSMS(phoneToUse, message)

    res.status(201).json({ message: 'Order created, waiting for OTP confirmation', orderId: order._id })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.confirmOrder = async (req, res) => {
  try {
    const { orderId, otp } = req.body

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not in pending state' })
    }

    // Verify OTP
    if (order.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    order.status = 'confirmed'
    await order.save()

    res.json({ message: 'Order confirmed successfully' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await Order.findById(orderId)
      .populate('store', 'name')
      .populate('products.product', 'name price')
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }
    res.json({ order })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getAllOrdersForUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('store', 'name')
      .populate('products.product', 'name price')

    const total = await Order.countDocuments({ user: req.user.id })

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getAllOrdersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('store', 'name')
      .populate('products.product', 'name price')

    const total = await Order.countDocuments()

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.getOrdersForUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('store', 'name')
      .populate('products.product', 'name price')

    const total = await Order.countDocuments({ user: userId })

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
