const mongoose = require("../configuration/dbConfig");

const BlogSchema = new mongoose.Schema({
    title: { type: String },
    slug: { type: String, default: ''},
    coverImage: { type: String, default: '' },
    description: { type: String },
    category: [{type: String}],
    tag: { type: String, default: '' },
    pdf: [{ 
        filename: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    galleryImages: [{
        url: { type: String, required: true },
        title: { type: String, default: '' },
        uploadedAt: { type: Date, default: Date.now }
    }],
    eventDate: { type: String, default: null },
    status: {type: String},
    showOnWebsite: { type: Boolean, default: false },
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    views: { type: Number, default: 0 }
}, {
    collection: 'blogtest'
});

module.exports = mongoose.model('Blog', BlogSchema, 'blogtest');