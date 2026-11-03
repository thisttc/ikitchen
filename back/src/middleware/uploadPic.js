const multer = require('multer');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowdTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowdTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowdTypes.test(file.mimetype);
    if(mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('กรุณาอัปโหลดรูปภาพนามสกุล jpeg, jpg, png, gif, webp'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = upload;