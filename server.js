// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use('/uploads', express.static('uploads'));

// // MongoDB Atlas connection with SSL fix
// const MONGODB_URI = process.env.MONGODB_URI;

// mongoose.connect(MONGODB_URI, {
//   serverSelectionTimeoutMS: 5000
// })
// .then(() => {
//   console.log('Connected to MongoDB Atlas successfully');
//   console.log('Database: my_pocket');
// })
// .catch(error => {
//   console.error('MongoDB Atlas connection error:', error);
//   process.exit(1); // Exit if DB connection fails
// });

// // Rest of your code remains the same...
// // Updated File schema to match Firebase hierarchy
// const fileSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     index: true
//   },
//   noteId: {
//     type: String,
//     required: true,
//     index: true
//   },
//   noteType: {
//     type: String,
//     required: true,
//     enum: ['text', 'image', 'video', 'doc', 'contact']
//   },
//   files: [{
//     originalName: String,
//     fileName: String,
//     filePath: String,
//     fileType: String,
//     fileSize: Number,
//     uploadedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Create compound index for better performance
// fileSchema.index({ userId: 1, noteId: 1 }, { unique: true });
// fileSchema.index({ userId: 1, noteType: 1 });

// // Collection will be created as 'fileuploads' (mongoose will pluralize 'fileupload')
// const FileUpload = mongoose.model('FileUpload', fileSchema);

// // Multer configuration for file upload
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = 'uploads/';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename with timestamp and random number
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const extension = path.extname(file.originalname);
//     cb(null, `${req.body.userId}_${req.body.noteType}_${uniqueSuffix}${extension}`);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit per file
//   },
//   fileFilter: function (req, file, cb) {
//     console.log(`Uploading file: ${file.originalname}, Type: ${file.mimetype}`);
//     cb(null, true);
//   }
// });

// // API Routes

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString(),
//     database: 'my_pocket (MongoDB Atlas)',
//     collections: 'fileuploads'
//   });
// });

// // Upload files for a note
// app.post('/api/upload-files', upload.array('files', 10), async (req, res) => {
//   console.log('=== File Upload Request ===');
//   console.log('Body:', req.body);
//   console.log('Files:', req.files?.map(f => ({ name: f.originalname, size: f.size })));

//   try {
//     const { userId, noteId, noteType } = req.body;
    
//     if (!userId || !noteId || !noteType) {
//       return res.status(400).json({
//         success: false,
//         message: 'userId, noteId, and noteType are required'
//       });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No files uploaded'
//       });
//     }

//     // Process uploaded files
//     const fileData = req.files.map(file => ({
//       originalName: file.originalname,
//       fileName: file.filename,
//       filePath: file.path,
//       fileType: file.mimetype,
//       fileSize: file.size,
//       uploadedAt: new Date()
//     }));

//     console.log('Processed file data:', fileData);

//     // Check if document already exists for this note
//     let fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (fileUpload) {
//       // Add new files to existing document
//       fileUpload.files.push(...fileData);
//       fileUpload.updatedAt = new Date();
//       console.log('Adding files to existing document');
//     } else {
//       // Create new document
//       fileUpload = new FileUpload({
//         userId,
//         noteId,
//         noteType,
//         files: fileData
//       });
//       console.log('Creating new document');
//     }

//     await fileUpload.save();
//     console.log('Saved to MongoDB successfully');

//     // Return file URLs for frontend
//     const fileUrls = fileData.map(file => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get('host')}/uploads/${file.fileName}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt
//     }));

//     res.json({
//       success: true,
//       message: 'Files uploaded successfully',
//       files: fileUrls,
//       documentId: fileUpload._id,
//       collection: 'fileuploads',
//       database: 'my_pocket'
//     });

//   } catch (error) {
//     console.error('File upload error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'File upload failed',
//       error: error.message
//     });
//   }
// });

// // Get files for a specific note
// app.get('/api/files/:userId/:noteId', async (req, res) => {
//   console.log('=== Get Files Request ===');
//   console.log('Params:', req.params);

//   try {
//     const { userId, noteId } = req.params;
    
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
//     console.log('Found document:', fileUpload ? 'Yes' : 'No');
    
