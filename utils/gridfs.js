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
let initPromise = null;

async function initGridFS() {
  // If already initializing, wait for that to complete
  if (initPromise) {
    console.log('⏳ GridFS initialization in progress, waiting...');
    return initPromise;
  }

  // If already initialized and connection is good, return existing bucket
  if (gfsBucket && mongoose.connection.readyState === 1) {
    console.log('✅ Using existing GridFS bucket');
    return gfsBucket;
  }

  // Create new initialization promise
  initPromise = (async () => {
    try {
      console.log('🔄 Initializing GridFS...');
      console.log('   Mongoose state:', mongoose.connection.readyState);
      
      // Wait for mongoose connection if not ready
      if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for MongoDB connection...');
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('MongoDB connection timeout (5s)'));
          }, 5000);

          if (mongoose.connection.readyState === 1) {
            clearTimeout(timeout);
            resolve();
          } else {
            mongoose.connection.once('connected', () => {
              clearTimeout(timeout);
              resolve();
            });
            mongoose.connection.once('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          }
        });
      }

      if (!mongoose.connection.db) {
        throw new Error('MongoDB database not available');
      }

      // Create GridFS bucket
      gfsBucket = new GridFSBucket(mongoose.connection.db, { 
        bucketName: 'uploads',
        chunkSizeBytes: 1024 * 1024 // 1MB chunks
      });

      console.log('✅ GridFS bucket initialized successfully');
      console.log('   Database:', mongoose.connection.db.databaseName);
      console.log('   Bucket:', 'uploads');
      
      return gfsBucket;
    } catch (error) {
      console.error('❌ GridFS initialization error:', error);
      gfsBucket = null;
      throw error;
    } finally {
      // Clear the promise so next call can retry
      initPromise = null;
    }
  })();

  return initPromise;
}

async function getGridFSBucket() {
  try {
    // Always try to reinitialize for serverless (handles cold starts)
    if (!gfsBucket || mongoose.connection.readyState !== 1) {
      console.log('⚠️ GridFS bucket needs (re)initialization');
      await initGridFS();
    }
    
    if (!gfsBucket) {
      throw new Error('GridFS bucket initialization failed');
    }
    
    return gfsBucket;
  } catch (error) {
    console.error('❌ Failed to get GridFS bucket:', error);
    throw new Error(`GridFS not available: ${error.message}`);
  }
}

// Helper to check if GridFS is ready
function isGridFSReady() {
  return gfsBucket !== null && mongoose.connection.readyState === 1;
}

// Reset function for testing
function resetGridFS() {
  console.log('🔄 Resetting GridFS bucket');
  gfsBucket = null;
  initPromise = null;
}

module.exports = { 
  initGridFS, 
  getGridFSBucket,
  isGridFSReady,
  resetGridFS
};