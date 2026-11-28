const userTable = document.getElementById("users-table");
const userList = document.getElementById("users-list");
const statusMessage = document.getElementById("users-status");
const errorMessage = document.getElementById("users-error");
const retryButton = document.getElementById("users-retry");
const previousButton = document.getElementById("users-previous");
const nextButton = document.getElementById("users-next");
const pageIndicator = document.getElementById("users-page");

const filtersForm = document.getElementById("users-filters");
const roleInput = document.getElementById("users-role");
const searchInput = document.getElementById("users-search");

let currentPage = 1;
let filters = { role: "", search: "" };
let activeRequest;

async function loadUsers(page) {
    activeRequest?.abort();
    const request = new AbortController();
    activeRequest = request;
    const query = new URLSearchParams({ page });
    if (filters.role) query.set("role", filters.role);
    if (filters.search) query.set("search", filters.search);
    previousButton.disabled = true;
    nextButton.disabled = true;
    retryButton.hidden = true;
    errorMessage.hidden = true;
    userTable.hidden = true;
    pageIndicator.textContent = "";
    statusMessage.textContent = "Loading users…";

    try {
        const response = await fetch(`/api/users?${query}`, { signal: request.signal });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load users.");
        }

        if (request.signal.aborted) return;

        const { users, pagination } = data;
        currentPage = pagination.currentPage;
        userList.replaceChildren();

        for (const user of users) {
            const row = userList.insertRow();
            for (const value of [user.displayName, user.username, user.email, user.role]) {
                row.insertCell().textContent = value ?? "—";
            }
        }

        userTable.hidden = users.length === 0;
        statusMessage.textContent = users.length ? "" : "No matching users on this page.";
        if (pagination.totalPages > 0) {
            pageIndicator.textContent = `Page ${currentPage} of ${pagination.totalPages}`;
        }
        previousButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage >= pagination.totalPages;
    } catch (error) {
        if (request.signal.aborted) return;

        statusMessage.textContent = "";
        errorMessage.textContent = error.message;
        errorMessage.hidden = false;
        retryButton.hidden = false;
        retryButton.onclick = () => loadUsers(page);
    }
}

previousButton.addEventListener("click", () => loadUsers(currentPage - 1));
nextButton.addEventListener("click", () => loadUsers(currentPage + 1));
function applyFilters() {
    filters = { role: roleInput.value, search: searchInput.value.trim() };
    loadUsers(1);
}

filtersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyFilters();
});
roleInput.addEventListener("change", applyFilters);
filtersForm.addEventListener("reset", (event) => {
    event.preventDefault();
    roleInput.value = "";
    searchInput.value = "";
    applyFilters();
});
loadUsers(1);
