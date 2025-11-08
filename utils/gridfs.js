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

async function initGridFS() {
  try {
    // Wait for mongoose connection if not ready
    if (mongoose.connection.readyState !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
          mongoose.connection.once('error', reject);
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000);
        }
      });
    }

    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }

    // Create new bucket instance
    gfsBucket = new GridFSBucket(mongoose.connection.db, { 
      bucketName: 'uploads' 
    });

    console.log('✅ GridFS bucket initialized successfully');
    return gfsBucket;
  } catch (error) {
    console.error('❌ GridFS initialization error:', error);
    gfsBucket = null;
    throw error;
  }
}

async function getGridFSBucket() {
  // Always reinitialize for serverless to handle cold starts
  if (!gfsBucket || mongoose.connection.readyState !== 1) {
    console.log('⚠️ GridFS bucket needs (re)initialization');
    await initGridFS();
  }
  
  if (!gfsBucket) {
    throw new Error('GridFS bucket initialization failed');
  }
  
  return gfsBucket;
}

// Helper to check if GridFS is ready
function isGridFSReady() {
  return gfsBucket !== null && mongoose.connection.readyState === 1;
}

module.exports = { 
  initGridFS, 
  getGridFSBucket,
  isGridFSReady 
};