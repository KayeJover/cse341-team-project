
const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');

    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');

    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

// Trains catalog with pagination

const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');
    const paginationEl = document.getElementById('trains-pagination');
    const previousBtn = document.getElementById('trains-previous');
    const nextBtn = document.getElementById('trains-next');
    const pageInfoEl = document.getElementById('trains-page-info');

    // Search elements
    const searchForm = document.getElementById('trains-search-form');
    const searchInput = document.getElementById('trains-search');

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    let currentSearch = '';

    const loadTrains = async (page) => {
        try {
            if (loadingEl) loadingEl.hidden = false;
            if (errorEl) errorEl.hidden = true;

            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
                search: currentSearch,
            });

            const response = await fetch(`/api/trains?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Failed to load trains (${response.status})`);
            }

            const payload = await response.json();
            const trains = payload.trains || [];
            const pagination = payload.pagination;
            const fragment = document.createDocumentFragment();

            if (trains.length === 0) {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'trains-state';
                emptyMessage.textContent = currentSearch
                    ? 'No trains found matching your search.'
                    : 'No trains are currently available.';

                fragment.appendChild(emptyMessage);
            }

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);
                const imageEl = card.querySelector('[data-field="image"]');

                imageEl.src = train.imageUrl;
                imageEl.alt = train.imageAlt || `${train.name} train`;

                card.querySelector('[data-field="name"]').textContent = train.name;
                card.querySelector('[data-field="operator"]').textContent = train.operator;
                card.querySelector('[data-field="type"]').textContent = train.type;
                card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
                card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
                card.querySelector('[data-field="power"]').textContent = train.powerSource;
                card.querySelector('[data-field="description"]').textContent = train.description;
                card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            currentPage = pagination.currentPage;

            if (pageInfoEl) {
                pageInfoEl.textContent = pagination.totalPages > 0
                    ? `Page ${pagination.currentPage} of ${pagination.totalPages}`
                    : 'No pages available';
            }

            if (previousBtn) {
                previousBtn.disabled = currentPage <= 1;
            }

            if (nextBtn) {
                nextBtn.disabled = currentPage >= pagination.totalPages;
            }

            if (paginationEl) {
                paginationEl.hidden = pagination.totalPages <= 1;
            }
        } catch (error) {
            console.error('Error loading trains:', error);

            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
            }
        } finally {
            if (loadingEl) loadingEl.hidden = true;
        }
    };

    // Handle search form submission
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();

            currentSearch = searchInput.value.trim();
            currentPage = 1;

            loadTrains(currentPage);
        });
    }

    // Previous page
    if (previousBtn) {
        previousBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                loadTrains(currentPage - 1);
            }
        });
    }

    // Next page
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            loadTrains(currentPage + 1);
        });
    }

    // Initial train loading
    await loadTrains(currentPage);
};


const hookStationsCatalog = async () => {
    const listEl = document.getElementById('stations-list');
    const templateEl = document.getElementById('station-card-template');
    const loadingEl = document.getElementById('stations-loading');
    const errorEl = document.getElementById('stations-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const regionSelect = document.getElementById('stations-region-filter');
        const selectedRegion = regionSelect ? regionSelect.value : 'all';

        const url = new URL('/api/stations', window.location.origin);

        if (selectedRegion !== 'all') {
            url.searchParams.set('region', selectedRegion);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to load stations (${response.status})`);
        }

        const payload = await response.json();
        const stations = payload.stations || [];
        const fragment = document.createDocumentFragment();

        stations.forEach((station) => {
            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="name"]').textContent = station.name;
            card.querySelector('[data-field="prefecture"]').textContent = station.prefecture;
            card.querySelector('[data-field="region"]').textContent = station.region;
            card.querySelector('[data-field="description"]').textContent = station.description;

            const facilitiesEl = card.querySelector('[data-field="facilities"]');

            station.facilities.forEach((facility) => {
                const item = document.createElement('li');
                item.textContent = facility.replaceAll('_', ' ');
                facilitiesEl.appendChild(item);
            });

            const detailsLink = card.querySelector('[data-field="details-link"]');
            detailsLink.href = `/stations/${station.id}`;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        const errorEl = document.getElementById('stations-error');

        if (errorEl) {
            errorEl.hidden = true;
        }
    } catch (error) {
        console.error('Error loading stations:', error);

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load stations right now. Please try again.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookStationsCatalog();

    const stationsRegionSelect = document.getElementById('stations-region-filter');

    if (stationsRegionSelect) {
        stationsRegionSelect.addEventListener('change', () => {
            hookStationsCatalog();
        });
    }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                });

                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    alert('Unable to log out. Please try again.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('Something went wrong while logging out.');
            }
        });
    }
});
