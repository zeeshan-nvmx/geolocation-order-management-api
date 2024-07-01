require('dotenv').config() // Load environment variables from .env file
const express = require('express')
const mongoose = require('mongoose')
const logger = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')


// Import routes
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const storeRoutes = require('./routes/stores')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')

const app = express()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Security middleware
app.use(helmet()) 
app.use(cors()) 
app.use(mongoSanitize())

app.use(express.json())

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
// })
// app.use('/api', limiter)

// Middleware
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'Not found',
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  const statusCode = err.statusCode || 500
  const status = err.status || 'error'

  if (process.env.NODE_ENV === 'production') {
    // In production, don't send the stack trace
    res.status(statusCode).json({
      status: status,
      message: err.message,
    })
  } else {
    // In development, send the stack trace
    res.status(statusCode).json({
      status: status,
      message: err.message,
      stack: err.stack,
    })
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})

// Start the server
const PORT = process.env.PORT || 3000
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
