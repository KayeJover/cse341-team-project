
document.addEventListener("DOMContentLoaded", () => {
    const routesGrid = document.getElementById("routes-grid");
    const regionFilter = document.getElementById("region-filter");
    const seasonFilter = document.getElementById("season-filter");
    const keywordSearch = document.getElementById("keyword-search");
    const paginationControls =
        document.getElementById("pagination-controls");

    let trips = [];
    let currentPage = 1;
    const pageSize = 3;
    let totalPages = 0;
    let filtersLoaded = false;

    const pageParams = new URLSearchParams(window.location.search);

    const initialRegion = pageParams.get("region") || "all";
    const initialSeason = pageParams.get("season") || "all";
    const initialKeyword = pageParams.get("keyword") || "";

    async function loadTrips(page = 1) {
        try {
            const params = new URLSearchParams({
                page,
                limit: pageSize,
                keyword: keywordSearch.value.trim(),
                region: regionFilter.value,
                season: seasonFilter.value,
            });

            const response = await fetch(`/api/trips?${params}`);

            if (!response.ok) {
                throw new Error("Failed to load trips.");
            }

            const result = await response.json();

            if (!Array.isArray(result.data)) {
                throw new Error("Invalid trips API response.");
            }

            trips = result.data;
            currentPage = result.pagination.currentPage;
            totalPages = result.pagination.totalPages;

            if (result.filters && !filtersLoaded) {
                populateFilters(result.filters);

                // Reload using the initial URL filter values
                if (
                    initialRegion !== "all" ||
                    initialSeason !== "all" ||
                    initialKeyword !== ""
                ) {
                    await loadTrips(1);
                    return;
                }
            }
            renderTrips();
            renderPagination();
        } catch (error) {
            console.error("Error loading trips:", error);
            routesGrid.innerHTML =
                "<p>Unable to load trips. Please try again later.</p>";
            paginationControls.replaceChildren();
        }
    }

    
    function populateFilters(filters) {
        // Populate dropdowns only once
        if (filtersLoaded) {
            return;
        }

        regionFilter.replaceChildren(
            new Option("All Regions", "all")
        );

        filters.regions.forEach((region) => {
            regionFilter.add(new Option(region, region));
        });

        seasonFilter.replaceChildren(
            new Option("Any Season", "all")
        );

        filters.seasons.forEach((season) => {
            seasonFilter.add(new Option(season, season));
        });

        filtersLoaded = true;
        regionFilter.value = initialRegion;
        seasonFilter.value = initialSeason;
        keywordSearch.value = initialKeyword;
    }


    function renderTrips() {
        if (trips.length === 0) {
            routesGrid.innerHTML =
                "<p>No trips found matching your search.</p>";
            return;
        }

        routesGrid.innerHTML = trips
            .map(
                (trip) => `
          <div class="route-card ${escapeHTML(trip.region)}">
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
                ${(trip.highlights || [])
                    .map(
                        (highlight) =>
                            `<span class="highlight-tag">${escapeHTML(highlight)}</span>`
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
        `
            )
            .join("");
    }

    function renderPagination() {
        if (totalPages <= 1) {
            paginationControls.replaceChildren();
            return;
        }

        paginationControls.innerHTML = `
            <button id="previous-page"
                ${currentPage === 1 ? "disabled" : ""}>
                Previous
            </button>

            <span>Page ${currentPage} of ${totalPages}</span>

            <button id="next-page"
                ${currentPage === totalPages ? "disabled" : ""}>
                Next
            </button>
        `;

        document
            .getElementById("previous-page")
            .addEventListener("click", () => {
                if (currentPage > 1) {
                    loadTrips(currentPage - 1);
                }
            });

        document
            .getElementById("next-page")
            .addEventListener("click", () => {
                if (currentPage < totalPages) {
                    loadTrips(currentPage + 1);
                }
            });
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

    regionFilter.addEventListener("change", () => loadTrips(1));
    seasonFilter.addEventListener("change", () => loadTrips(1));
    keywordSearch.addEventListener("input", () => loadTrips(1));

    loadTrips(1);
});
