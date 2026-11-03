const mongoose = require("../configuration/dbConfig");

const userSchema = new mongoose.Schema({
    alias: String,
    name:String,
    email:String,
    password: String,
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff'
    }
});

module.exports = mongoose.model('user', userSchema);