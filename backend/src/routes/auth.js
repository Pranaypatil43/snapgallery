const express  = require('express');
const { body } = require('express-validator');
const jwt      = require('jsonwebtoken');
const passport = require('../config/passport');
const User     = require('../models/User');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { sendInviteEmail } = require('../config/mailer');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register  — Admin self-registration
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      // First registered user becomes admin; subsequent ones are team_members
      // (Admins can also be created explicitly by passing role in body if already admin)
      const count = await User.countDocuments();
      const role = count === 0 ? 'admin' : 'team_member';

      const user = await User.create({ name, email, password, role });
      const token = signToken(user._id);

      res.status(201).json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = signToken(user._id);

      res.json({
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// POST /api/auth/invite — Admin creates a new team member account
router.post(
  '/invite',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' });
      }

      const user = await User.create({ name, email, password, role: 'team_member' });

      // Send login credentials to the new team member's email
      try {
        await sendInviteEmail({ name, email, password });
      } catch (mailErr) {
        // Account is created — don't fail the request if email sending fails
        console.error('Invite email failed:', mailErr.message);
      }

      res.status(201).json({
        message: 'Team member created successfully',
        member: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/auth/me — get current user profile
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// PATCH /api/auth/change-password — authenticated user changes own password
router.patch(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      const match = await user.comparePassword(req.body.currentPassword);
      if (!match) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ─── Google OAuth ─────────────────────────────────────────────────────────────

// Step 1: Redirect user to Google consent screen
// GET /api/auth/google
router.get(
  '/google',
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ message: 'Google authentication is not configured' });
    }
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: req.query.state,
      prompt: 'select_account',
    })(req, res, next);
  }
);

// Step 2: Google redirects back here after user consents
// GET /api/auth/google/callback
router.get(
  '/google/callback',
  (req, res, next) => {
    const rawFrontend = req.query.state || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = rawFrontend.replace(/\/+$/, '');
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
    }
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${frontendUrl}/login?error=google_failed`,
    })(req, res, next);
  },
  (req, res) => {
    const rawFrontend = req.query.state || process.env.FRONTEND_URL || 'http://localhost:5173';
    const frontendUrl = rawFrontend.replace(/\/+$/, '');
    // passport.authenticate sets req.user = false when strategy calls done(null, false)
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=no_account`);
    }

    // Issue our own JWT — same as email/password login
    const token = signToken(req.user._id);
    const user  = {
      id:    req.user._id,
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role,
    };

    // Redirect to frontend callback page with token + user in query string
    const params = new URLSearchParams({
      token,
      user: JSON.stringify(user),
    });
    res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
);

module.exports = router;
