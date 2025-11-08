// const mongoose = require("mongoose");
// const path = require("path");
// const { Readable } = require("stream");
// const FileUpload = require("../models/fileUpload");
// const { getGridFSBucket } = require("../utils/gridfs");
// const { ObjectId } = require("mongodb");

// // Helper for upload to GridFS
// const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
//   return new Promise((resolve, reject) => {
//     const gfsBucket = getGridFSBucket();
//     const readableStream = new Readable();
//     readableStream.push(buffer);
//     readableStream.push(null);

//     const uploadStream = gfsBucket.openUploadStream(filename, { metadata, contentType });
//     readableStream.pipe(uploadStream);

//     uploadStream.on("error", reject);
//     uploadStream.on("finish", (file) => {
//       if (!file || !file._id) reject(new Error("GridFS upload failed"));
//       else resolve(file);
//     });
//   });
// };

// const deleteFromGridFS = (fileId) => {
//   return new Promise((resolve, reject) => {
//     const gfsBucket = getGridFSBucket();
//     gfsBucket.delete(fileId, (error) => (error ? reject(error) : resolve()));
//   });
// };

// exports.uploadFiles = async (req, res) => {
//   try {
//     const { userId, noteId, noteType } = req.body;
//     if (!userId || !noteId || !noteType)
//       return res.status(400).json({ success: false, message: "userId, noteId, and noteType are required" });
//     if (!req.files || req.files.length === 0)
//       return res.status(400).json({ success: false, message: "No files uploaded" });

//     const fileData = [];
//     for (const file of req.files) {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       const extension = path.extname(file.originalname);
//       const gridfsFileName = `${userId}_${noteType}_${uniqueSuffix}${extension}`;
//       const gridfsFile = await uploadToGridFS(
//         file.buffer,
//         gridfsFileName,
//         file.mimetype,
//         { userId, noteId, noteType, originalName: file.originalname }
//       );
//       fileData.push({
//         originalName: file.originalname,
//         fileName: gridfsFileName,
//         gridfsFileId: gridfsFile._id,
//         fileType: file.mimetype,
//         fileSize: file.size,
//         uploadedAt: new Date(),
//       });
//     }

//     let fileUpload = await FileUpload.findOne({ userId, noteId });
//     if (fileUpload) {
//       fileUpload.files.push(...fileData);
//       fileUpload.updatedAt = new Date();
//     } else {
//       fileUpload = new FileUpload({ userId, noteId, noteType, files: fileData });
//     }
//     await fileUpload.save();

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
//       storage: "GridFS",
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "GridFS upload failed", error: error.message });
//   }
// };

// // Serve file by fileId
// // exports.serveFileById = async (req, res) => {
// //   try {
// //     const fileId = new mongoose.Types.ObjectId(req.params.fileId);
// //     const gfsBucket = getGridFSBucket();
// //     const files = await gfsBucket.find({ _id: fileId }).toArray();
// //     if (!files || files.length === 0)
// //       return res.status(404).json({ success: false, message: "File not found" });
// //     const file = files[0];
// //     res.set("Content-Type", file.contentType || "application/octet-stream");
// //     res.set("Content-Length", file.length);
// //     res.set("Content-Disposition", `inline; filename="${file.filename}"`);
// //     const downloadStream = gfsBucket.openDownloadStream(fileId);
// //     downloadStream.on("error", (error) => {
// //       if (!res.headersSent)
// //         res.status(500).json({ success: false, message: "Error streaming file", error: error.message });
// //     });
// //     downloadStream.pipe(res);
// //   } catch (error) {
// //     res.status(500).json({ success: false, message: "Failed to serve file", error: error.message });
// //   }
// // };

// // Serve file by GridFS fileId
// exports.serveFileById = async (req, res) => {
//   try {
//     const { fileId } = req.params;
//     const gfsBucket = getGridFSBucket();
    
//     // Convert string ID to ObjectId
//     const objectId = new mongoose.Types.ObjectId(fileId);
//     const fileArr = await gfsBucket.find({ _id: objectId }).toArray();
    
//     if (!fileArr || fileArr.length === 0) {
//       return res.status(404).json({ success: false, message: "File not found" });
//     }
    
