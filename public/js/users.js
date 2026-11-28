const userTable = document.getElementById("users-table");
const userList = document.getElementById("users-list");
const statusMessage = document.getElementById("users-status");
const errorMessage = document.getElementById("users-error");
const retryButton = document.getElementById("users-retry");
const previousButton = document.getElementById("users-previous");
const nextButton = document.getElementById("users-next");
const pageIndicator = document.getElementById("users-page");

let currentPage = 1;

async function loadUsers(page) {
    previousButton.disabled = true;
    nextButton.disabled = true;
    retryButton.hidden = true;
    errorMessage.hidden = true;
    userTable.hidden = true;
    pageIndicator.textContent = "";
    statusMessage.textContent = "Loading users…";

    try {
        const response = await fetch(`/api/users?page=${page}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to load users.");
        }

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
        statusMessage.textContent = users.length ? "" : "No users on this page.";
        if (pagination.totalPages > 0) {
            pageIndicator.textContent = `Page ${currentPage} of ${pagination.totalPages}`;
        }
        previousButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage >= pagination.totalPages;
    } catch (error) {
        statusMessage.textContent = "";
        errorMessage.textContent = error.message;
        errorMessage.hidden = false;
        retryButton.hidden = false;
        retryButton.onclick = () => loadUsers(page);
    }
}

previousButton.addEventListener("click", () => loadUsers(currentPage - 1));
nextButton.addEventListener("click", () => loadUsers(currentPage + 1));
loadUsers(1);
