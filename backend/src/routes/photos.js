const express = require('express');
const { param } = require('express-validator');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload, cloudinary } = require('../config/cloudinary');

const router = express.Router();

router.use(authenticate);

// Helper: verify the requesting user has access to the event
const checkEventAccess = async (eventId, user) => {
  const event = await Event.findById(eventId);
  if (!event) return null;

  const isOwner = event.createdBy.toString() === user._id.toString();
  const isMember = event.teamMembers.map(String).includes(user._id.toString());

  if (!isOwner && !isMember) return null;
  return event;
};

// ─── Upload photos to an event (team members only) ──────────────────────────
// POST /api/photos/:eventId
router.post(
  '/:eventId',
  authorize('team_member'),
  [param('eventId').isMongoId().withMessage('Invalid event ID')],
  validate,
  async (req, res, next) => {
    // Verify the team member is assigned to this event
    const event = await checkEventAccess(req.params.eventId, req.user).catch(() => null);
    if (!event) {
      return res.status(403).json({ message: 'Access denied or event not found' });
    }
    next();
  },
  upload.array('photos', 20), // up to 20 files per request
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const photoRecords = req.files.map((file) => {
        // Build a thumbnail URL via Cloudinary's transformation URL
        const thumbnailUrl = cloudinary.url(file.filename, {
          transformation: [{ width: 400, height: 300, crop: 'fill', quality: 'auto' }],
        });

        return {
          eventId: req.params.eventId,
          uploadedBy: req.user._id,
          filename: file.originalname,
          storagePublicId: file.filename, // Cloudinary public_id
          storageUrl: file.path,          // Cloudinary secure URL
          thumbnailUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
        };
      });

      const photos = await Photo.insertMany(photoRecords);
      res.status(201).json({ photos, count: photos.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Get photos for an event ──────────────────────────────────────────────────
// Admin sees all photos; team members see only their own
router.get(
  '/event/:eventId',
  [param('eventId').isMongoId().withMessage('Invalid event ID')],
  validate,
  async (req, res) => {
    try {
      const event = await checkEventAccess(req.params.eventId, req.user);
      if (!event) {
        return res.status(403).json({ message: 'Access denied or event not found' });
      }

      const filter = { eventId: req.params.eventId };
      if (req.user.role === 'team_member') {
        filter.uploadedBy = req.user._id;
      }

      const photos = await Photo.find(filter)
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

      res.json({ photos, count: photos.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Delete a photo (admin or uploader only) ─────────────────────────────────
router.delete(
  '/:photoId',
  [param('photoId').isMongoId().withMessage('Invalid photo ID')],
  validate,
  async (req, res) => {
    try {
      const photo = await Photo.findById(req.params.photoId);
      if (!photo) return res.status(404).json({ message: 'Photo not found' });

      const isOwner = photo.uploadedBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Cannot delete this photo' });
      }

      // Remove from Cloudinary
      await cloudinary.uploader.destroy(photo.storagePublicId);
      await photo.deleteOne();

      res.json({ message: 'Photo deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