//     const file = fileArr[0];
//     res.set("Content-Type", file.contentType || "application/octet-stream");
//     res.set("Content-Disposition", `inline; filename="${file.filename}"`);
    
//     const downloadStream = gfsBucket.openDownloadStream(objectId);
//     downloadStream.on("error", (error) => {
//       if (!res.headersSent) {
//         res.status(500).json({ success: false, message: "Error streaming file", error: error.message });
//       }
//     });
//     downloadStream.pipe(res);
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to serve file", error: error.message });
//   }
// };

// exports.getFilesForNote = async (req, res) => {
//   try {
//     const { userId, noteId } = req.params;
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
//     if (!fileUpload)
//       return res.json({ success: true, files: [], message: "No files found for this note" });
//     const filesWithUrls = fileUpload.files.map((file) => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get("host")}/api/file/${file.gridfsFileId}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt,
//       gridfsFileId: file.gridfsFileId,
//     }));
//     res.json({
//       success: true,
//       files: filesWithUrls,
//       noteType: fileUpload.noteType,
//       createdAt: fileUpload.createdAt,
//       updatedAt: fileUpload.updatedAt,
//       storage: "GridFS",
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to fetch files", error: error.message });
//   }
// };

// exports.getUserFiles = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { noteType } = req.query;
//     const query = { userId };
//     if (noteType) query.noteType = noteType;
//     const fileUploads = await FileUpload.find(query).sort({ createdAt: -1 });
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
//     res.status(500).json({ success: false, message: "Failed to fetch user files", error: error.message });
//   }
// };

// exports.deleteFilesForNote = async (req, res) => {
//   try {
//     const { userId, noteId } = req.params;
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
//     if (!fileUpload)
//       return res.status(404).json({ success: false, message: "No files found for this note" });

//     const gfsBucket = getGridFSBucket();
//     for (const file of fileUpload.files) {
//       try {
//         await deleteFromGridFS(file.gridfsFileId);
//       } catch (e) { /* continue */ }
//     }
//     await FileUpload.deleteOne({ userId, noteId });
//     res.json({ success: true, message: "Files deleted from GridFS successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to delete files", error: error.message });
//   }
// };

// exports.deleteSpecificFile = async (req, res) => {
//   try {
//     const { userId, noteId, fileName } = req.params;
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
//     if (!fileUpload)
//       return res.status(404).json({ success: false, message: "No files found for this note" });

//     const fileIndex = fileUpload.files.findIndex((file) => file.fileName === fileName);
//     if (fileIndex === -1)
//       return res.status(404).json({ success: false, message: "File not found" });
//     const fileToDelete = fileUpload.files[fileIndex];

//     await deleteFromGridFS(fileToDelete.gridfsFileId);

//     fileUpload.files.splice(fileIndex, 1);
//     fileUpload.updatedAt = new Date();
//     if (fileUpload.files.length === 0) await FileUpload.deleteOne({ userId, noteId });
//     else await fileUpload.save();

//     res.json({ success: true, message: "File deleted from GridFS successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Failed to delete file", error: error.message });
//   }
// };


// ye new file controller code aaj = 02/11/2025


// const mongoose = require("mongoose");
// const path = require("path");
// const { Readable } = require("stream");
// const FileUpload = require("../models/fileUpload");
// const { getGridFSBucket } = require("../utils/gridfs");

// // Helper for upload to GridFS
// const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
//   return new Promise((resolve, reject) => {
//     const gfsBucket = getGridFSBucket();
//     const readableStream = new Readable();
//     readableStream.push(buffer);
//     readableStream.push(null);

//     const uploadStream = gfsBucket.openUploadStream(filename, { 
//       metadata, 
//       contentType 
//     });
    
//     readableStream.pipe(uploadStream);

//     uploadStream.on("error", (error) => {
//       console.error("❌ GridFS upload error:", error);
//       reject(error);
//     });
    
//     uploadStream.on("finish", (file) => {
//       if (!file || !file._id) {
//         reject(new Error("GridFS upload failed - no file ID returned"));
//       } else {
//         console.log("✅ GridFS file uploaded:", file._id);
//         resolve(file);
//       }
//     });
//   });
// };

