const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const ParentCategory = require('./models/parentCategory');

// Initialize Express app
const app = express();

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Constants
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const topCategoryRoutes = require('./routes/topCategoryRoutes');
const childCategoryRoutes = require('./routes/childCategoryRoutes');
const parentCategoryRoutes = require('./routes/parentCategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const sizeRoutes = require('./routes/sizeRoutes');

// Function to recreate indexes
const recreateIndexes = async () => {
  try {
    await ParentCategory.syncIndexes(); // This will recreate the indexes
    console.log('Indexes recreated');
  } catch (err) {
    console.error('Error recreating indexes:', err);
  }
};

// Start server function
const startServer = async () => {
  try {
    await connectDB(MONGODB_URI, PORT);
    await recreateIndexes();

    // Routes
    app.use('/api/v1/topcategories', topCategoryRoutes);
    app.use('/api/v1/parentcategories', parentCategoryRoutes);
    app.use('/childcategories', childCategoryRoutes);
    app.use('/products', productRoutes);
    app.use('/size', sizeRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1); // Exit process with failure
  }
};

// Start the server
startServer();