const { GridFSBucket } = require('mongodb');
let gfsBucket = null;

function initGridFS(connection) {
  gfsBucket = new GridFSBucket(connection.db, { bucketName: 'uploads' });
  return gfsBucket;
}

function getGridFSBucket() {
  if (!gfsBucket) throw new Error("GridFS bucket not initialized");
  return gfsBucket;
}

module.exports = { initGridFS, getGridFSBucket };