// const deleteFromGridFS = (fileId) => {
//   return new Promise((resolve, reject) => {
//     const gfsBucket = getGridFSBucket();
//     gfsBucket.delete(new mongoose.Types.ObjectId(fileId), (error) => {
//       if (error) reject(error);
//       else resolve();
//     });
//   });
// };

// exports.uploadFiles = async (req, res) => {
//   try {
//     const { userId, noteId, noteType } = req.body;
    
//     console.log("📥 Upload request received:");
//     console.log("   userId:", userId);
//     console.log("   noteId:", noteId);
//     console.log("   noteType:", noteType);
//     console.log("   files count:", req.files?.length || 0);

//     if (!userId || !noteId || !noteType) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "userId, noteId, and noteType are required" 
//       });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "No files uploaded" 
//       });
//     }

//     const fileData = [];
    
//     for (const file of req.files) {
//       console.log(`📎 Processing file: ${file.originalname}`);
      
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       const extension = path.extname(file.originalname);
//       const gridfsFileName = `${userId}_${noteType}_${uniqueSuffix}${extension}`;
      
//       try {
//         const gridfsFile = await uploadToGridFS(
//           file.buffer,
//           gridfsFileName,
//           file.mimetype,
//           { 
//             userId, 
//             noteId, 
//             noteType, 
//             originalName: file.originalname 
//           }
//         );
        
//         fileData.push({
//           originalName: file.originalname,
//           fileName: gridfsFileName,
//           gridfsFileId: gridfsFile._id.toString(), // Convert ObjectId to string
//           fileType: file.mimetype,
//           fileSize: file.size,
//           uploadedAt: new Date(),
//         });
        
//         console.log(`✅ File uploaded: ${file.originalname} -> ${gridfsFile._id}`);
//       } catch (uploadError) {
//         console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
//         throw uploadError;
//       }
//     }

//     // Save or update FileUpload document
//     let fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (fileUpload) {
//       console.log("📝 Updating existing FileUpload document");
//       fileUpload.files.push(...fileData);
//       fileUpload.updatedAt = new Date();
//     } else {
//       console.log("📝 Creating new FileUpload document");
//       fileUpload = new FileUpload({ 
//         userId, 
//         noteId, 
//         noteType, 
//         files: fileData 
//       });
//     }
    
//     await fileUpload.save();
//     console.log("💾 FileUpload document saved:", fileUpload._id);

//     // Prepare response with file URLs
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
//       documentId: fileUpload._id.toString(),
//       collection: "fileuploads",
//       storage: "GridFS",
//       database: mongoose.connection.db.databaseName,
//     });
    
//     console.log("✅ Upload complete - sent response to client");
//   } catch (error) {
//     console.error("❌ Upload failed:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "GridFS upload failed", 
//       error: error.message 
//     });
//   }
// };

// exports.serveFileById = async (req, res) => {
//   try {
//     const { fileId } = req.params;
//     console.log("📥 Serving file:", fileId);
    
//     const gfsBucket = getGridFSBucket();
//     const objectId = new mongoose.Types.ObjectId(fileId);
//     const fileArr = await gfsBucket.find({ _id: objectId }).toArray();
    
//     if (!fileArr || fileArr.length === 0) {
//       console.log("❌ File not found:", fileId);
//       return res.status(404).json({ 
//         success: false, 
//         message: "File not found" 
//       });
//     }
    
//     const file = fileArr[0];
//     console.log("✅ File found:", file.filename);
    
//     res.set("Content-Type", file.contentType || "application/octet-stream");
//     res.set("Content-Disposition", `inline; filename="${file.filename}"`);
//     res.set("Content-Length", file.length);
    
//     const downloadStream = gfsBucket.openDownloadStream(objectId);
    
//     downloadStream.on("error", (error) => {
//       console.error("❌ Stream error:", error);
//       if (!res.headersSent) {
//         res.status(500).json({ 
//           success: false, 
//           message: "Error streaming file", 
//           error: error.message 
//         });
//       }
//     });
    
//     downloadStream.pipe(res);
//   } catch (error) {
//     console.error("❌ Serve file error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to serve file", 
//       error: error.message 
//     });
//   }
// };

