import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI!);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Test 1 — Valid submission saves to DB
describe('POST /api/feedback', () => {
  it('should save valid feedback to DB', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        title: 'Test feedback title',
        description: 'This is a test description that is long enough',
        category: 'Bug',
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test feedback title');
  });

  // Test 2 — Rejects empty title
  it('should reject empty title', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        title: '',
        description: 'This is a test description that is long enough',
        category: 'Bug',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // Test 3 — Rejects missing category
  it('should reject missing category', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({
        title: 'Test title',
        description: 'This is a test description that is long enough',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});