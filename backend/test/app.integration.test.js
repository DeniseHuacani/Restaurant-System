const request = require('supertest');
const app = require('../src/app');

describe('Backend app basic integration', () => {
  test('GET / returns ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ ok: true }));
  });
});
