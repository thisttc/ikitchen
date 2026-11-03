const multer = require('multer');
const path = require('path');

const pdfUploadDir = path.join(__dirname, '../../pdf');

const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pdfUploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const pdfFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if(extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดไฟล์นามสกุล .pdf เท่านั้น'));
    }
};

const uploadPDF = multer({
    storage: pdfStorage,
    limits: { fileSize: 50*1024*1024 },
    fileFilter: pdfFileFilter
});

module.exports = uploadPDF;