//     if (!fileUpload) {
//       return res.json({
//         success: true,
//         files: [],
//         message: 'No files found for this note'
//       });
//     }

//     // Convert file paths to URLs
//     const filesWithUrls = fileUpload.files.map(file => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get('host')}/uploads/${file.fileName}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt
//     }));

//     console.log(`Returning ${filesWithUrls.length} files`);

//     res.json({
//       success: true,
//       files: filesWithUrls,
//       noteType: fileUpload.noteType,
//       createdAt: fileUpload.createdAt,
//       updatedAt: fileUpload.updatedAt
//     });

//   } catch (error) {
//     console.error('Error fetching files:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch files',
//       error: error.message
//     });
//   }
// });

// // Get all files for a user
// app.get('/api/user-files/:userId', async (req, res) => {
//   console.log('=== Get User Files Request ===');
//   console.log('Params:', req.params);
//   console.log('Query:', req.query);

//   try {
//     const { userId } = req.params;
//     const { noteType } = req.query; // Optional filter by note type
    
//     let query = { userId };
//     if (noteType) {
//       query.noteType = noteType;
//     }
    
//     const fileUploads = await FileUpload.find(query).sort({ createdAt: -1 });
//     console.log(`Found ${fileUploads.length} documents`);
    
//     const allFiles = fileUploads.map(upload => ({
//       noteId: upload.noteId,
//       noteType: upload.noteType,
//       files: upload.files.map(file => ({
//         originalName: file.originalName,
//         url: `${req.protocol}://${req.get('host')}/uploads/${file.fileName}`,
//         fileType: file.fileType,
//         fileSize: file.fileSize,
//         uploadedAt: file.uploadedAt
//       })),
//       createdAt: upload.createdAt,
//       updatedAt: upload.updatedAt
//     }));

//     res.json({
//       success: true,
//       data: allFiles,
//       totalDocuments: fileUploads.length
//     });

//   } catch (error) {
//     console.error('Error fetching user files:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch user files',
//       error: error.message
//     });
//   }
// });

// // Delete files for a note
// app.delete('/api/files/:userId/:noteId', async (req, res) => {
//   console.log('=== Delete Files Request ===');
//   console.log('Params:', req.params);

