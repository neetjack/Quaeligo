import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/index';

process.env.NODE_ENV = 'test';

let server: http.Server;
let baseUrl: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://localhost:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test('Auth: should reject invalid credentials', async () => {
  const res = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nonexistent_user', password: 'wrongpassword' }),
  });
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'Invalid credentials');
});

test('Surveys: should return list of public surveys', async () => {
  const res = await fetch(`${baseUrl}/api/surveys`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data), 'Result must be an array');
});

test('Surveys: should return 404 for non-existent survey slug', async () => {
  const res = await fetch(`${baseUrl}/api/surveys/definitely_not_a_valid_slug_xyz`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.error, 'Survey not found');
});

test('Responses: should reject empty batch responses array', async () => {
  const res = await fetch(`${baseUrl}/api/surveys/default-survey/responses/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses: [] }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Invalid or excessively large payload');
});

test('Responses: should reject invalid sessionId with illegal characters', async () => {
  const res = await fetch(`${baseUrl}/api/surveys/default-survey/responses/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responses: [
        {
          sessionId: 'bad session id with spaces & symbols!',
          questionId: 1,
          choice: '{"answer":"test"}',
        },
      ],
    }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Invalid sessionId format');
});

test('Responses: should reject invalid negative or zero questionId', async () => {
  const res = await fetch(`${baseUrl}/api/surveys/default-survey/responses/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      responses: [
        {
          sessionId: 'sess_valid_123',
          questionId: -99,
          choice: '{"answer":"test"}',
        },
      ],
    }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error, 'Invalid questionId');
});

test('Admin: should require auth token on admin routes', async () => {
  const res = await fetch(`${baseUrl}/api/admin/surveys`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.error, 'Unauthorized: No token provided');
});

test('CORS: should reject request from unapproved external origin', async () => {
  const res = await fetch(`${baseUrl}/api/surveys`, {
    headers: { Origin: 'https://malicious-site.example.com' },
  });
  assert.equal(res.status, 500);
});
