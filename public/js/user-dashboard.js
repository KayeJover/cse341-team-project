
document.addEventListener("DOMContentLoaded", async () => {
    const bookingsContainer = document.getElementById("my-bookings");

    if (!bookingsContainer) return;

    try {
        const response = await fetch("/api/bookings");

        if (!response.ok) {
            throw new Error("Unable to retrieve bookings.");
        }

        const data = await response.json();
        const bookings = data.bookings;

        bookingsContainer.replaceChildren();

        if (!bookings || bookings.length === 0) {
            const message = document.createElement("p");
            message.textContent = "You don't have any bookings yet.";
            bookingsContainer.appendChild(message);
            return;
        }

        bookings.forEach((booking) => {
            const card = document.createElement("article");
            card.className = "booking-card";

            const heading = document.createElement("h3");
            heading.textContent = `Booking: ${booking.id}`;
            card.appendChild(heading);

            const details = {
                Trip: booking.tripId,
                "Travel Day": booking.selectedDay,
                "Ticket Class": booking.ticketClass,
                Passengers: Array.isArray(booking.passengers)
                    ? booking.passengers
                        .map((p) => `${p.firstName} ${p.lastName}`)
                        .join(", ")
                    : "Not available",
                "Total Amount": booking.totalAmount,
                Status: booking.status,
            };

            Object.entries(details).forEach(([label, value]) => {
                const paragraph = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = `${label}: `;
                paragraph.appendChild(strong);
                paragraph.appendChild(
                    document.createTextNode(String(value ?? ""))
                );

                card.appendChild(paragraph);
            });

            bookingsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Dashboard error:", error);

        const message = document.createElement("p");
        message.textContent =
            "Unable to load your bookings. Please try again later.";

        bookingsContainer.replaceChildren(message);
    }
});
