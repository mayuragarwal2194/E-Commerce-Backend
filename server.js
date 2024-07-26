const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Initialize Express app
const app = express();

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Import database connection
const connectDB = require('./config/db');

// Import routes
const childCategoryRoutes = require('./routes/childCategoryRoutes');
const parentCategoryRoutes = require('./routes/parentCategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const sizeRoutes = require('./routes/sizeRoutes');

// Constants
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB(process.env.MONGODB_URI, process.env.PORT);

// Routes
app.use('/parentcategories', parentCategoryRoutes);
app.use('/childcategories', childCategoryRoutes);
app.use('/products', productRoutes);
app.use('/size', sizeRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});