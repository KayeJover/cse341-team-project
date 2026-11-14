
document.addEventListener("DOMContentLoaded", () => {
    const routesGrid = document.getElementById("routes-grid");
    const regionFilter = document.getElementById("region-filter");
    const seasonFilter = document.getElementById("season-filter");

    let trips = [];

    async function loadTrips() {
        try {
            const response = await fetch("/api/trips");

            if (!response.ok) {
                throw new Error("Failed to load trips.");
            }

            const data = await response.json();
            trips = data.trips;

            renderTrips();
        } catch (error) {
            console.error("Error loading trips:", error);
            routesGrid.innerHTML = "<p>Unable to load trips. Please try again later.</p>";
        }
    }

    function renderTrips() {
        const selectedRegion = regionFilter.value;
        const selectedSeason = seasonFilter.value;

        const filteredTrips = trips.filter((trip) => {
            const matchesRegion =
                selectedRegion === "all" || trip.region === selectedRegion;

            const matchesSeason =
                selectedSeason === "all" || trip.bestSeason === selectedSeason;

            return matchesRegion && matchesSeason;
        });

        if (filteredTrips.length === 0) {
            routesGrid.innerHTML = "<p>No trips found matching your filters.</p>";
            return;
        }

        routesGrid.innerHTML = filteredTrips
            .map(
                (trip) => `
          <div class="route-card ${trip.region}">
            <div class="route-header">
              <h2 class="route-name">${escapeHTML(trip.name)}</h2>
              <span class="route-region">${escapeHTML(trip.region)}</span>
            </div>

            <div class="station-info">
              <div class="station">
                <div class="station-type">From:</div>
                <div class="station-name">${escapeHTML(trip.startStation)}</div>
              </div>
              <div class="route-arrow">&#8594;</div>
              <div class="station">
                <div class="station-type">To:</div>
                <div class="station-name">${escapeHTML(trip.endStation)}</div>
              </div>
            </div>

            <div class="route-details">
              <div class="detail-item">
                <span class="detail-icon">&#128337;</span>
                <span><span class="detail-label">Duration:</span> ${escapeHTML(trip.duration)}</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">&#128205;</span>
                <span><span class="detail-label">Distance:</span> ${trip.distance}km</span>
              </div>
              <div class="detail-item">
                <span class="season-badge season-${escapeHTML(trip.bestSeason)}">
                  Best in ${escapeHTML(trip.bestSeason)}
                </span>
              </div>
            </div>

            <div class="route-description">
              ${escapeHTML(trip.description)}
            </div>

            <div class="highlights">
              <div class="highlights-list">
                ${trip.highlights
                        .map(
                            (highlight) =>
                                `<span class="highlight-tag">${escapeHTML(highlight)}</span>`,
                        )
                        .join("")}
              </div>
            </div>

            <div class="route-actions">
              <a href="/trips/${encodeURIComponent(trip.id)}" class="view-details-btn">
                View Details &amp; Book &#8594;
              </a>
            </div>
          </div>
        `,
            )
            .join("");
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            };

            return entities[character];
        });
    }

    regionFilter.addEventListener("change", renderTrips);
    seasonFilter.addEventListener("change", renderTrips);

    loadTrips();
});
