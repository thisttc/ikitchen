const mongoose = require('mongoose');

const StatisticsSchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    visits: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    totalVisits: { type: Number, default: 0 },
}, {
    collection: 'statistics'
});

module.exports = mongoose.model('Statistics', StatisticsSchema);