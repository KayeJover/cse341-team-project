
document.addEventListener("DOMContentLoaded", async () => {
    const tripContainer = document.getElementById("trip-details");

    if (!tripContainer) return;

    const tripId = tripContainer.dataset.tripId;

    try {
        const response = await fetch(
            `/api/trips/${encodeURIComponent(tripId)}`
        );

        if (!response.ok) {
            throw new Error("Failed to load trip details.");
        }

        const data = await response.json();
        const trip = data.trip;

        if (!trip) {
            throw new Error("Trip not found.");
        }

        // Update trip name
        document.getElementById("trip-name").textContent = trip.name;

        // Update trip description
        document.getElementById("trip-description").textContent =
            trip.description;

        // Update trip region
        const regionElement = document.getElementById("trip-region");

        regionElement.textContent =
            trip.region.charAt(0).toUpperCase() + trip.region.slice(1);

        regionElement.className = `info-value region-${trip.region}`;

        // Update trip duration
        document.getElementById("trip-duration").textContent = trip.duration;

        // Update trip distance
        document.getElementById("trip-distance").textContent =
            `${trip.distance} km`;

        // Update best season
        const seasonElement = document.getElementById("trip-best-season");

        seasonElement.textContent =
            trip.bestSeason.charAt(0).toUpperCase() +
            trip.bestSeason.slice(1);

        seasonElement.className = `info-value season-${trip.bestSeason}`;

        // Update start station
        document.getElementById("trip-start-station").textContent =
            trip.startStation.charAt(0).toUpperCase() +
            trip.startStation.slice(1);

        // Update end station
        document.getElementById("trip-end-station").textContent =
            trip.endStation.charAt(0).toUpperCase() +
            trip.endStation.slice(1);

        // Update highlights
        const highlightsContainer =
            document.getElementById("trip-highlights");

        highlightsContainer.replaceChildren();

        (trip.highlights || []).forEach((highlight) => {
            const highlightElement = document.createElement("span");

            highlightElement.className = "highlight-tag";
            highlightElement.textContent = highlight;

            highlightsContainer.appendChild(highlightElement);
        });

        // Update trip image
        const imageContainer = document.getElementById(
            "trip-image-container"
        );

        const tripImage = document.getElementById("trip-image");

        if (trip.imageUrl) {
            tripImage.src = trip.imageUrl;
            tripImage.alt = trip.name;
            imageContainer.hidden = false;
        } else {
            imageContainer.hidden = true;
        }

        // Update operating months
        const monthsContainer = document.getElementById(
            "trip-operating-months"
        );

        monthsContainer.replaceChildren();

        (trip.operatingMonths || []).forEach((month) => {
            const monthElement = document.createElement("span");

            monthElement.className = "month-badge";
            monthElement.textContent = month;

            monthsContainer.appendChild(monthElement);
        });

    } catch (error) {
        console.error("Error loading trip details:", error);
    }
});
