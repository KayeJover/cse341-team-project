
const loadBookings = async () => {
    const listEl = document.getElementById("bookings-list");
    const templateEl = document.getElementById("booking-row-template");
    const loadingEl = document.getElementById("bookings-loading");
    const errorEl = document.getElementById("bookings-error");

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch("/api/bookings");

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = payload.bookings || [];

        const totalEl = document.getElementById("total-bookings");
        const confirmedEl = document.getElementById("confirmed-bookings");

        if (totalEl) {
            totalEl.textContent = bookings.length;
        }

        if (confirmedEl) {
            confirmedEl.textContent = bookings.filter(
                (booking) => booking.status === "confirmed"
            ).length;
        }

        if (bookings.length === 0) {
            listEl.innerHTML = `
                <tr>
                    <td colspan="8">No bookings found.</td>
                </tr>
            `;
        } else {
            const fragment = document.createDocumentFragment();

            bookings.forEach((booking) => {
                const row = templateEl.content.cloneNode(true);

                row.querySelector('[data-field="id"]').textContent =
                    booking.id || "N/A";

                row.querySelector('[data-field="schedule"]').textContent =
                    booking.scheduleId ?? "N/A";

                row.querySelector('[data-field="trip"]').textContent =
                    booking.tripId || "N/A";

                row.querySelector('[data-field="passengers"]').textContent =
                    booking.passengers?.length ?? 0;

                row.querySelector('[data-field="ticket-class"]').textContent =
                    booking.ticketClass || "N/A";

                row.querySelector('[data-field="amount"]').textContent =
                    booking.totalAmount != null
                        ? `₹${Number(booking.totalAmount).toFixed(2)}`
                        : "N/A";

                row.querySelector('[data-field="status"]').textContent =
                    booking.status || "N/A";

                row.querySelector('[data-field="created"]').textContent =
                    booking.createdAt
                        ? new Date(booking.createdAt).toLocaleDateString()
                        : "N/A";

                fragment.appendChild(row);
            });

            listEl.replaceChildren(fragment);
        }

        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        console.error("Error loading bookings:", error);

        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
                "Unable to load bookings right now. Please try again.";
        }
    }
};

document.addEventListener("DOMContentLoaded", loadBookings);
