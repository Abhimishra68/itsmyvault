// const { GridFSBucket } = require('mongodb');
// let gfsBucket = null;

// function initGridFS(connection) {
//   gfsBucket = new GridFSBucket(connection.db, { bucketName: 'uploads' });
//   return gfsBucket;
// }

// function getGridFSBucket() {
//   if (!gfsBucket) throw new Error("GridFS bucket not initialized");
//   return gfsBucket;
// }

// module.exports = { initGridFS, getGridFSBucket };


// after vercel deploy 
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gfsBucket = null;
let isConnecting = false;

async function getGridFSBucket() {
  try {
    // If bucket exists and connection is alive, return it
    if (gfsBucket && mongoose.connection.readyState === 1) {
      return gfsBucket;
    }

    // Wait if connection is in progress
    if (isConnecting) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (!isConnecting && mongoose.connection.readyState === 1) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 10000);
      });
      
      if (gfsBucket && mongoose.connection.readyState === 1) {
        return gfsBucket;
      }
    }

    // Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      isConnecting = true;
      console.log('⏳ Connecting to MongoDB...');
      
      const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
      
      if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      isConnecting = false;
      console.log('✅ MongoDB connected');
    }

    // Create GridFS bucket
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }

    gfsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    console.log('✅ GridFS bucket created');
    return gfsBucket;

  } catch (error) {
    isConnecting = false;
    gfsBucket = null;
    console.error('❌ GridFS error:', error.message);
    throw new Error(`GridFS initialization failed: ${error.message}`);
  }
}

// Test function to verify everything works
async function testGridFS() {
  try {
    const bucket = await getGridFSBucket();
    console.log('✅ GridFS test passed');
    return true;
  } catch (error) {
    console.error('❌ GridFS test failed:', error);
    return false;
  }
}

module.exports = { 
  getGridFSBucket,
  testGridFS
};