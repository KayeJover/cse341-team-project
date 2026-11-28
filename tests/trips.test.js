
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('GET /api/trips', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('trips');
    expect(response.body.trips).toBeInstanceOf(Array);
  });

  test('returns the trips from the starter data', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.trips).toHaveLength(6);
    expect(response.body.trips).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express',
          startStation: 'nagoya',
          endStation: 'toyama'
        })
      ])
    );
  });

  test('returns trips with valid starting and destination stations', async () => {
    const [tripsResponse, stationsResponse] = await Promise.all([
      request(app).get('/api/trips'),
      request(app).get('/api/stations')
    ]);

    expect(tripsResponse.status).toBe(200);
    expect(stationsResponse.status).toBe(200);

    const stationIds = new Set(
      stationsResponse.body.stations.map((station) => station.id)
    );

    expect(tripsResponse.body.trips.length).toBeGreaterThan(0);

    tripsResponse.body.trips.forEach((trip) => {
      expect(stationIds.has(trip.startStation)).toBe(true);
      expect(stationIds.has(trip.endStation)).toBe(true);
    });
  });
});

describe('GET /api/trips/:tripId', () => {
  test('returns one trip by ID', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama'
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('trip');
    expect(response.body.trip).toEqual(
      expect.objectContaining({
        id: 'alpine-panorama',
        name: 'Alpine Panorama Express',
        startStation: 'nagoya',
        endStation: 'toyama'
      })
    );
  });

  test('returns 404 when the trip does not exist', async () => {
    const response = await request(app).get(
      '/api/trips/unknown-trip'
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: 'Trip not found'
    });
  });
});
