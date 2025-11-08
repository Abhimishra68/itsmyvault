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
  if (gfsBucket) return gfsBucket;

  // Ensure MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const db = mongoose.connection.db;
  gfsBucket = new GridFSBucket(db, { bucketName: 'uploads' });

  console.log('✅ GridFS bucket initialized');
  return gfsBucket;
}

async function getGridFSBucket() {
  if (!gfsBucket) {
    console.log('⚠️ GridFS bucket not initialized yet, initializing now...');
    await initGridFS();
  }
  return gfsBucket;
}

module.exports = { initGridFS, getGridFSBucket };