// exports.getFilesForNote = async (req, res) => {
//   try {
//     const { userId, noteId } = req.params;
//     console.log("📥 Getting files for note:", noteId);
    
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (!fileUpload) {
//       return res.json({ 
//         success: true, 
//         files: [], 
//         message: "No files found for this note" 
//       });
//     }
    
//     const filesWithUrls = fileUpload.files.map((file) => ({
//       originalName: file.originalName,
//       url: `${req.protocol}://${req.get("host")}/api/file/${file.gridfsFileId}`,
//       fileType: file.fileType,
//       fileSize: file.fileSize,
//       uploadedAt: file.uploadedAt,
//       gridfsFileId: file.gridfsFileId,
//     }));
    
//     res.json({
//       success: true,
//       files: filesWithUrls,
//       noteType: fileUpload.noteType,
//       createdAt: fileUpload.createdAt,
//       updatedAt: fileUpload.updatedAt,
//       storage: "GridFS",
//     });
//   } catch (error) {
//     console.error("❌ Get files error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to fetch files", 
//       error: error.message 
//     });
//   }
// };

// exports.getUserFiles = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { noteType } = req.query;
    
//     const query = { userId };
//     if (noteType) query.noteType = noteType;
    
//     const fileUploads = await FileUpload.find(query).sort({ createdAt: -1 });
    
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
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to fetch user files", 
//       error: error.message 
//     });
//   }
// };

// exports.deleteFilesForNote = async (req, res) => {
//   try {
//     const { userId, noteId } = req.params;
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (!fileUpload) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "No files found for this note" 
//       });
//     }

//     for (const file of fileUpload.files) {
//       try {
//         await deleteFromGridFS(file.gridfsFileId);
//       } catch (e) {
//         console.error("Warning: Failed to delete file from GridFS:", e);
//       }
//     }
    
//     await FileUpload.deleteOne({ userId, noteId });
    
//     res.json({ 
//       success: true, 
//       message: "Files deleted from GridFS successfully" 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to delete files", 
//       error: error.message 
//     });
//   }
// };

// exports.deleteSpecificFile = async (req, res) => {
//   try {
//     const { userId, noteId, fileName } = req.params;
//     const fileUpload = await FileUpload.findOne({ userId, noteId });
    
//     if (!fileUpload) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "No files found for this note" 
//       });
//     }

//     const fileIndex = fileUpload.files.findIndex(
//       (file) => file.fileName === fileName
//     );
    
//     if (fileIndex === -1) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "File not found" 
//       });
//     }
    
//     const fileToDelete = fileUpload.files[fileIndex];
//     await deleteFromGridFS(fileToDelete.gridfsFileId);

//     fileUpload.files.splice(fileIndex, 1);
//     fileUpload.updatedAt = new Date();
    
//     if (fileUpload.files.length === 0) {
//       await FileUpload.deleteOne({ userId, noteId });
//     } else {
//       await fileUpload.save();
//     }

//     res.json({ 
//       success: true, 
//       message: "File deleted from GridFS successfully" 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false, 
//       message: "Failed to delete file", 
//       error: error.message 
//     });
//   }
// };

// after vercel deploy 
const mongoose = require("mongoose");
const path = require("path");
const { Readable } = require("stream");
const FileUpload = require("../models/fileUpload");
const { getGridFSBucket } = require("../utils/gridfs");

// Helper for upload to GridFS with timeout
const uploadToGridFS = (buffer, filename, contentType, metadata = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const gfsBucket = await getGridFSBucket();
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      const uploadStream = gfsBucket.openUploadStream(filename, { 
        metadata, 
        contentType 
      });
      
      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        uploadStream.destroy();
        reject(new Error('Upload timeout'));
      }, 30000);

      uploadStream.on("error", (error) => {
        clearTimeout(timeout);
        console.error("❌ GridFS upload error:", error);
        reject(error);
      });
      
      uploadStream.on("finish", (file) => {
        clearTimeout(timeout);
        if (!file || !file._id) {
          reject(new Error("GridFS upload failed - no file ID returned"));
        } else {
          console.log("✅ GridFS file uploaded:", file._id);
          resolve(file);
        }
      });

      readableStream.pipe(uploadStream);
    } catch (error) {
      reject(error);
    }
  });
};

