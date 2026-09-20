const express = require('express');
const { body, param } = require('express-validator');
const { customAlphabet } = require('nanoid');
const Event = require('../models/Event');
const Photo = require('../models/Photo');
const Gallery = require('../models/Gallery');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Slug generator: URL-safe 10-char string
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

// ─── Admin-only: Create/update gallery for an event ──────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('eventId').isMongoId().withMessage('Valid event ID required'),
    body('title').trim().notEmpty().withMessage('Gallery title required'),
    body('description').optional().trim(),
    body('selectedPhotos')
      .isArray({ min: 1 })
      .withMessage('Select at least one photo'),
    body('selectedPhotos.*').isMongoId().withMessage('Each photo ID must be valid'),
    body('pin')
      .isLength({ min: 4, max: 10 })
      .withMessage('PIN must be 4–10 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { eventId, title, description, selectedPhotos, pin } = req.body;

      // Admin must own the event
      const event = await Event.findOne({ _id: eventId, createdBy: req.user._id });
      if (!event) {
        return res.status(403).json({ message: 'Event not found or access denied' });
      }

      // All selected photos must belong to this event
      const validPhotos = await Photo.find({ _id: { $in: selectedPhotos }, eventId });
      if (validPhotos.length !== selectedPhotos.length) {
        return res.status(400).json({
          message: 'Some selected photos do not belong to this event',
        });
      }

      // Upsert: one gallery per event
      let gallery = await Gallery.findOne({ eventId });

      if (gallery) {
        gallery.title = title;
        if (description !== undefined) gallery.description = description;
        gallery.selectedPhotos = selectedPhotos;
        gallery.pinHash = pin;
        gallery.isPublished = false;
        await gallery.save();
      } else {
        gallery = await Gallery.create({
          eventId,
          createdBy: req.user._id,
          title,
          description: description || '',
          selectedPhotos,
          slug: nanoid(),
          pinHash: pin,
        });
      }

      // Return without pinHash
      const result = gallery.toObject();
      delete result.pinHash;

      res.status(201).json({ gallery: result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin-only: Publish gallery ─────────────────────────────────────────────
router.patch(
  '/:id/publish',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId()],
  validate,
  async (req, res) => {
    try {
      const gallery = await Gallery.findById(req.params.id);
      if (!gallery) return res.status(404).json({ message: 'Gallery not found' });

      // Verify ownership via event
      const event = await Event.findOne({
        _id: gallery.eventId,
        createdBy: req.user._id,
      });
      if (!event) return res.status(403).json({ message: 'Access denied' });

      gallery.isPublished = true;
      gallery.publishedAt = new Date();
      await gallery.save();

      const shareUrl = `${process.env.FRONTEND_URL}/gallery/${gallery.slug}`;

      const result = gallery.toObject();
      delete result.pinHash;

      res.json({ gallery: result, shareUrl });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin-only: Unpublish gallery ───────────────────────────────────────────
router.patch(
  '/:id/unpublish',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId()],
  validate,
  async (req, res) => {
    try {
      const gallery = await Gallery.findById(req.params.id);
      if (!gallery) return res.status(404).json({ message: 'Gallery not found' });

      const event = await Event.findOne({
        _id: gallery.eventId,
        createdBy: req.user._id,
      });
      if (!event) return res.status(403).json({ message: 'Access denied' });

      gallery.isPublished = false;
      await gallery.save();

      res.json({ message: 'Gallery unpublished' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin-only: List galleries for admin's events ───────────────────────────
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const adminEvents = await Event.find({ createdBy: req.user._id }).select('_id');
    const eventIds = adminEvents.map((e) => e._id);

    const galleries = await Gallery.find({ eventId: { $in: eventIds } })
      .populate('eventId', 'name date')
      .sort({ createdAt: -1 })
      .select('-pinHash');

    const galleriesWithUrl = galleries.map((g) => ({
      ...g.toObject(),
      shareUrl: `${process.env.FRONTEND_URL}/gallery/${g.slug}`,
    }));

    res.json({ galleries: galleriesWithUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin-only: Get gallery detail by event ─────────────────────────────────
router.get(
  '/event/:eventId',
  authenticate,
  authorize('admin'),
  [param('eventId').isMongoId()],
  validate,
  async (req, res) => {
    try {
      const event = await Event.findOne({
        _id: req.params.eventId,
        createdBy: req.user._id,
      });
      if (!event) return res.status(403).json({ message: 'Access denied' });

      const gallery = await Gallery.findOne({ eventId: req.params.eventId })
        .populate('selectedPhotos')
        .select('-pinHash');

      if (!gallery) return res.status(404).json({ message: 'No gallery for this event' });

      res.json({
        gallery: {
          ...gallery.toObject(),
          shareUrl: `${process.env.FRONTEND_URL}/gallery/${gallery.slug}`,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Public: Verify PIN and view gallery (no auth required) ──────────────────
router.post(
  '/public/:slug/verify',
  [
    param('slug').notEmpty().withMessage('Slug required'),
    body('pin').notEmpty().withMessage('PIN required'),
  ],
  validate,
  async (req, res) => {
    try {
      const gallery = await Gallery.findOne({ slug: req.params.slug })
        .select('+pinHash')
        .populate({
          path: 'selectedPhotos',
          select: 'storageUrl thumbnailUrl filename fileSize createdAt',
        })
        .populate('eventId', 'name date description');

      if (!gallery) return res.status(404).json({ message: 'Gallery not found' });

      if (!gallery.isPublished) {
        return res.status(403).json({ message: 'This gallery is not published yet' });
      }

      // Check expiry
      if (gallery.expiresAt && new Date() > gallery.expiresAt) {
        return res.status(410).json({ message: 'This gallery link has expired' });
      }

      const pinValid = await gallery.verifyPin(req.body.pin);
      if (!pinValid) {
        return res.status(401).json({ message: 'Incorrect PIN' });
      }

      const result = gallery.toObject();
      delete result.pinHash;

      res.json({ gallery: result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Public: Check if slug exists and is published (no PIN needed) ────────────
router.get('/public/:slug', async (req, res) => {
  try {
    const gallery = await Gallery.findOne({ slug: req.params.slug })
      .populate('eventId', 'name date')
      .select('-pinHash -selectedPhotos');

    if (!gallery) return res.status(404).json({ message: 'Gallery not found' });
    if (!gallery.isPublished) {
      return res.status(403).json({ message: 'Gallery not published' });
    }

    res.json({
      gallery: {
        title: gallery.title,
        event: gallery.eventId,
        publishedAt: gallery.publishedAt,
        photoCount: gallery.selectedPhotos?.length ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Public: Find gallery by PIN only (customer enters PIN from login page) ──
// POST /api/galleries/public/access
router.post(
  '/public/access',
  [body('pin').notEmpty().withMessage('PIN is required')],
  validate,
  async (req, res) => {
    try {
      // Fetch all published, non-expired galleries (with pinHash)
      const now = new Date();
      const galleries = await Gallery.find({
        isPublished: true,
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
      })
        .select('+pinHash')
        .populate({
          path: 'selectedPhotos',
          select: 'storageUrl thumbnailUrl filename fileSize createdAt',
        })
        .populate('eventId', 'name date description');

      // Check PIN against each gallery
      for (const gallery of galleries) {
        const match = await gallery.verifyPin(req.body.pin);
        if (match) {
          const result = gallery.toObject();
          delete result.pinHash;
          return res.json({ gallery: result });
        }
      }

      return res.status(401).json({ message: 'Incorrect PIN. Please check and try again.' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
