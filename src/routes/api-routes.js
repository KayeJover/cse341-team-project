// Authentication routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);

// Get the currently authenticated user.
router.get("/auth/me", requireAuth, (req, res) => {
    return res.status(200).json({
        user: req.session.user,
    });
});

// Stations API
router.get("/stations", getAllStations);
router.get("/stations/:stationId", getStationById);

// Trains API
router.get("/trains", getAllTrains);
router.get("/trains/:id", getTrainById);