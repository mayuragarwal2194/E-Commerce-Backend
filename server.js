const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const productRoutes = require('./routes/productRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shop');

// Routes
app.use('/products', productRoutes);

app.use('/categories', categoryRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});