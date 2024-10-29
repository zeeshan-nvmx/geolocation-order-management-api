const Order = require('../models/Order')
const Store = require('../models/Store')
const Product = require('../models/Product')
const axios = require('axios')


const createCsvWriter = require('csv-writer').createObjectCsvWriter

const ExcelJS = require('exceljs')
const path = require('path')
const fs = require('fs')

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

// exports.createOrder = async (req, res) => {
//   try {
//     const { storeId, products, phoneNumber, location, remarks } = req.body

//     // Check if location data is present and valid
//     if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
//       return res.status(400).json({ message: 'Valid location data (latitude and longitude) is required' })
//     }

//     // Find store
//     const store = await Store.findById(storeId)
//     if (!store) {
//       return res.status(404).json({ message: 'Store not found' })
//     }

//     // Calculate total amount and validate products
//     let totalAmount = 0
//     const productList = []
//     for (let product of products) {
//       const productInfo = await Product.findById(product.id)
//       if (!productInfo) {
//         return res.status(400).json({ message: `Product ${product.id} not found` })
//       }

//       // Add SKU to the product details in the order
//       productList.push({
//         product: productInfo._id,
//         sku: productInfo.sku, // Include the product SKU
//         quantity: product.quantity,
//       })

//       totalAmount += productInfo.price * product.quantity
//     }

//     // Generate OTP and Order ID
//     const otp = generateOTP()
//     const orderId = generateOrderId()

//     // Create order
//     const order = new Order({
//       user: req.user.id,
//       store: store._id,
//       products: productList,
//       totalAmount,
//       status: 'pending',
//       phone: phoneNumber || store.ownerPhone,
//       otp,
//       orderId, // Auto-generated order ID with year, month, date
//       location: {
//         type: 'Point',
//         coordinates: [location.longitude, location.latitude], // Convert lat/lon to GeoJSON format
//       },
//       remarks, 
//     })

//     await order.save()

//     // Send OTP via SMS
//     const phoneToUse = phoneNumber || store.ownerPhone
//     const message = `Your OTP for order confirmation is: ${otp}`
//     await sendSMS(phoneToUse, message)

//     return res.status(201).json({ message: 'Order created, waiting for OTP confirmation', order })
//   } catch (error) {
//     return res.status(400).json({ message: error.message })
//   }
// }

