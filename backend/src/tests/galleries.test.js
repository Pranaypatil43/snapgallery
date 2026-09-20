const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Photo = require('../models/Photo');
const { connect, closeDatabase, clearDatabase } = require('./setup');

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.FRONTEND_URL = 'http://localhost:5173';

let adminToken, memberToken, eventId, photoId;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  // Admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Alice Admin',
    email: 'alice@example.com',
    password: 'password123',
  });
  adminToken = adminRes.body.token;
  const adminId = adminRes.body.user.id;

  // Team member
  const memberRes = await request(app).post('/api/auth/register').send({
    name: 'Bob Member',
    email: 'bob@example.com',
    password: 'password123',
  });
  memberToken = memberRes.body.token;

  // Event
  const evRes = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Test Event' });
  eventId = evRes.body.event._id;

  // Inject a photo directly (bypasses Cloudinary)
  const photo = await Photo.create({
    eventId,
    uploadedBy: new mongoose.Types.ObjectId(adminId),
    filename: 'test.jpg',
    storagePublicId: 'photo-sharing/test/test',
    storageUrl: 'https://res.cloudinary.com/demo/image/upload/test.jpg',
    thumbnailUrl: 'https://res.cloudinary.com/demo/image/upload/w_400/test.jpg',
    fileSize: 102400,
    mimeType: 'image/jpeg',
  });
  photoId = photo._id.toString();
});

// ─── Create gallery ────────────────────────────────────────────────────────────
describe('POST /api/galleries', () => {
  it('admin can create a gallery', async () => {
    const res = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Wedding Gallery',
        selectedPhotos: [photoId],
        pin: '482917',
      });

    expect(res.status).toBe(201);
    expect(res.body.gallery.title).toBe('Wedding Gallery');
    expect(res.body.gallery.pinHash).toBeUndefined(); // must never be returned
    expect(res.body.gallery.slug).toBeDefined();
  });

  it('team member cannot create a gallery', async () => {
    const res = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        eventId,
        title: 'Unauthorized Gallery',
        selectedPhotos: [photoId],
        pin: '1234',
      });

    expect(res.status).toBe(403);
  });

  it('rejects empty PIN', async () => {
    const res = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Gallery',
        selectedPhotos: [photoId],
        pin: '123', // too short
      });

    expect(res.status).toBe(422);
  });

  it('rejects empty selectedPhotos', async () => {
    const res = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Gallery',
        selectedPhotos: [],
        pin: '482917',
      });

    expect(res.status).toBe(422);
  });
});

// ─── Publish gallery ──────────────────────────────────────────────────────────
describe('PATCH /api/galleries/:id/publish', () => {
  let galleryId, gallerySlug;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Wedding Gallery',
        selectedPhotos: [photoId],
        pin: '482917',
      });
    galleryId = res.body.gallery._id;
    gallerySlug = res.body.gallery.slug;
  });

  it('admin can publish a gallery', async () => {
    const res = await request(app)
      .patch(`/api/galleries/${galleryId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.gallery.isPublished).toBe(true);
    expect(res.body.shareUrl).toContain(gallerySlug);
  });

  it('team member cannot publish a gallery', async () => {
    const res = await request(app)
      .patch(`/api/galleries/${galleryId}/publish`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── PIN-protected public access ─────────────────────────────────────────────
describe('POST /api/galleries/public/:slug/verify', () => {
  let gallerySlug;

  beforeEach(async () => {
    // Create gallery
    const createRes = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Wedding Gallery',
        selectedPhotos: [photoId],
        pin: '482917',
      });

    gallerySlug = createRes.body.gallery.slug;
    const galleryId = createRes.body.gallery._id;

    // Publish it
    await request(app)
      .patch(`/api/galleries/${galleryId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  it('grants access with correct PIN', async () => {
    const res = await request(app)
      .post(`/api/galleries/public/${gallerySlug}/verify`)
      .send({ pin: '482917' });

    expect(res.status).toBe(200);
    expect(res.body.gallery.selectedPhotos).toBeDefined();
    expect(res.body.gallery.pinHash).toBeUndefined();
  });

  it('rejects incorrect PIN', async () => {
    const res = await request(app)
      .post(`/api/galleries/public/${gallerySlug}/verify`)
      .send({ pin: '000000' });

    expect(res.status).toBe(401);
  });

  it('rejects missing PIN', async () => {
    const res = await request(app)
      .post(`/api/galleries/public/${gallerySlug}/verify`)
      .send({});

    expect(res.status).toBe(422);
  });

  it('returns 403 for unpublished gallery', async () => {
    // Create a new gallery (not published)
    const createRes = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Draft Gallery',
        selectedPhotos: [photoId],
        pin: '123456',
      });

    // Unpublish (it starts unpublished, but lets confirm via endpoint)
    const draftSlug = createRes.body.gallery.slug;

    const res = await request(app)
      .post(`/api/galleries/public/${draftSlug}/verify`)
      .send({ pin: '123456' });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent slug', async () => {
    const res = await request(app)
      .post('/api/galleries/public/doesnotexist/verify')
      .send({ pin: '482917' });

    expect(res.status).toBe(404);
  });
});

// ─── Access to unpublished photos ────────────────────────────────────────────
describe('GET /api/galleries/public/:slug (info endpoint)', () => {
  it('returns 403 for unpublished gallery', async () => {
    const createRes = await request(app)
      .post('/api/galleries')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        title: 'Draft',
        selectedPhotos: [photoId],
        pin: '123456',
      });

    const res = await request(app).get(
      `/api/galleries/public/${createRes.body.gallery.slug}`
    );

    expect(res.status).toBe(403);
  });
});
