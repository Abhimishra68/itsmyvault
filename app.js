require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const { initGridFS } = require('./utils/gridfs');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(() => {
    initGridFS(mongoose.connection);
    console.log("Connected to MongoDB Atlas and GridFS initialized");
   
  })
  .catch((error) => {
    console.error("MongoDB Atlas connection error:", error);
    process.exit(1);
  });

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.db?.databaseName || "unknown",
  });
});

app.use('/api', fileRoutes);

module.exports = app;