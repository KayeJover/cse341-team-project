

import { Router } from 'express';
import {
  getAllStations,
  getStationById,
} from '../controllers/stations.js';

const router = Router();

// Render the Stations page
router.get('/stations', (req, res) => {
  res.render('stations', { title: 'Stations' });
});

// Get all stations
router.get('/api/stations', getAllStations);

// Get one station by ID
router.get('/api/stations/:stationId', getStationById);

// Render an individual station details page
router.get('/stations/:stationId', (req, res) => {
  res.render('station-details', {
    title: 'Station Details',
    stationId: req.params.stationId
  });
});

export default router;
