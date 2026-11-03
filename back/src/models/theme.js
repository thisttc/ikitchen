const mongoose = require('mongoose');

const themeSettingSchema = new mongoose.Schema({
  filter: {
    brightness: { type: Number, default: 0.95, min: 0, max: 1 },
    saturate: { type: Number, default: 0.7, min: 0, max: 1 },
    contrast: { type: Number, default: 1, min: 0, max: 1.2 }
  },
  preset: {
    type: String,
    enum: ['normal', 'muted', 'dusty', 'dark', 'custom'],
    default: 'muted'
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'themesettings'
});

module.exports = mongoose.model('ThemeSetting', themeSettingSchema);