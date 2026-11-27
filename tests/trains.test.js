import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trains', () => {

  test('searches trains by name', async () => {
    const response = await request(app).get('/api/trains?search=E353');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353'
        })
      ])
    );
    expect(response.body.pagination.search).toBe('E353');
  });

  test('searches trains by operator', async () => {
    const response = await request(app).get('/api/trains?search=JR%20East');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          operator: 'JR East'
        })
      ])
    );
  });

  test('searches trains by type', async () => {
    const response = await request(app).get('/api/trains?search=Express');

    expect(response.status).toBe(200);
    expect(response.body.trains.length).toBeGreaterThan(0);
  });

  test('returns an empty array when no trains match the search', async () => {
    const response = await request(app).get(
      '/api/trains?search=nonexistent123'
    );

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
  });

  test('preserves pagination when searching', async () => {
    const response = await request(app).get(
      '/api/trains?search=express&page=1&limit=2'
    );

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      totalItems: 3,
      totalPages: 2,
      currentPage: 1,
      itemsPerPage: 2,
      search: 'express'
    });
  });

  test('returns pagination metadata with default values', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      totalItems: 4,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
      search: ''
    });
  });

  test('returns the requested page and limit', async () => {
    const db = getDb();

    await db.collection('trains').insertMany(
      Array.from({ length: 8 }, (_, index) => ({
        id: `extra-train-${index}`,
        name: `Extra Train ${index}`,
        operator: 'Test Railway'
      }))
    );

    const response = await request(app).get('/api/trains?page=2&limit=5');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(5);
    expect(response.body.pagination).toEqual({
      totalItems: 12,
      totalPages: 3,
      currentPage: 2,
      itemsPerPage: 5,
      search: ''
    });
  });

  test('rejects invalid pagination parameters', async () => {
    const response = await request(app).get('/api/trains?page=0');

    expect(response.status).toBe(400);
  });

  test('rejects a limit greater than 10', async () => {
    const response = await request(app).get('/api/trains?limit=11');

    expect(response.status).toBe(400);
  });


  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trains');
    expect(response.body.trains).toBeInstanceOf(Array);
  });

  test('returns the trains from the starter data', async () => {
    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toHaveLength(4);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'series-e353',
          name: 'Series E353 Limited Express',
          powerSource: 'Electric'
        })
      ])
    );
  });

  test('returns a train added to the test database', async () => {
    await getDb().collection('trains').insertOne({
      id: 'test-express',
      name: 'Test Express',
      operator: 'Test Railway'
    });

    const response = await request(app).get('/api/trains');

    expect(response.status).toBe(200);
    expect(response.body.trains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-express',
          name: 'Test Express'
        })
      ])
    );
  });
});
