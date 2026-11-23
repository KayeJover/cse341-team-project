
document.addEventListener("DOMContentLoaded", async () => {
    const tripContainer = document.getElementById("trip-details");

    if (!tripContainer) return;

    const tripId = tripContainer.dataset.tripId;

    // Load trip details
    try {
        const response = await fetch(
            `/api/trips/${encodeURIComponent(tripId)}`
        );

        if (!response.ok) {
            throw new Error("Failed to load trip details.");
        }

        const { trip } = await response.json();

        if (!trip) {
            throw new Error("Trip not found.");
        }

        document.getElementById("trip-name").textContent = trip.name;
        document.getElementById("trip-description").textContent =
            trip.description;

        const capitalize = (value) =>
            value.charAt(0).toUpperCase() + value.slice(1);

        document.getElementById("trip-region").textContent =
            capitalize(trip.region);

        document.getElementById("trip-duration").textContent =
            trip.duration;

        document.getElementById("trip-distance").textContent =
            `${trip.distance} km`;

        document.getElementById("trip-best-season").textContent =
            capitalize(trip.bestSeason);

        document.getElementById("trip-start-station").textContent =
            capitalize(trip.startStation);

        document.getElementById("trip-end-station").textContent =
            capitalize(trip.endStation);

        const highlights = document.getElementById("trip-highlights");
        highlights.replaceChildren();

        (trip.highlights || []).forEach((item) => {
            const span = document.createElement("span");
            span.className = "highlight-tag";
            span.textContent = item;
            highlights.appendChild(span);
        });

        const imageContainer = document.getElementById(
            "trip-image-container"
        );
        const image = document.getElementById("trip-image");

        if (trip.imageUrl) {
            image.src = trip.imageUrl;
            image.alt = trip.name;
            imageContainer.hidden = false;
        } else {
            imageContainer.hidden = true;
        }

    } catch (error) {
        console.error("Error loading trip details:", error);
    }

    // Schedule elements
    const monthSelect = document.getElementById("schedule-month");
    const schedulesContainer = document.getElementById(
        "schedules-container"
    );
    const scheduleMessage = document.getElementById("schedule-message");

    // Display schedules
    function renderSchedules(schedules) {
        schedulesContainer.replaceChildren();

        if (!schedules.length) {
            scheduleMessage.textContent =
                "No schedules available for this month.";
            return;
        }

        scheduleMessage.textContent = "";

        schedules.forEach((schedule) => {
            const card = document.createElement("div");
            card.className = "schedule-card";

            const times = document.createElement("div");
            times.className = "schedule-times";

            const departure = document.createElement("div");
            departure.className = "time-block";

            const departureLabel = document.createElement("span");
            departureLabel.className = "time-label";
            departureLabel.textContent = "Departs";

            const departureValue = document.createElement("span");
            departureValue.className = "time-value";
            departureValue.textContent = schedule.departureTime;

            departure.append(departureLabel, departureValue);

            const arrow = document.createElement("span");
            arrow.className = "time-arrow";
            arrow.textContent = "→";

            const arrival = document.createElement("div");
            arrival.className = "time-block";

            const arrivalLabel = document.createElement("span");
            arrivalLabel.className = "time-label";
            arrivalLabel.textContent = "Arrives";

            const arrivalValue = document.createElement("span");
            arrivalValue.className = "time-value";
            arrivalValue.textContent = schedule.arrivalTime;

            arrival.append(arrivalLabel, arrivalValue);

            times.append(departure, arrow, arrival);

            const days = document.createElement("div");
            days.className = "schedule-days";

            schedule.daysOfWeek.forEach((day) => {
                const badge = document.createElement("span");
                badge.className = "day-badge";
                badge.textContent = day.substring(0, 3);
                days.appendChild(badge);
            });

            const bookingLink = document.createElement("a");
            bookingLink.href = `/trips/booking/${encodeURIComponent(schedule.id)}`;
            bookingLink.className = "book-btn";
            bookingLink.textContent = "Book Now";

            card.append(times, days, bookingLink);
            schedulesContainer.appendChild(card);
        });
    }

    // Fetch schedules from API
    async function loadSchedules(month = "") {
        scheduleMessage.textContent = "Loading schedules...";
        schedulesContainer.replaceChildren();

        try {
            const query = month
                ? `?month=${encodeURIComponent(month)}`
                : "";

            const response = await fetch(
                `/api/trips/${encodeURIComponent(tripId)}/schedules${query}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to fetch schedules."
                );
            }

            renderSchedules(data.schedules || []);

        } catch (error) {
            console.error("Error loading schedules:", error);
            scheduleMessage.textContent =
                "Unable to load schedules. Please try again.";
        }
    }

    // Load all schedules initially
    await loadSchedules();

    // Reload schedules whenever month changes
    monthSelect.addEventListener("change", () => {
        loadSchedules(monthSelect.value);
    });
});
