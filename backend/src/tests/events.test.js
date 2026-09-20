const request = require('supertest');
const app = require('../app');
const { connect, closeDatabase, clearDatabase } = require('./setup');

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.FRONTEND_URL = 'http://localhost:5173';

let adminToken, memberToken, adminId, memberId;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  // Register admin (first user)
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Alice Admin',
    email: 'alice@example.com',
    password: 'password123',
  });
  adminToken = adminRes.body.token;
  adminId = adminRes.body.user.id;

  // Register team member (second user)
  const memberRes = await request(app).post('/api/auth/register').send({
    name: 'Bob Member',
    email: 'bob@example.com',
    password: 'password123',
  });
  memberToken = memberRes.body.token;
  memberId = memberRes.body.user.id;
});

// ─── Create event ─────────────────────────────────────────────────────────────
describe('POST /api/events', () => {
  it('admin can create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Wedding Party', description: 'A great event' });

    expect(res.status).toBe(201);
    expect(res.body.event.name).toBe('Wedding Party');
  });

  it('team member cannot create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Unauthorized Event' });

    expect(res.status).toBe(403);
  });

  it('requires event name', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No name here' });

    expect(res.status).toBe(422);
  });
});

// ─── List events ──────────────────────────────────────────────────────────────
describe('GET /api/events', () => {
  it('admin sees their own events', async () => {
    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'My Event' });

    const res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.events.length).toBe(1);
  });

  it('team member only sees assigned events', async () => {
    // Create event and add member
    const evRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Event A' });

    const eventId = evRes.body.event._id;

    // Before assignment, member sees 0 events
    let res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.body.events.length).toBe(0);

    // Assign member
    await request(app)
      .post(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberIds: [memberId] });

    // After assignment, member sees 1 event
    res = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.body.events.length).toBe(1);
  });
});

// ─── Get single event ─────────────────────────────────────────────────────────
describe('GET /api/events/:id', () => {
  it('returns 403 when user has no access to the event', async () => {
    const evRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Private Event' });

    const eventId = evRes.body.event._id;

    // Bob is not assigned
    const res = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});

// ─── Add members ──────────────────────────────────────────────────────────────
describe('POST /api/events/:id/members', () => {
  it('admin can add a team member', async () => {
    const evRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Event A' });

    const eventId = evRes.body.event._id;

    const res = await request(app)
      .post(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberIds: [memberId] });

    expect(res.status).toBe(200);
    expect(res.body.event.teamMembers.map((m) => m._id)).toContain(memberId);
  });

  it('team member cannot add members', async () => {
    const evRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Event A' });

    const eventId = evRes.body.event._id;

    const res = await request(app)
      .post(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberIds: [memberId] });

    expect(res.status).toBe(403);
  });
});
