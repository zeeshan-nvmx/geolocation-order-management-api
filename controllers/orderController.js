const Order = require('../models/Order')
const Store = require('../models/Store')
const Product = require('../models/Product')
const axios = require('axios')

// Generate a 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const generateOrderId = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0') // Get month and pad to 2 digits
  const day = String(now.getDate()).padStart(2, '0') // Get day and pad to 2 digits
  const randomNumber = Math.floor(1000 + Math.random() * 9000) // Random 4-digit number

  return `ORD-${year}${month}${day}-${randomNumber}` // Example format: ORD-20240925-1234
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
    const { storeId, products, phoneNumber, location, remarks } = req.body

    // Check if location data is present and valid
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return res.status(400).json({ message: 'Valid location data (latitude and longitude) is required' })
    }

    // Find store
    const store = await Store.findById(storeId)
    if (!store) {
      return res.status(404).json({ message: 'Store not found' })
    }

    // Calculate total amount and validate products
    let totalAmount = 0
    const productList = []
    for (let product of products) {
      const productInfo = await Product.findById(product.id)
      if (!productInfo) {
        return res.status(400).json({ message: `Product ${product.id} not found` })
      }

      // Add SKU to the product details in the order
      productList.push({
        product: productInfo._id,
        sku: productInfo.sku, // Include the product SKU
        quantity: product.quantity,
      })

      totalAmount += productInfo.price * product.quantity
    }

    // Generate OTP and Order ID
    const otp = generateOTP()
    const orderId = generateOrderId()

    // Create order
    const order = new Order({
      user: req.user.id,
      store: store._id,
      products: productList,
      totalAmount,
      status: 'pending',
      otp,
      orderId, // Auto-generated order ID with year, month, date
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude], // Convert lat/lon to GeoJSON format
      },
      remarks, // Add remarks field
    })

    await order.save()

    // Send OTP via SMS
    const phoneToUse = phoneNumber || store.ownerPhone
    const message = `Your OTP for order confirmation is: ${otp}`
    await sendSMS(phoneToUse, message)

    return res.status(201).json({ message: 'Order created, waiting for OTP confirmation', order })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}


// exports.createOrder = async (req, res) => {
//   try {
//     const { storeId, products, phoneNumber } = req.body

//     // Find store
//     const store = await Store.findById(storeId)
//     if (!store) {
//       return res.status(404).json({ message: 'Store not found' })
//     }

//     // Calculate total amount
//     let totalAmount = 0
//     for (let product of products) {
//       const productInfo = await Product.findById(product.id)
//       if (!productInfo) {
//         return res.status(400).json({ message: `Product ${product.id} not found` })
//       }
//       totalAmount += productInfo.price * product.quantity
//     }

//     // Generate OTP
//     const otp = generateOTP()

//     // // mock otp
//     // const otp = '1234'

//     // Create order
//     const order = new Order({
//       user: req.user.id,
//       store: store._id,
//       products: products.map((p) => ({ product: p.id, quantity: p.quantity })),
//       totalAmount,
//       status: 'pending',
//       otp,
//     })
//     await order.save()

//     // Send OTP via SMS
//     const phoneToUse = phoneNumber || store.ownerPhone
//     const message = `Your OTP for order confirmation is: ${otp}`
//     await sendSMS(phoneToUse, message)

//     return res.status(201).json({ message: 'Order created, waiting for OTP confirmation', orderId: order._id })
//   } catch (error) {
//     return res.status(400).json({ message: error.message })
//   }
// }

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

    return res.json({ message: 'Order confirmed successfully' })
  } catch (error) {
    return res.status(400).json({ message: error.message })
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
    return res.json({ order })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    let filter = {}

    if (req.user.role === 'admin') {
      // Admin can view all orders
      filter = {}
    } else {
      // Regular user can view only their orders
      filter = { user: req.user.id }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('store', 'name')
      .populate('products.product', 'name price')

    const total = await Order.countDocuments(filter)

    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
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

    return res.status(200).json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}
