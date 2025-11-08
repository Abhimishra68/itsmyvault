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

/**
 * Initialize GridFS bucket for Vercel serverless environment
 * CRITICAL: Must be called after MongoDB connection is established
 */
async function initGridFS() {
  try {
    console.log('🔄 GridFS initialization starting...');
    
    // Check mongoose connection state
    const state = mongoose.connection.readyState;
    console.log('   Mongoose state:', state, ['disconnected', 'connected', 'connecting', 'disconnecting'][state]);
    
    // If not connected, wait with timeout
    if (state !== 1) {
      console.log('⏳ Waiting for MongoDB connection...');
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout during GridFS init'));
        }, 8000);

        if (mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          resolve();
        } else {
          const onConnected = () => {
            clearTimeout(timeout);
            mongoose.connection.removeListener('error', onError);
            resolve();
          };
          
          const onError = (err) => {
            clearTimeout(timeout);
            mongoose.connection.removeListener('connected', onConnected);
            reject(err);
          };

          mongoose.connection.once('connected', onConnected);
          mongoose.connection.once('error', onError);
        }
      });
    }

    // Verify database is available
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database object not available');
    }

    // Create GridFS bucket
    gfsBucket = new GridFSBucket(mongoose.connection.db, { 
      bucketName: 'uploads',
      chunkSizeBytes: 1024 * 1024 // 1MB chunks for Vercel
    });

    console.log('✅ GridFS bucket initialized');
    console.log('   Database:', mongoose.connection.db.databaseName);
    console.log('   Bucket name: uploads');
    
    return gfsBucket;
    
  } catch (error) {
    console.error('❌ GridFS initialization failed:', error.message);
    gfsBucket = null;
    throw error;
  }
}

/**
 * Get GridFS bucket - always reinitialize for serverless cold starts
 */
async function getGridFSBucket() {
  try {
    // For serverless: always check and reinitialize if needed
    const mongoState = mongoose.connection.readyState;
    
    if (!gfsBucket || mongoState !== 1) {
      console.log('🔄 GridFS bucket needs initialization');
      console.log('   Bucket exists:', !!gfsBucket);
      console.log('   Mongo state:', mongoState);
      
      await initGridFS();
    }
    
    if (!gfsBucket) {
      throw new Error('GridFS bucket not initialized');
    }
    
    // Verify bucket is working
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database not available');
    }
    
    return gfsBucket;
    
  } catch (error) {
    console.error('❌ Failed to get GridFS bucket:', error.message);
    throw new Error(`GridFS unavailable: ${error.message}`);
  }
}

/**
 * Check if GridFS is ready without throwing
 */
function isGridFSReady() {
  const ready = gfsBucket !== null && mongoose.connection.readyState === 1;
  console.log('🔍 GridFS ready check:', ready);
  return ready;
}

/**
 * Reset GridFS (for testing/debugging)
 */
function resetGridFS() {
  console.log('🔄 Resetting GridFS bucket');
  gfsBucket = null;
}

module.exports = { 
  initGridFS, 
  getGridFSBucket,
  isGridFSReady,
  resetGridFS
};