const deleteFromGridFS = async (fileId) => {
  try {
    const gfsBucket = await getGridFSBucket();
    await gfsBucket.delete(new mongoose.Types.ObjectId(fileId));
    console.log("🗑️ Deleted file from GridFS:", fileId);
  } catch (error) {
    console.error("❌ Delete from GridFS error:", error);
    throw error;
  }
};

exports.uploadFiles = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, noteId, noteType } = req.body;
    
    console.log("📥 Upload request received:");
    console.log("   userId:", userId);
    console.log("   noteId:", noteId);
    console.log("   noteType:", noteType);
    console.log("   files count:", req.files?.length || 0);

    // Validation
    if (!userId || !noteId || !noteType) {
      return res.status(400).json({ 
        success: false, 
        message: "userId, noteId, and noteType are required" 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No files uploaded" 
      });
    }

    // Check file sizes (max 50MB per file for Vercel)
    const maxSize = 50 * 1024 * 1024;
    for (const file of req.files) {
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds 50MB limit`
        });
      }
    }

    const fileData = [];
    
    // Upload files sequentially to avoid overwhelming serverless
    for (const file of req.files) {
      console.log(`📎 Processing file: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);
      
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      const gridfsFileName = `${userId}_${noteType}_${uniqueSuffix}${extension}`;
      
      try {
        const gridfsFile = await uploadToGridFS(
          file.buffer,
          gridfsFileName,
          file.mimetype,
          { 
            userId, 
            noteId, 
            noteType, 
            originalName: file.originalname 
          }
        );
        
        fileData.push({
          originalName: file.originalname,
          fileName: gridfsFileName,
          gridfsFileId: gridfsFile._id.toString(),
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date(),
        });
        
        console.log(`✅ File uploaded: ${file.originalname} -> ${gridfsFile._id}`);
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, uploadError);
        
        // Clean up successfully uploaded files
        for (const uploaded of fileData) {
          try {
            await deleteFromGridFS(uploaded.gridfsFileId);
          } catch (e) {
            console.error("Cleanup error:", e);
          }
        }
        
        throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
      }
    }

    // Save or update FileUpload document
    let fileUpload = await FileUpload.findOne({ userId, noteId });
    
    if (fileUpload) {
      console.log("📝 Updating existing FileUpload document");
      fileUpload.files.push(...fileData);
      fileUpload.updatedAt = new Date();
    } else {
      console.log("📝 Creating new FileUpload document");
      fileUpload = new FileUpload({ 
        userId, 
        noteId, 
        noteType, 
        files: fileData 
      });
    }
    
    await fileUpload.save();
    console.log("💾 FileUpload document saved:", fileUpload._id);

    // Get host for URLs
    const host = req.get('host');
    const protocol = req.protocol;

    // Prepare response with file URLs
    const fileUrls = fileData.map((file) => ({
      originalName: file.originalName,
      url: `${protocol}://${host}/api/file/${file.gridfsFileId}`,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: file.uploadedAt,
      gridfsFileId: file.gridfsFileId,
    }));

    const duration = Date.now() - startTime;
    console.log(`✅ Upload complete in ${duration}ms`);

    res.json({
      success: true,
      message: "Files uploaded to GridFS successfully",
      files: fileUrls,
      documentId: fileUpload._id.toString(),
      collection: "fileuploads",
      storage: "GridFS",
      database: mongoose.connection.db.databaseName,
      uploadDuration: `${duration}ms`
    });
    
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ 
      success: false, 
      message: "GridFS upload failed", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.serveFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log("📥 Serving file:", fileId);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid file ID format" 
      });
    }

    const gfsBucket = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    const fileArr = await gfsBucket.find({ _id: objectId }).toArray();
    
    if (!fileArr || fileArr.length === 0) {
      console.log("❌ File not found:", fileId);
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }
    
    const file = fileArr[0];
    console.log("✅ File found:", file.filename, `(${(file.length / 1024).toFixed(2)} KB)`);
    
    res.set("Content-Type", file.contentType || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);
    res.set("Content-Length", file.length);
    res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    
    const downloadStream = gfsBucket.openDownloadStream(objectId);
    
    downloadStream.on("error", (error) => {
      console.error("❌ Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: "Error streaming file", 
          error: error.message 
        });
      }
    });
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error("❌ Serve file error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to serve file", 
      error: error.message 
    });
  }
};

