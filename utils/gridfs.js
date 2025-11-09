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
let connectionPromise = null;

// Ensure MongoDB connection is established
async function ensureConnection() {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    await connectionPromise;
    return mongoose.connection.db;
  }

  // Start new connection
  console.log('⏳ Establishing MongoDB connection...');
  connectionPromise = mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  try {
    await connectionPromise;
    console.log('✅ MongoDB connected');
    connectionPromise = null;
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    connectionPromise = null;
    throw error;
  }
}

async function initGridFS() {
  try {
    // Ensure connection first
    const db = await ensureConnection();

    if (!db) {
      throw new Error('Database not available after connection');
    }

    // Create new GridFS bucket
    gfsBucket = new GridFSBucket(db, { 
      bucketName: 'uploads' 
    });

    console.log('✅ GridFS bucket initialized');
    return gfsBucket;
  } catch (error) {
    console.error('❌ GridFS initialization error:', error);
    gfsBucket = null;
    throw error;
  }
}

async function getGridFSBucket() {
  // Always check connection state in serverless
  if (mongoose.connection.readyState !== 1 || !gfsBucket) {
    console.log('⚠️ GridFS bucket needs (re)initialization');
    return await initGridFS();
  }
  
  return gfsBucket;
}

// Helper to check if GridFS is ready
function isGridFSReady() {
  return gfsBucket !== null && mongoose.connection.readyState === 1;
}

// Clean up on exit (for local development)
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
    process.exit(0);
  });
}

module.exports = { 
  initGridFS, 
  getGridFSBucket,
  isGridFSReady,
  ensureConnection
};