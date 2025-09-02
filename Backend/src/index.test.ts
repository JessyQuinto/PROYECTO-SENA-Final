import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { app } from './index.js';

describe('Health endpoint', () => {
  it('GET /health should return ok true', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('service');
  });
});
