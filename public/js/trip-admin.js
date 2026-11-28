
const tripList = document.querySelector("#admin-trips-list");
const message = document.querySelector("#trip-admin-message");
const editor = document.querySelector("#trip-editor");
const editForm = document.querySelector("#trip-edit-form");
const scheduleForm = document.querySelector("#schedule-assignment-form");

const trips = new Map();

let stations = [];
let schedules = [];
let busy = false;

/**
 * Display feedback to the administrator.
 */
function showMessage(text, isError = false) {
    message.textContent = text;
    message.setAttribute(
        "role",
        isError ? "alert" : "status"
    );
}

/**
 * Make an API request and handle unsuccessful responses.
 */

async function requestJson(url, options = {}) {
    const response = await fetch(url, options);

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}

/**
 * Prevent duplicate operations while requests are pending.
 */
function setBusy(value) {
    busy = value;

    document.querySelectorAll(
        "#admin-trips-list button, " +
        "#trip-edit-form button, " +
        "#schedule-assignment-form button, " +
        "#reload-trips"
    ).forEach((button) => {
        button.disabled = value;
    });
}

/**
 * Retrieve every page of trips from the existing API.
 */
async function fetchAllTrips() {
    const allTrips = [];
    let page = 1;
    let totalPages = 1;

    do {
        const result = await requestJson(
            `/api/trips?page=${page}&limit=100`
        );

        if (!Array.isArray(result.data)) {
            throw new Error("Invalid trip data received.");
        }

        allTrips.push(...result.data);

        totalPages = result.pagination?.totalPages ?? 1;
        page += 1;
    } while (page <= totalPages);

    return allTrips;
}

/**
 * Create a text element without inserting unsafe HTML.
 */
function createTextElement(tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
}

/**
 * Display the current trip list.
 */
function renderTrips() {
    tripList.replaceChildren();

    if (trips.size === 0) {
        tripList.append(
            createTextElement("p", "No trips found.")
        );

        return;
    }

    const grid = document.createElement("div");
    grid.className = "routes-grid";

    for (const trip of trips.values()) {
        const card = document.createElement("article");
        card.className = "trip-admin-card";

        const heading = createTextElement("h3", trip.name);

        const region = createTextElement(
            "p",
            `Region: ${trip.region}`
        );

        const start = stations.find(
            (station) => station.id === trip.startStation
        );

        const end = stations.find(
            (station) => station.id === trip.endStation
        );

        const route = createTextElement(
            "p",
            `${start?.name ?? trip.startStation} to ` +
            `${end?.name ?? trip.endStation}`
        );

        const duration = createTextElement(
            "p",
            `Duration: ${trip.duration}`
        );

        const assignedSchedules = schedules.filter(
            (schedule) => schedule.tripId === trip.id
        );

        const scheduleCount = createTextElement(
            "p",
            `Schedules: ${assignedSchedules.length}`
        );

        const editButton = createTextElement(
            "button",
            "Edit"
        );

        editButton.type = "button";
        editButton.dataset.action = "edit";
        editButton.dataset.tripId = trip.id;
        editButton.disabled = busy;

        const deleteButton = createTextElement(
            "button",
            "Delete"
        );

        deleteButton.type = "button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.tripId = trip.id;
        deleteButton.disabled = busy;

        card.append(
            heading,
            region,
            route,
            duration,
            scheduleCount,
            editButton,
            deleteButton
        );

        grid.append(card);
    }

    tripList.append(grid);
}

/**
 * Retrieve trips, stations and schedules.
 */
async function refreshData() {
    const [tripData, stationData, scheduleData] =
        await Promise.all([
            fetchAllTrips(),
            requestJson("/api/stations"),
            requestJson("/api/admin/schedules"),
        ]);

    if (
        !Array.isArray(stationData.stations) ||
        !Array.isArray(scheduleData.schedules)
    ) {
        throw new Error("Invalid station or schedule data.");
    }

    trips.clear();

    for (const trip of tripData) {
        trips.set(trip.id, trip);
    }

    stations = stationData.stations;
    schedules = scheduleData.schedules;

    renderTrips();
}

/**
 * Load all information when the page opens.
 */
async function loadData() {
    if (busy) {
        return;
    }

    setBusy(true);
    showMessage("Loading trips...");

    try {
        await refreshData();

        editor.hidden = true;

        showMessage(
            `${trips.size} trip(s) loaded successfully.`
        );
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        setBusy(false);
    }
}

/**
 * Populate station dropdowns with existing stations.
 */
function populateStationOptions(select, selectedId) {
    select.replaceChildren();

    const placeholder = new Option(
        "Select a station",
        ""
    );

    select.add(placeholder);

    for (const station of stations) {
        select.add(
            new Option(station.name, station.id)
        );
    }

    select.value = selectedId;
}

/**
 * Display schedules assigned to the selected trip.
 */
function renderSchedules(tripId) {
    const current = document.querySelector(
        "#current-trip-schedules"
    );

    const select = document.querySelector(
        "#existing-schedule"
    );

    current.replaceChildren();
    select.replaceChildren();

    select.add(
        new Option("Select a schedule", "")
    );

    const assigned = schedules.filter(
        (schedule) => schedule.tripId === tripId
    );

    if (assigned.length === 0) {
        current.append(
            createTextElement(
                "p",
                "No schedules assigned to this trip."
            )
        );
    } else {
        const list = document.createElement("ul");

        for (const schedule of assigned) {
            const status = schedule.status
                ? "Active"
                : "Inactive";

            list.append(
                createTextElement(
                    "li",
                    `Schedule ${schedule.id}: ` +
                    `${schedule.departureTime} - ` +
                    `${schedule.arrivalTime} (${status})`
                )
            );
        }

        current.append(list);
    }

    for (const schedule of schedules) {
        if (schedule.tripId === tripId) {
            continue;
        }

        const sourceTrip = trips.get(schedule.tripId);

        const label =
            `Schedule ${schedule.id}: ` +
            `${schedule.departureTime} - ` +
            `${schedule.arrivalTime} | ` +
            `${sourceTrip?.name ?? schedule.tripId}`;

        select.add(
            new Option(label, String(schedule.id))
        );
    }
}

