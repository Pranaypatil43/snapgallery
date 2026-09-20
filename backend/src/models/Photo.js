const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    // Cloudinary public_id — used for deletion and transformations
    storagePublicId: {
      type: String,
      required: true,
    },
    // Full Cloudinary URL for display
    storageUrl: {
      type: String,
      required: true,
    },
    // Cloudinary-generated thumbnail URL (lower resolution)
    thumbnailUrl: {
      type: String,
    },
    fileSize: {
      type: Number, // bytes
    },
    mimeType: {
      type: String,
    },
  },
  { timestamps: true }
);

photoSchema.index({ eventId: 1 });
photoSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Photo', photoSchema);
