
import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('GET /api/stations', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toHaveProperty('stations');
    expect(response.body.stations).toBeInstanceOf(Array);
  });

  test('returns the stations from the starter data', async () => {
    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body.stations).toHaveLength(12);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'nagoya',
          name: 'Nagoya Station',
          prefecture: 'Aichi',
          region: 'central'
        })
      ])
    );
  });

  test('returns a station added to the test database', async () => {
    await getDb().collection('stations').insertOne({
      id: 'test-station',
      name: 'Test Station',
      prefecture: 'Test Prefecture',
      region: 'central',
      facilities: ['restroom'],
      description: 'A station for testing.'
    });

    const response = await request(app).get('/api/stations');

    expect(response.status).toBe(200);
    expect(response.body.stations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'test-station',
          name: 'Test Station'
        })
      ])
    );
  });

  test('filters stations by region', async () => {
    const response = await request(app).get('/api/stations?region=central');

    expect(response.status).toBe(200);
    expect(response.body.stations.length).toBeGreaterThan(0);
    expect(response.body.stations.every(
      (station) => station.region === 'central'
    )).toBe(true);
  });
});

describe('GET /api/stations/:stationId', () => {
  test('returns one station by ID', async () => {
    const response = await request(app).get('/api/stations/nagoya');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('station');
    expect(response.body.station).toEqual(
      expect.objectContaining({
        id: 'nagoya',
        name: 'Nagoya Station'
      })
    );
  });

  test('returns 404 when the station does not exist', async () => {
    const response = await request(app).get('/api/stations/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Station not found' });
  });
});