exports.createOrder = async (req, res) => {
  try {

    console.log(req.user)
    const { storeId, products, phoneNumber, latitude, longitude, remarks, existingBrand, address, customerName } = req.body

    // Check if required fields are present
    if (!products || !phoneNumber || !latitude || !longitude || !address || !customerName) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Check if latitude and longitude are valid strings
    if (typeof latitude !== 'string' || typeof longitude !== 'string') {
      return res.status(400).json({ message: 'Latitude and longitude must be strings' })
    }

    let store
    if (storeId) {
      // Find store if storeId is provided
      store = await Store.findById(storeId)
      if (!store) {
        return res.status(404).json({ message: 'Store not found' })
      }
    }

    // Calculate total amount and validate products
    let totalAmount = 0
    const productList = []
    for (let product of products) {
      const productInfo = await Product.findById(product.id)
      if (!productInfo) {
        return res.status(400).json({ message: `Product ${product.id} not found` })
      }

      productList.push({
        product: productInfo._id,
        sku: productInfo.sku,
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
      createdBy: req.user.username,
      store: store ? store._id : undefined,
      products: productList,
      totalAmount,
      status: 'pending',
      phone: phoneNumber,
      address,
      customerName,
      otp,
      orderId,
      latitude,
      longitude,
      remarks,
      existingBrand
    })

    await order.save()

    // Send OTP via SMS
    const message = `Your OTP for order confirmation is: ${otp}`
    await sendSMS(phoneNumber, message)

    return res.status(201).json({ message: 'Order created, waiting for OTP confirmation', order })
  } catch (error) {
    return res.status(500).json({ message: error.message })
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

    return res.json({ message: 'Order confirmed successfully' })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

exports.getSingleOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await Order.findById(orderId)
      .populate('store', 'name ownerPhone')
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


exports.getAdminOrderStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // Today's total order number and sales amount
    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSales: { $sum: '$totalAmount' },
        },
      },
    ])

    // This month's total ordered amount
    const thisMonthStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ])

    // Last month's total ordered amount
    const lastMonthStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          status: 'confirmed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ])

    // Product quantities ordered this month and last month
    const productStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfNextMonth },
          status: 'confirmed',
        },
      },
      { $unwind: '$products' },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            product: '$products.product',
            sku: '$products.sku',
          },
          totalQuantity: { $sum: '$products.quantity' },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      {
        $project: {
          month: '$_id.month',
          product: { $arrayElemAt: ['$productInfo.name', 0] },
          sku: '$_id.sku',
          totalQuantity: 1,
        },
      },
      {
        $group: {
          _id: '$month',
          products: {
            $push: {
              name: '$product',
              sku: '$sku',
              quantity: '$totalQuantity',
            },
          },
        },
      },
    ])

    // Process product stats
    const thisMonthProducts = productStats.find((stat) => stat._id === today.getMonth() + 1)?.products || []
    const lastMonthProducts = productStats.find((stat) => stat._id === today.getMonth())?.products || []

    res.json({
      todayOrderCount: todayStats[0]?.orderCount || 0,
      todayTotalSales: todayStats[0]?.totalSales || 0,
      thisMonthTotalAmount: thisMonthStats[0]?.totalAmount || 0,
      lastMonthTotalAmount: lastMonthStats[0]?.totalAmount || 0,
      thisMonthProducts,
      lastMonthProducts,
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.exportOrdersToCsv = async (req, res) => {
  try {
    const orders = await Order.find().populate('user store products.product')

    const csvWriter = createCsvWriter({
      path: 'orders_export.csv',
      header: [
        { id: 'orderId', title: 'Order ID' },
        { id: 'customerName', title: 'Customer Name' },
        { id: 'phone', title: 'Phone' },
        { id: 'address', title: 'Address' },
        { id: 'totalAmount', title: 'Total Amount' },
        { id: 'status', title: 'Status' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'location', title: 'Google Maps Location' },
        { id: 'products', title: 'Products' },
        { id: 'remarks', title: 'Remarks' },
      ],
    })

    const records = orders.map((order) => ({
      orderId: order.orderId,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      location: `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`,
      products: order.products.map((p) => `${p.product.name} (${p.quantity})`).join(', '),
      remarks: order.remarks || '',
    }))

    await csvWriter.writeRecords(records)

    res.download('orders_export.csv', 'orders_export.csv', (err) => {
      if (err) {
        console.error('Error downloading file:', err)
        res.status(500).send('Error downloading file')
      }
    })
  } catch (error) {
    console.error('Error exporting orders:', error)
    res.status(500).send('Error exporting orders')
  }
}

// exports.exportOrdersToXlsx = async (req, res) => {
//   try {
//     const orders = await Order.find().populate('user store products.product')

//     const workbook = new ExcelJS.Workbook()
//     const worksheet = workbook.addWorksheet('Orders')

//     worksheet.columns = [
//       { header: 'Order ID', key: 'orderId', width: 15 },
//       { header: 'Customer Name', key: 'customerName', width: 20 },
//       { header: 'Phone', key: 'phone', width: 15 },
//       { header: 'Address', key: 'address', width: 30 },
//       { header: 'Total Amount', key: 'totalAmount', width: 15 },
//       { header: 'Status', key: 'status', width: 10 },
//       { header: 'Created At', key: 'createdAt', width: 20 },
//       { header: 'Google Maps Location', key: 'location', width: 50 },
//       { header: 'Products', key: 'products', width: 50 },
//       { header: 'Remarks', key: 'remarks', width: 30 },
//     ]

//     orders.forEach((order) => {
//       worksheet.addRow({
//         orderId: order.orderId,
//         customerName: order.customerName,
//         phone: order.phone,
//         address: order.address,
//         totalAmount: order.totalAmount,
//         status: order.status,
//         createdAt: order.createdAt.toISOString(),
//         location: `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`,
//         products: order.products.map((p) => `${p.product.name} (${p.quantity})`).join(', '),
//         remarks: order.remarks || '',
//       })
//     })

//     // Ensure phone numbers are treated as text
//     worksheet.getColumn('phone').eachCell({ includeEmpty: true }, function (cell, rowNumber) {
//       if (rowNumber !== 1) {
//         // Skip header row
//         cell.numFmt = '@' // Set number format to Text
//       }
//     })

//     // Save file in the root folder
//     const rootDir = path.resolve(__dirname, '..')
//     const exportPath = path.join(rootDir, 'orders_export.xlsx')
//     await workbook.xlsx.writeFile(exportPath)

//     console.log(`File saved successfully at ${exportPath}`)
//     res.status(200).json({ message: 'File exported successfully', path: exportPath })
//   } catch (error) {
//     console.error('Error exporting orders:', error)
//     res.status(500).json({ error: 'Error exporting orders' })
//   }
// }

// export orders in excel format
exports.exportOrdersToXlsx = async (req, res) => {
  try {
    const orders = await Order.find().populate('user store products.product')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Orders')

    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Google Maps Location', key: 'location', width: 50 },
      { header: 'Products', key: 'products', width: 50 },
      { header: 'Remarks', key: 'remarks', width: 30 },
    ]

    orders.forEach((order) => {
      worksheet.addRow({
        orderId: order.orderId,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        location: `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`,
        products: order.products.map((p) => `${p.product.name} (${p.quantity})`).join(', '),
        remarks: order.remarks || '',
      })
    })

    // Ensure phone numbers are treated as text
    worksheet.getColumn('phone').eachCell({ includeEmpty: true }, function (cell, rowNumber) {
      if (rowNumber !== 1) {
        // Skip header row
        cell.numFmt = '@' // Set number format to Text
      }
    })

    // Generate filename with current date and time
    const now = new Date()
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '')
    const filename = `orders_export_${timestamp}.xlsx`

    // Save file in the root folder
    const rootDir = path.resolve(__dirname, '..')
    const exportPath = path.join(rootDir, filename)
    await workbook.xlsx.writeFile(exportPath)

    console.log(`File saved successfully at ${exportPath}`)

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)

    // Stream the file to the client
    const fileStream = fs.createReadStream(exportPath)
    fileStream.pipe(res)

    // Log when the file has been sent
    fileStream.on('close', () => {
      console.log(`File ${filename} has been sent to the client`)
    })
  } catch (error) {
    console.error('Error exporting orders:', error)
    res.status(500).json({ error: 'Error exporting orders' })
  }
}