/**
 * Open the editing form for an existing trip.
 */
function openEditor(tripId) {
    const trip = trips.get(tripId);

    if (!trip) {
        showMessage("Trip not found.", true);
        return;
    }

    document.querySelector("#trip-id").value = trip.id;

    document.querySelector("#trip-name").value =
        trip.name;

    document.querySelector("#trip-description").value =
        trip.description;

    document.querySelector("#trip-region").value =
        trip.region;

    document.querySelector("#trip-duration").value =
        trip.duration;

    document.querySelector("#trip-distance").value =
        trip.distance;

    document.querySelector("#trip-highlights").value =
        (trip.highlights ?? []).join(", ");

    document.querySelector("#trip-best-season").value =
        trip.bestSeason;

    document.querySelector("#trip-operating-months").value =
        (trip.operatingMonths ?? []).join(", ");

    document.querySelector("#trip-image-url").value =
        trip.imageUrl ?? "";

    populateStationOptions(
        document.querySelector("#trip-start-station"),
        trip.startStation
    );

    populateStationOptions(
        document.querySelector("#trip-end-station"),
        trip.endStation
    );

    renderSchedules(tripId);

    editor.hidden = false;

    editor.scrollIntoView({
        behavior: "smooth",
    });

    document.querySelector("#trip-name").focus();
}

/**
 * Read a text value from the editing form.
 */
function readValue(selector) {
    return document.querySelector(selector).value.trim();
}

/**
 * Save changes to an existing trip.
 */
async function saveTrip(event) {
    event.preventDefault();

    if (busy) {
        return;
    }

    const tripId = readValue("#trip-id");

    const months = readValue("#trip-operating-months")
        .split(",")
        .map((month) => Number(month.trim()));

    if (
        months.some(
            (month) =>
                !Number.isInteger(month) ||
                month < 1 ||
                month > 12
        )
    ) {
        showMessage(
            "Operating months must be integers from 1 to 12.",
            true
        );

        return;
    }

    const updates = {
        name: readValue("#trip-name"),
        description: readValue("#trip-description"),
        region: readValue("#trip-region"),
        startStation: readValue("#trip-start-station"),
        endStation: readValue("#trip-end-station"),
        duration: readValue("#trip-duration"),
        distance: Number(readValue("#trip-distance")),
        highlights: readValue("#trip-highlights")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        bestSeason: readValue("#trip-best-season"),
        operatingMonths: months,
        imageUrl: readValue("#trip-image-url"),
    };

    setBusy(true);

    try {
        const result = await requestJson(
            `/api/trips/${encodeURIComponent(tripId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
            }
        );

        trips.set(tripId, result.trip);

        renderTrips();
        editor.hidden = true;

        showMessage("Trip updated successfully.");
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        setBusy(false);
    }
}

/**
 * Delete a trip after administrator confirmation.
 */
async function deleteTrip(tripId) {
    const trip = trips.get(tripId);

    if (!trip || busy) {
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${trip.name}"?`
    );

    if (!confirmed) {
        return;
    }

    setBusy(true);

    try {
        await requestJson(
            `/api/trips/${encodeURIComponent(tripId)}`,
            {
                method: "DELETE",
            }
        );

        trips.delete(tripId);

        renderTrips();

        if (readValue("#trip-id") === tripId) {
            editor.hidden = true;
        }

        showMessage("Trip deleted successfully.");
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        setBusy(false);
    }
}

/**
 * Assign an existing schedule to the selected trip.
 */
async function assignSchedule(event) {
    event.preventDefault();

    if (busy) {
        return;
    }

    const tripId = readValue("#trip-id");

    const scheduleId = Number(
        readValue("#existing-schedule")
    );

    if (
        !Number.isInteger(scheduleId) ||
        scheduleId < 1
    ) {
        showMessage("Select a valid schedule.", true);
        return;
    }

    const confirmed = window.confirm(
        "Move this existing schedule to the selected trip?"
    );

    if (!confirmed) {
        return;
    }

    setBusy(true);

    try {
        const result = await requestJson(
            `/api/admin/schedules/${scheduleId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tripId }),
            }
        );

        schedules = schedules.map((schedule) =>
            schedule.id === scheduleId
                ? result.schedule
                : schedule
        );

        renderTrips();
        renderSchedules(tripId);

        showMessage(
            "Schedule reassigned successfully."
        );
    } catch (error) {
        showMessage(error.message, true);
    } finally {
        setBusy(false);
    }
}

/**
 * Handle Edit and Delete buttons through event delegation.
 */
tripList.addEventListener("click", (event) => {
    const button = event.target.closest(
        "button[data-action]"
    );

    if (!button || busy) {
        return;
    }

    const { action, tripId } = button.dataset;

    if (action === "edit") {
        openEditor(tripId);
    }

    if (action === "delete") {
        deleteTrip(tripId);
    }
});

editForm.addEventListener("submit", saveTrip);

scheduleForm.addEventListener(
    "submit",
    assignSchedule
);

document.querySelector("#cancel-edit")
    .addEventListener("click", () => {
        editor.hidden = true;
        showMessage("Editing cancelled.");
    });

document.querySelector("#reload-trips")
    .addEventListener("click", loadData);

loadData();
