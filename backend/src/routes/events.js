const express = require('express');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { cloudinary } = require('../config/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Separate multer for cover images (single file, smaller folder)
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `photo-sharing/covers`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 600, crop: 'fill', quality: 'auto' }],
    public_id: `cover-${Date.now()}`,
  }),
});
const uploadCover = multer({
  storage: coverStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = express.Router();

// All event routes require authentication
router.use(authenticate);

// ─── Admin: Create event ────────────────────────────────────────────────────
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Event name is required'),
    body('description').optional().trim(),
    body('location').optional().trim(),
    body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
    body('coverImageUrl').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, description, location, date, memberIds, coverImageUrl } = req.body;

      // Validate memberIds if provided
      let validatedMembers = [];
      if (Array.isArray(memberIds) && memberIds.length > 0) {
        const users = await User.find({
          _id: { $in: memberIds },
          role: 'team_member',
        }).select('_id');
        validatedMembers = users.map((u) => u._id);
      }

      const event = await Event.create({
        name,
        description,
        location: location || '',
        date: date || undefined,
        coverImageUrl: coverImageUrl || '',
        createdBy: req.user._id,
        teamMembers: validatedMembers,
      });

      const populated = await Event.findById(event._id)
        .populate('teamMembers', 'name email');

      res.status(201).json({ event: populated });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── List events ─────────────────────────────────────────────────────────────
// Admin sees all their events; team members see only assigned events
router.get('/', async (req, res) => {
  try {
    let events;
    if (req.user.role === 'admin') {
      events = await Event.find({ createdBy: req.user._id })
        .populate('teamMembers', 'name email')
        .sort({ createdAt: -1 });
    } else {
      events = await Event.find({ teamMembers: req.user._id })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });
    }
    res.json({ events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Admin: List all team_member users (for adding to events) ────────────────
router.get('/users/team-members', authorize('admin'), async (req, res) => {
  try {
    const members = await User.find({ role: 'team_member' })
      .select('name email role createdAt')
      .sort({ createdAt: -1 });
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Get single event ────────────────────────────────────────────────────────
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid event ID')],
  validate,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('teamMembers', 'name email');

      if (!event) return res.status(404).json({ message: 'Event not found' });

      // Access control: admin must own it; team member must be assigned
      const isOwner = event.createdBy._id.toString() === req.user._id.toString();
      const isMember = event.teamMembers.some(
        (m) => m._id.toString() === req.user._id.toString()
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({ message: 'Access denied to this event' });
      }

      res.json({ event });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin: Add team members to event ────────────────────────────────────────
router.post(
  '/:id/members',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid event ID'),
    body('memberIds')
      .isArray({ min: 1 })
      .withMessage('memberIds must be a non-empty array'),
    body('memberIds.*').isMongoId().withMessage('Each memberId must be a valid ID'),
  ],
  validate,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the event owner can add members' });
      }

      // Validate all provided IDs are real team_member users
      const users = await User.find({
        _id: { $in: req.body.memberIds },
        role: 'team_member',
      });

      if (users.length !== req.body.memberIds.length) {
        return res.status(400).json({
          message: 'One or more IDs are invalid or not team members',
        });
      }

      // Add without duplicating
      const newIds = req.body.memberIds.filter(
        (id) => !event.teamMembers.map(String).includes(id)
      );
      event.teamMembers.push(...newIds);
      await event.save();

      const updated = await Event.findById(event._id)
        .populate('teamMembers', 'name email')
        .populate('createdBy', 'name email');

      res.json({ event: updated });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin: Remove a team member ─────────────────────────────────────────────
router.delete(
  '/:id/members/:memberId',
  authorize('admin'),
  [
    param('id').isMongoId(),
    param('memberId').isMongoId(),
  ],
  validate,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });

      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the event owner can remove members' });
      }

      event.teamMembers = event.teamMembers.filter(
        (m) => m.toString() !== req.params.memberId
      );
      await event.save();

      res.json({ message: 'Member removed', event });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Admin: Upload cover image for an event ──────────────────────────────────
// POST /api/events/:id/cover
router.post(
  '/:id/cover',
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid event ID')],
  validate,
  uploadCover.single('cover'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

      // Delete old cover from Cloudinary if it exists
      if (event.coverImageUrl) {
        const publicId = event.coverImageUrl
          .split('/upload/')[1]
          ?.replace(/^v\d+\//, '')
          ?.replace(/\.[^/.]+$/, '');
        if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
      }

      event.coverImageUrl = req.file.path;
      await event.save();

      res.json({ coverImageUrl: event.coverImageUrl, event });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
