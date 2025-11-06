const express = require('express');
const multer = require('multer');
const fileController = require('../controllers/filecontroller');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/upload-files', upload.array('files', 10), fileController.uploadFiles);
router.get('/file/:fileId', fileController.serveFileById);
router.get('/files/:userId/:noteId', fileController.getFilesForNote);
router.get('/user-files/:userId', fileController.getUserFiles);
router.delete('/files/:userId/:noteId', fileController.deleteFilesForNote);
router.delete('/files/:userId/:noteId/:fileName', fileController.deleteSpecificFile);

module.exports = router;

//Method: POST
//URL: http://localhost:3000/api/upload-files

// Method: GET downlaod file by id
// URL: http://localhost:3000/api/file/<gridfsFileId>

// List files for a note (GET /api/files/:userId/:noteId)
// Method: GET
// URL: http://localhost:3000/api/files/user123/note456

//  List all files for a user (GET /api/user-files/:userId)
// Method: GET
// URL: http://localhost:3000/api/user-files/user123
// Optional Query: ?noteType=image
// 5. Delete all files for a note (DELETE /api/files/:userId/:noteId)
// Method: DELETE
// URL: http://localhost:3000/api/files/user123/note456
// 6. Delete a specific file (DELETE /api/files/:userId/:noteId/:fileName)
// Method: DELETE
// URL: http://localhost:3000/api/files/user123/note456/myphoto.jpg
// 7. Health Check (GET /api/health)
// Method: GET
// URL: http://localhost:3000/api/health