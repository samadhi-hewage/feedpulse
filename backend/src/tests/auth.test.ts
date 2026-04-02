import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI!);
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Test 4 — Auth middleware blocks unauthenticated requests
describe('Auth Middleware', () => {
  it('should reject request without token', async () => {
    const res = await request(app).get('/api/feedback');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});