exports.getFilesForNote = async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    console.log("📥 Getting files for note:", noteId);
    
    const fileUpload = await FileUpload.findOne({ userId, noteId });
    
    if (!fileUpload) {
      return res.json({ 
        success: true, 
        files: [], 
        message: "No files found for this note" 
      });
    }
    
    const host = req.get('host');
    const protocol = req.protocol;
    
    const filesWithUrls = fileUpload.files.map((file) => ({
      originalName: file.originalName,
      url: `${protocol}://${host}/api/file/${file.gridfsFileId}`,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: file.uploadedAt,
      gridfsFileId: file.gridfsFileId,
    }));
    
    res.json({
      success: true,
      files: filesWithUrls,
      noteType: fileUpload.noteType,
      createdAt: fileUpload.createdAt,
      updatedAt: fileUpload.updatedAt,
      storage: "GridFS",
      totalFiles: filesWithUrls.length
    });
  } catch (error) {
    console.error("❌ Get files error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch files", 
      error: error.message 
    });
  }
};

exports.getUserFiles = async (req, res) => {
  try {
    const { userId } = req.params;
    const { noteType } = req.query;
    
    const query = { userId };
    if (noteType) query.noteType = noteType;
    
    const fileUploads = await FileUpload.find(query).sort({ createdAt: -1 });
    
    const host = req.get('host');
    const protocol = req.protocol;
    
    const allFiles = fileUploads.map((upload) => ({
      noteId: upload.noteId,
      noteType: upload.noteType,
      files: upload.files.map((file) => ({
        originalName: file.originalName,
        url: `${protocol}://${host}/api/file/${file.gridfsFileId}`,
        fileType: file.fileType,
        fileSize: file.fileSize,
        uploadedAt: file.uploadedAt,
        gridfsFileId: file.gridfsFileId,
      })),
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    }));
    
    res.json({
      success: true,
      data: allFiles,
      totalDocuments: fileUploads.length,
      storage: "GridFS",
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user files", 
      error: error.message 
    });
  }
};

exports.deleteFilesForNote = async (req, res) => {
  try {
    const { userId, noteId } = req.params;
    const fileUpload = await FileUpload.findOne({ userId, noteId });
    
    if (!fileUpload) {
      return res.status(404).json({ 
        success: false, 
        message: "No files found for this note" 
      });
    }

    // Delete files from GridFS
    for (const file of fileUpload.files) {
      try {
        await deleteFromGridFS(file.gridfsFileId);
      } catch (e) {
        console.error("Warning: Failed to delete file from GridFS:", e);
      }
    }
    
    await FileUpload.deleteOne({ userId, noteId });
    
    res.json({ 
      success: true, 
      message: `Deleted ${fileUpload.files.length} file(s) from GridFS successfully` 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete files", 
      error: error.message 
    });
  }
};

exports.deleteSpecificFile = async (req, res) => {
  try {
    const { userId, noteId, fileName } = req.params;
    const fileUpload = await FileUpload.findOne({ userId, noteId });
    
    if (!fileUpload) {
      return res.status(404).json({ 
        success: false, 
        message: "No files found for this note" 
      });
    }

    const fileIndex = fileUpload.files.findIndex(
      (file) => file.fileName === fileName
    );
    
    if (fileIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found" 
      });
    }
    
    const fileToDelete = fileUpload.files[fileIndex];
    await deleteFromGridFS(fileToDelete.gridfsFileId);

    fileUpload.files.splice(fileIndex, 1);
    fileUpload.updatedAt = new Date();
    
    if (fileUpload.files.length === 0) {
      await FileUpload.deleteOne({ userId, noteId });
    } else {
      await fileUpload.save();
    }

    res.json({ 
      success: true, 
      message: "File deleted from GridFS successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete file", 
      error: error.message 
    });
  }
};