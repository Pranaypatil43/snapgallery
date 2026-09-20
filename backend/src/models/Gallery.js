const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const gallerySchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Gallery title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    selectedPhotos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Photo',
      },
    ],
    // Short unique slug used in the shareable URL
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    // Hashed PIN for customer access
    pinHash: {
      type: String,
      required: true,
      select: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    // Optional expiry date (bonus feature)
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash PIN before saving
gallerySchema.pre('save', async function (next) {
  if (!this.isModified('pinHash')) return next();
  // pinHash field receives the plain PIN; we hash it here
  this.pinHash = await bcrypt.hash(this.pinHash, 12);
  next();
});

// Instance method to verify PIN
gallerySchema.methods.verifyPin = async function (candidatePin) {
  return bcrypt.compare(String(candidatePin), this.pinHash);
};

gallerySchema.index({ slug: 1 });
gallerySchema.index({ eventId: 1 });

module.exports = mongoose.model('Gallery', gallerySchema);
