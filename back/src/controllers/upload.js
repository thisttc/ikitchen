const fs = require('fs');
const path = require('path');

const uploadImage = async (req, res) => {
    try {
        if(!req.file) {
            return res.status(400).json({
                success: false,
                message: 'ไม่มีรูปภาพ'
            });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            url: imageUrl,
            message: 'อัปโหลดรูปภาพสำเร็จ'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปโหลด',
            error: error.message
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads', filename);
        if(fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({
                success: true,
                message: 'ลบรูปภาพสำเร็จ'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'ไม่พบรูปภาพที่ต้องการลบ'
            });
        }
    } catch (error) {
        console.error('Delete error: ', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบรูป',
            error: error.message
        });
    }
};

module.exports = {
    uploadImage,
    deleteImage
}