//   try {
//     const { userId, noteId } = req.params;
    
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (!fileUpload) {
//       return res.status(404).json({
//         success: false,
//         message: 'No files found for this note'
//       });
//     }

//     // Delete physical files
//     fileUpload.files.forEach(file => {
//       if (fs.existsSync(file.filePath)) {
//         fs.unlinkSync(file.filePath);
//         console.log(`Deleted file: ${file.filePath}`);
//       }
//     });

//     // Delete document from MongoDB
//     await FileUpload.deleteOne({ userId, noteId });
//     console.log('Deleted document from MongoDB');

//     res.json({
//       success: true,
//       message: 'Files deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error deleting files:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete files',
//       error: error.message
//     });
//   }
// });

// // Delete specific file from a note
// app.delete('/api/files/:userId/:noteId/:fileName', async (req, res) => {
//   console.log('=== Delete Specific File Request ===');
//   console.log('Params:', req.params);

//   try {
//     const { userId, noteId, fileName } = req.params;
    
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (!fileUpload) {
//       return res.status(404).json({
//         success: false,
//         message: 'No files found for this note'
//       });
//     }

//     // Find and remove the specific file
//     const fileIndex = fileUpload.files.findIndex(file => file.fileName === fileName);
    
//     if (fileIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: 'File not found'
//       });
//     }

//     const fileToDelete = fileUpload.files[fileIndex];
    
//     // Delete physical file
//     if (fs.existsSync(fileToDelete.filePath)) {
//       fs.unlinkSync(fileToDelete.filePath);
//       console.log(`Deleted file: ${fileToDelete.filePath}`);
//     }

//     // Remove from array
//     fileUpload.files.splice(fileIndex, 1);
//     fileUpload.updatedAt = new Date();

//     // If no files left, delete the entire document
//     if (fileUpload.files.length === 0) {
//       await FileUpload.deleteOne({ userId, noteId });
//       console.log('Deleted entire document (no files left)');
//     } else {
//       await fileUpload.save();
//       console.log('Updated document (removed one file)');
//     }

//     res.json({
//       success: true,
//       message: 'File deleted successfully'
//     });

//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete file',
//       error: error.message
//     });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
// });

// module.exports = app;
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const multer = require("multer");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const { GridFSBucket } = require("mongodb");
// const { Readable } = require("stream");
// const { ObjectId } = require('mongodb');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Atlas connection with SSL fix
// const MONGODB_URI = process.env.MONGODB_URI;

// let gfsBucket;

// // MongoDB connection with better error handling
// mongoose
//   .connect(MONGODB_URI, {
//     serverSelectionTimeoutMS: 10000, // Increased timeout
//     socketTimeoutMS: 45000,
//     family: 4, // Use IPv4, skip trying IPv6
//   })
//   .then(() => {
//     console.log("Connected to MongoDB Atlas successfully");
//     console.log("Database:", mongoose.connection.db.databaseName);

//     // Initialize GridFS only after connection is established
//     gfsBucket = new GridFSBucket(mongoose.connection.db, {
//       bucketName: "uploads",
//     });
//     console.log("GridFS bucket initialized successfully");
    
//     // Test GridFS by checking if collections exist
//     mongoose.connection.db.listCollections().toArray((err, collections) => {
//       if (err) {
//         console.error("Error listing collections:", err);
//         return;
//       }
//       console.log("Available collections:", collections.map(c => c.name));
//     });
//   })
//   .catch((error) => {
//     console.error("MongoDB Atlas connection error:", error);
//     process.exit(1);
//   });
// // Connection event handlers for better debugging
// mongoose.connection.on('connected', () => {
//   console.log('Mongoose connected to MongoDB');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('Mongoose connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('Mongoose disconnected');
// });

// // Updated File schema for GridFS
// const fileSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     index: true,
//   },
//   noteId: {
//     type: String,
//     required: true,
//     index: true,
//   },
//   noteType: {
//     type: String,
//     required: true,
//     enum: ["text", "image", "video", "doc", "contact"],
//   },
//   files: [
//     {
//       originalName: String,
//       fileName: String,
//       gridfsFileId: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true,
//       },
//       fileType: String,
//       fileSize: Number,
//       uploadedAt: {
//         type: Date,
//         default: Date.now,
//       },
//     },
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// fileSchema.index({ userId: 1, noteId: 1 }, { unique: true });
// fileSchema.index({ userId: 1, noteType: 1 });

// const FileUpload = mongoose.model("FileUpload", fileSchema);

// const storage = multer.memoryStorage(); // Store files in memory for GridFS

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit per file
//   },
//   fileFilter: (req, file, cb) => {
//     console.log(`Uploading file: ${file.originalname}, Type: ${file.mimetype}`);
//     cb(null, true);
//   },
// });

// // Fixed uploadToGridFS function
// const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
//   return new Promise((resolve, reject) => {
//     // Check if gfsBucket is initialized
//     if (!gfsBucket) {
//       console.error("GridFS bucket is not initialized");
//       return reject(new Error("GridFS bucket not initialized"));
//     }

//     const readableStream = new Readable();
//     readableStream.push(buffer);
//     readableStream.push(null);

//     console.log(`Starting GridFS upload for: ${filename}`);
    
//    const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
//   metadata: {
//     userId: req.body.userId,
//     noteId: req.body.noteId,
//     noteType: req.body.noteType,
//     originalName: req.file.originalname
//   }
// });
// uploadStream.end(req.file.buffer);

//     uploadStream.on("error", (error) => {
//       console.error("GridFS upload error:", error);
//       reject(error);
//     });

//     uploadStream.on("finish", (file) => {
//       console.log("GridFS upload finished, file object:", file);
//       if (!file || !file._id) {
//         console.error("GridFS upload returned invalid file object:", file);
//         reject(new Error("GridFS upload returned invalid file object"));
//       } else {
//         console.log(`GridFS upload successful, file ID: ${file._id}`);
//         resolve(file);
//       }
//     });

//     uploadStream.on("close", () => {
//       console.log("GridFS upload stream closed");
//     });

//     readableStream.pipe(uploadStream);
//   });
// };


// const deleteFromGridFS = (fileId) => {
//   return new Promise((resolve, reject) => {
//     // Check if gfsBucket is initialized
//     if (!gfsBucket) {
//       return reject(new Error("GridFS bucket not initialized"));
//     }
    
//     gfsBucket.delete(fileId, (error) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve();
//       }
//     });
//   });
// };

// // API Routes

// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({
//     success: true,
//     message: "Server is running",
//     timestamp: new Date().toISOString(),
//     database: "my_pocket (MongoDB Atlas)",
//     collections: "fileuploads",
//     storage: "GridFS (uploads bucket)",
//     gridfsInitialized: !!gfsBucket,
//   });
// });

// // Fixed upload route
// app.post("/api/upload-files", upload.array("files", 10), async (req, res) => {
//   console.log("=== File Upload Request (GridFS) ===");
//   console.log("Body:", req.body);
//   console.log(
//     "Files:",
//     req.files?.map((f) => ({ name: f.originalname, size: f.size })),
//   );

//   try {
//     const { userId, noteId, noteType } = req.body;

//     if (!userId || !noteId || !noteType) {
//       return res.status(400).json({
//         success: false,
//         message: "userId, noteId, and noteType are required",
//       });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No files uploaded",
//       });
//     }

//     // Check if GridFS is initialized
//     if (!gfsBucket) {
//       console.error("GridFS bucket not initialized");
//       return res.status(500).json({
//         success: false,
//         message: "GridFS not initialized. Check MongoDB connection.",
//       });
//     }

//     // Upload files to GridFS
//     const fileData = [];

//     for (const file of req.files) {
//       try {
//         const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//         const extension = path.extname(file.originalname);
//         const gridfsFileName = `${userId}_${noteType}_${uniqueSuffix}${extension}`;

//         console.log(`Uploading ${file.originalname} to GridFS as ${gridfsFileName}`);

//         // Upload to GridFS
//         const gridfsFile = await uploadToGridFS(
//           file.buffer, 
//           gridfsFileName, 
//           file.mimetype, 
//           {
//             userId: userId,
//             noteId: noteId,
//             noteType: noteType,
//             originalName: file.originalname,
//           }
//         );

//         console.log(`File uploaded to GridFS: ${file.originalname} -> ${gridfsFile._id}`);

//         fileData.push({
//           originalName: file.originalname,
//           fileName: gridfsFileName,
//           gridfsFileId: gridfsFile._id,
//           fileType: file.mimetype,
//           fileSize: file.size,
//           uploadedAt: new Date(),
//         });
//       } catch (uploadError) {
//         console.error(`Failed to upload ${file.originalname} to GridFS:`, uploadError);
//         return res.status(500).json({
//           success: false,
//           message: `Failed to upload ${file.originalname}`,
//           error: uploadError.message,
//         });
//       }
//     }

//     console.log("All files uploaded to GridFS successfully");

//     // Check if document already exists for this note
//     let fileUpload = await FileUpload.findOne({ userId, noteId });

//     if (fileUpload) {
//       fileUpload.files.push(...fileData);
//       fileUpload.updatedAt = new Date();
//       console.log("Adding files to existing document");
//     } else {
//       fileUpload = new FileUpload({
//         userId,
//         noteId,
//         noteType,
//         files: fileData,
//       });
//       console.log("Creating new document");
//     }

//     await fileUpload.save();
//     console.log("Metadata saved to MongoDB successfully");

//     // Return file URLs for frontend
//     const fileUrls = fileData.map((file) => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get("host")}/api/file/${file.gridfsFileId}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt,
//       gridfsFileId: file.gridfsFileId,
//     }));

//     res.json({
//       success: true,
//       message: "Files uploaded to GridFS successfully",
//       files: fileUrls,
//       documentId: fileUpload._id,
//       collection: "fileuploads",
//       database: "my_pocket",
//       storage: "GridFS",
//     });
//   } catch (error) {
//     console.error("GridFS upload error:", error);
//     res.status(500).json({
//       success: false,
//       message: "GridFS upload failed",
//       error: error.message,
//     });
//   }
// });

// app.get("/api/file/:fileId", async (req, res) => {
//   try {
//     const fileId = new mongoose.Types.ObjectId(req.params.fileId);

//     if (!gfsBucket) {
//       return res.status(500).json({
//         success: false,
//         message: "GridFS not initialized",
//       });
//     }

//     // Get file info
//     const files = await gfsBucket.find({ _id: fileId }).toArray();

//     if (!files || files.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "File not found",
//       });
//     }

//     const file = files[0];

//     // Set appropriate headers
//     res.set("Content-Type", file.contentType || "application/octet-stream");
//     res.set("Content-Length", file.length);
//     res.set("Content-Disposition", `inline; filename="${file.filename}"`);

//     // Stream the file
//     const downloadStream = gfsBucket.openDownloadStream(fileId);

//     downloadStream.on("error", (error) => {
//       console.error("GridFS download error:", error);
//       if (!res.headersSent) {
//         res.status(500).json({
//           success: false,
//           message: "Error streaming file",
//           error: error.message,
//         });
//       }
//     });

//     downloadStream.pipe(res);
//   } catch (error) {
//     console.error("File serve error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to serve file",
//       error: error.message,
//     });
//   }
// });

// app.get("/api/files/:userId/:noteId", async (req, res) => {
//   console.log("=== Get Files Request (GridFS) ===");
//   console.log("Params:", req.params);

//   try {
//     const { userId, noteId } = req.params;

//     const fileUpload = await FileUpload.findOne({ userId, noteId });
//     console.log("Found document:", fileUpload ? "Yes" : "No");

//     if (!fileUpload) {
//       return res.json({
//         success: true,
//         files: [],
//         message: "No files found for this note",
//       });
//     }

//     // Convert GridFS file IDs to URLs
//     const filesWithUrls = fileUpload.files.map((file) => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get("host")}/api/file/${file.gridfsFileId}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt,
//       gridfsFileId: file.gridfsFileId,
//     }));

//     console.log(`Returning ${filesWithUrls.length} files from GridFS`);

//     res.json({
//       success: true,
//       files: filesWithUrls,
//       noteType: fileUpload.noteType,
//       createdAt: fileUpload.createdAt,
//       updatedAt: fileUpload.updatedAt,
//       storage: "GridFS",
//     });
//   } catch (error) {
//     console.error("Error fetching files:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch files",
//       error: error.message,
//     });
//   }
// });

// app.get("/api/user-files/:userId", async (req, res) => {
//   console.log("=== Get User Files Request (GridFS) ===");
//   console.log("Params:", req.params);
//   console.log("Query:", req.query);

//   try {
//     const { userId } = req.params;
//     const { noteType } = req.query;

//     const query = { userId };
//     if (noteType) {
//       query.noteType = noteType;
//     }

//     const fileUploads = await FileUpload.find(query).sort({ createdAt: -1 });
//     console.log(`Found ${fileUploads.length} documents`);

//     const allFiles = fileUploads.map((upload) => ({
//       noteId: upload.noteId,
//       noteType: upload.noteType,
//       files: upload.files.map((file) => ({
//         originalName: file.originalName,
//         url: `${req.protocol}://${req.get("host")}/api/file/${file.gridfsFileId}`,
//         fileType: file.fileType,
//         fileSize: file.fileSize,
//         uploadedAt: file.uploadedAt,
//         gridfsFileId: file.gridfsFileId,
//       })),
//       createdAt: upload.createdAt,
//       updatedAt: upload.updatedAt,
//     }));

//     res.json({
//       success: true,
//       data: allFiles,
//       totalDocuments: fileUploads.length,
//       storage: "GridFS",
//     });
//   } catch (error) {
//     console.error("Error fetching user files:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch user files",
//       error: error.message,
//     });
//   }
// });

// app.delete("/api/files/:userId/:noteId", async (req, res) => {
//   console.log("=== Delete Files Request (GridFS) ===");
//   console.log("Params:", req.params);

//   try {
//     const { userId, noteId } = req.params;

//     const fileUpload = await FileUpload.findOne({ userId, noteId });

//     if (!fileUpload) {
//       return res.status(404).json({
//         success: false,
//         message: "No files found for this note",
//       });
//     }


    
// // Download file by filename
// // Download file by filename
// app.get('/api/files/download/:filename', async (req, res) => {
//   try {
//     const filename = req.params.filename;
    
//     // Find the file metadata
//     const files = await mongoose.connection.db
//       .collection('uploads.files')
//       .find({ filename })
//       .toArray();
    
//     if (!files || files.length === 0) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     const file = files[0];
    
//     // Set appropriate headers
//     res.set('Content-Type', file.contentType || 'application/octet-stream');
//     res.set('Content-Disposition', `attachment; filename="${file.metadata?.originalName || filename}"`);
//     res.set('Content-Length', file.length);

//     // ✅ Use gfsBucket (not gridFSBucket)
//     const downloadStream = gfsBucket.openDownloadStreamByName(filename);

//     downloadStream.pipe(res);

//     downloadStream.on('error', (error) => {
//       console.error('Download error:', error);
//       res.status(500).json({ error: 'File download failed' });
//     });

//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).json({ error: 'File download failed', details: error.message });
//   }
// });


// // Download file by file ID
// app.get('/api/files/download/id/:fileId', async (req, res) => {
//   try {
//     const fileId = req.params.fileId;
    
//     // Validate ObjectId
//     if (!ObjectId.isValid(fileId)) {
//       return res.status(400).json({ error: 'Invalid file ID format' });
//     }

//     const objectId = new ObjectId(fileId);
    
//     // Find the file metadata
//     const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: objectId });
    
//     if (!file) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     // Set appropriate headers
//     res.set('Content-Type', file.contentType || 'application/octet-stream');
//     res.set('Content-Disposition', `attachment; filename="${file.metadata?.originalName || file.filename}"`);
//     res.set('Content-Length', file.length);

//     // Create download stream
//     const downloadStream = gridFSBucket.openDownloadStream(objectId);

//     downloadStream.pipe(res);

//     downloadStream.on('error', (error) => {
//       console.error('Download error:', error);
//       if (!res.headersSent) {
//         res.status(500).json({ error: 'File download failed' });
//       }
//     });

//   } catch (error) {
//     console.error('Download error:', error);
//     res.status(500).json({ error: 'File download failed', details: error.message });
//   }
// });

// // Get file metadata by filename
// app.get('/api/files/metadata/:filename', async (req, res) => {
//   try {
//     const filename = req.params.filename;
    
//     const files = await mongoose.connection.db.collection('uploads.files').find({ filename }).toArray();
    
//     if (!files || files.length === 0) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     res.json(files[0]);

//   } catch (error) {
//     console.error('Metadata error:', error);
//     res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
//   }
// });

// // Get file metadata by ID
// app.get('/api/files/metadata/id/:fileId', async (req, res) => {
//   try {
//     const fileId = req.params.fileId;
    
//     if (!ObjectId.isValid(fileId)) {
//       return res.status(400).json({ error: 'Invalid file ID format' });
//     }

//     const objectId = new ObjectId(fileId);
//     const file = await mongoose.connection.db.collection('uploads.files').findOne({ _id: objectId });
    
//     if (!file) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     res.json(file);

//   } catch (error) {
//     console.error('Metadata error:', error);
//     res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
//   }
// });

// // List all files with metadata
// app.get('/api/files/list', async (req, res) => {
//   try {
//     const files = await mongoose.connection.db.collection('uploads.files')
//       .find({})
//       .sort({ uploadDate: -1 })
//       .toArray();
    
//     res.json(files);

//   } catch (error) {
//     console.error('List files error:', error);
//     res.status(500).json({ error: 'Failed to list files', details: error.message });
//   }
// });

// // List files by user ID
// app.get('/api/files/user/:userId', async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     const files = await mongoose.connection.db.collection('uploads.files')
//       .find({ 'metadata.userId': userId })
//       .sort({ uploadDate: -1 })
//       .toArray();
    
//     res.json(files);

//   } catch (error) {
//     console.error('User files error:', error);
//     res.status(500).json({ error: 'Failed to fetch user files', details: error.message });
//   }
// });
// // View file inline in browser (for images, PDFs, etc.)
// app.get('/api/files/view/:filename', async (req, res) => {
//   try {
//     const filename = req.params.filename;
    
//     const files = await mongoose.connection.db.collection('uploads.files').find({ filename }).toArray();
    
//     if (!files || files.length === 0) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     const file = files[0];
    
//     // Set appropriate headers for inline viewing
//     res.set('Content-Type', file.contentType || 'application/octet-stream');
//     res.set('Content-Length', file.length);
//     res.set('Content-Disposition', `inline; filename="${file.metadata?.originalName || filename}"`);

//     // Create download stream
//     const downloadStream = gridFSBucket.openDownloadStreamByName(filename);
//     downloadStream.pipe(res);

//   } catch (error) {
//     console.error('View file error:', error);
//     res.status(500).json({ error: 'Failed to view file', details: error.message });
//   }
// });
//     // Check if GridFS is initialized
//     if (!gfsBucket) {
//       console.error("GridFS bucket not initialized");
//       return res.status(500).json({
//         success: false,
//         message: "GridFS not initialized. Cannot delete files.",
//       });
//     }

//     // Delete files from GridFS
//     for (const file of fileUpload.files) {
//       try {
//         await deleteFromGridFS(file.gridfsFileId);
//         console.log(`Deleted file from GridFS: ${file.gridfsFileId}`);
//       } catch (deleteError) {
//         console.error(`Failed to delete file ${file.gridfsFileId} from GridFS:`, deleteError);
//         // Continue with other files even if one fails
//       }
//     }

//     // Delete document from MongoDB
//     await FileUpload.deleteOne({ userId, noteId });
//     console.log("Deleted document from MongoDB");

//     res.json({
//       success: true,
//       message: "Files deleted from GridFS successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting files:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete files",
//       error: error.message,
//     });
//   }
// });

// app.delete("/api/files/:userId/:noteId/:fileName", async (req, res) => {
//   console.log("=== Delete Specific File Request (GridFS) ===");
//   console.log("Params:", req.params);

//   try {
//     const { userId, noteId, fileName } = req.params;

//     const fileUpload = await FileUpload.findOne({ userId, noteId });

//     if (!fileUpload) {
//       return res.status(404).json({
//         success: false,
//         message: "No files found for this note",
//       });
//     }

//     // Find the specific file
//     const fileIndex = fileUpload.files.findIndex((file) => file.fileName === fileName);

//     if (fileIndex === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "File not found",
//       });
//     }

//     const fileToDelete = fileUpload.files[fileIndex];

//     // Check if GridFS is initialized
//     if (!gfsBucket) {
//       console.error("GridFS bucket not initialized");
//       return res.status(500).json({
//         success: false,
//         message: "GridFS not initialized. Cannot delete file.",
//       });
//     }

//     // Delete from GridFS
//     try {
//       await deleteFromGridFS(fileToDelete.gridfsFileId);
//       console.log(`Deleted file from GridFS: ${fileToDelete.gridfsFileId}`);
//     } catch (deleteError) {
//       console.error(`Failed to delete file from GridFS:`, deleteError);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to delete file from GridFS",
//         error: deleteError.message,
//       });
//     }

//     // Remove from array
//     fileUpload.files.splice(fileIndex, 1);
//     fileUpload.updatedAt = new Date();

//     // If no files left, delete the entire document
//     if (fileUpload.files.length === 0) {
//       await FileUpload.deleteOne({ userId, noteId });
//       console.log("Deleted entire document (no files left)");
//     } else {
//       await fileUpload.save();
//       console.log("Updated document (removed one file)");
//     }

//     res.json({
//       success: true,
//       message: "File deleted from GridFS successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting file:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete file",
//       error: error.message,
//     });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
//   console.log("Using GridFS for file storage");
// });

// module.exports = app;


// const app = require('./app');

// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
// });
// on vercel deployment 
// const app = require('./app');

// const PORT = process.env.PORT || 3000;

// // 👇 Add '0.0.0.0' to make it reachable from other devices (emulator / phone)
// app.listen(PORT, '0.0.0.0', () => {
//   console.log(`✅ Server running on port ${PORT}`);
//   console.log(`🌐 Health check: http://<YOUR-IP>:${PORT}/api/health`);
// });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.db?.databaseName || 'unknown',
  });
});

app.use('/api', fileRoutes);

module.exports = app;
