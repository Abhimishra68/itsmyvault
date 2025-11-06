const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  noteId: { type: String, required: true, index: true },
  noteType: {
    type: String,
    required: true,
    enum: ["text", "image", "video", "doc", "contact"],
  },
  files: [
    {
      originalName: String,
      fileName: String,
      gridfsFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
      fileType: String,
      fileSize: Number,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

fileSchema.index({ userId: 1, noteId: 1 }, { unique: true });
fileSchema.index({ userId: 1, noteType: 1 });

module.exports = mongoose.model("FileUpload", fileSchema);

// uploadFiles.js


// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");
// const multer = require("multer");
// const { GridFsStorage } = require("multer-gridfs-storage");
// const FileUpload = require("../models/fileUpload");
// const Note = require("./Note"); // ✅ import your Note model

// // Storage setup for GridFS
// const storage = new GridFsStorage({
//   url: process.env.MONGO_URI,
//   file: (req, file) => ({
//     filename: file.originalname,
//     bucketName: "uploads",
//   }),
// });

// const upload = multer({ storage });

// router.post("/api/upload-files", upload.array("files"), async (req, res) => {
//   try {
//     const { userId, noteId, noteType } = req.body;

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ success: false, message: "No files uploaded" });
//     }

//     // ✅ Build file metadata
//     const uploadedFiles = req.files.map((file) => ({
//       originalName: file.originalname,
//       url: `http://10.0.2.2:3000/api/file/${file.id}`,
//       fileType: file.mimetype,
//       fileSize: file.size,
//       uploadedAt: new Date(),
//       gridfsFileId: file.id,
//     }));

//     // ✅ Save in FileUpload collection
//     await FileUpload.findOneAndUpdate(
//       { userId, noteId },
//       { userId, noteId, noteType, files: uploadedFiles, updatedAt: new Date() },
//       { upsert: true, new: true }
//     );

//     // ✅ Also attach to Notes collection (important for Flutter)
//     await Note.findOneAndUpdate(
//       { noteId, userId },
//       { $push: { files: { $each: uploadedFiles } } }, // append new files
//       { new: true }
//     );

//     res.status(200).json({
//       success: true,
//       message: "Files uploaded to GridFS successfully",
//       files: uploadedFiles,
//       noteId,
//       collection: "fileuploads",
//       storage: "GridFS",
//     });

//   } catch (err) {
//     console.error("❌ Upload Error:", err);
//     res.status(500).json({ success: false, message: "Error uploading files", error: err.message });
//   }
// });

// module.exports = router;


