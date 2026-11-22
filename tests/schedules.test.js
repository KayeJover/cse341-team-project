import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/trips/:tripId/schedules', () => {
  test('returns schedules for an existing trip', async () => {
    const response = await request(app)
      .get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('schedules');
    expect(response.body.schedules).toBeInstanceOf(Array);
    expect(response.body.schedules).toHaveLength(2);
    expect(response.body.schedules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tripId: 'alpine-panorama',
          departureTime: '08:30'
        })
      ])
    );
  });

  test('returns 404 when the trip does not exist', async () => {
    const response = await request(app)
      .get('/api/trips/trip-does-not-exist/schedules');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Trip not found'
    });
  });

  test('returns an empty array when an existing trip has no schedules', async () => {
    await getDb().collection('trips').insertOne({
      id: 'trip-without-schedules',
      name: 'Trip Without Schedules',
      description: 'A test trip without schedules.',
      region: 'central',
      startStation: 'nagoya',
      endStation: 'toyama',
      duration: '2 hours',
      distance: 100,
      highlights: ['Test highlight'],
      bestSeason: 'summer',
      operatingMonths: [6, 7, 8]
    });

    const response = await request(app)
      .get('/api/trips/trip-without-schedules/schedules');

    expect(response.status).toBe(200);
    expect(response.body.schedules).toEqual([]);
  });
});
