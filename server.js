require('dotenv').config() // Load environment variables from .env file
const express = require('express')
const mongoose = require('mongoose')
const logger = require('morgan')
const bodyParser = require('body-parser')

// Import routes
const authRoutes = require('./routes/auth')
// const userRoutes = require('./routes/users')
const storeRoutes = require('./routes/stores')
const productRoutes = require('./routes/products')
// const orderRoutes = require('./routes/orders')

const app = express()

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your_database_name')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Middleware
app.use(logger(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
// app.use('/api/users', userRoutes)
app.use('/api/stores', storeRoutes)
app.use('/api/products', productRoutes)
// app.use('/api/orders', orderRoutes)


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  if (err.name === 'MongoError' && err.code === 11000) {
    res.status(400).send('Duplicate key error')
  } else if (err instanceof mongoose.Error) {
    res.status(500).send('MongoDB Error: ' + err.message)
  } else {
    res.status(500).send('Something broke!')
  }
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
