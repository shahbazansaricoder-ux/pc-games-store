const API_BASE_URL = "http://localhost:5000/api"; // Change this to your actual API URL

// Session guard
(function guard() {
  const sessionRaw = localStorage.getItem("adminSession");
  if (!sessionRaw) {
    window.location.replace("admin-login.html");
  }
})();

let allGames = []; // Store fetched games in memory

// Fetch all games from API
async function fetchGames() {
  try {
    const response = await fetch(
      `https://spark-games-backend.vercel.app/api/get-all`,
    );
    const data = await response.json();

    if (data.success) {
      // Convert API response to internal format
      allGames = data.games.map((g) => ({
        id: g._id,
        name: g.name,
        price: g.price,
        category: g.category,
        description: g.description,
        system: g.systemRequirements,
        thumbUrl: g.thumbnail,
        thumbnail: g.thumbnail,
        screenshotUrl: g.screenshot,
        createdAt: new Date(g.createdAt).getTime(),
      }));
      return allGames;
    } else {
      throw new Error(data.message || "Failed to fetch games");
    }
  } catch (error) {
    console.error("Error fetching games:", error);
    alert("Failed to load games. Please check your API connection.");
    return [];
  }
}

// Add game via API
async function addGameAPI(gameData) {
  try {
    const response = await fetch(
      "https://spark-games-backend.vercel.app/api/add",
      {
        // ✅ Correct URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gameData),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Raw response:", text);
      throw new Error("Server returned an error response");
    }

    const data = await response.json();

    if (data.success) {
      alert("Game added successfully!");
      return true;
    } else {
      throw new Error(data.message || "Failed to add game");
    }
  } catch (error) {
    console.error("Error adding game:", error);
    alert("Failed to add game: " + error.message);
    return false;
  }
}

// Delete game via API
async function deleteGameAPI(id) {
  try {
    const response = await fetch(
      `https://spark-games-backend.vercel.app/api/delete/${id}`,
      {
        method: "DELETE",
      },
    );

    const data = await response.json();

    if (data.success) {
      return true;
    } else {
      throw new Error(data.message || "Failed to delete game");
    }
  } catch (error) {
    console.error("Error deleting game:", error);
    alert("Failed to delete game: " + error.message);
    return false;
  }
}

const esc = (s = "") =>
  ("" + s).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );

// Elements
const tbody = document.getElementById("tbody");
const emptyEl = document.getElementById("empty");
const loadingEl = document.getElementById("loading");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const catButtons = Array.from(document.querySelectorAll(".cat-btn"));
const logoutBtn = document.getElementById("logoutBtn");

// Add modal elements
const addModal = document.getElementById("addModal");
const openAdd = document.getElementById("openAdd");
const closeAdd = document.getElementById("closeAdd");
const cancelAdd = document.getElementById("cancelAdd");
const gameForm = document.getElementById("gameForm");
const submitBtn = document.getElementById("submitBtn");

// View modal elements
const viewModal = document.getElementById("viewModal");
const closeView = document.getElementById("closeView");
const closeView2 = document.getElementById("closeView2");
const vShot = document.getElementById("vShot");
const vName = document.getElementById("vName");
const vCat = document.getElementById("vCat");
const vPrice = document.getElementById("vPrice");
const vDown = document.getElementById("vDown");
const vDesc = document.getElementById("vDesc");
const vSys = document.getElementById("vSys");

// State
let state = { search: "", category: "all", sort: "newest" };

// Modal helpers
function openModal(el) {
  el.classList.add("open");
  el.setAttribute("aria-hidden", "false");
}
function closeModal(el) {
  el.classList.remove("open");
  el.setAttribute("aria-hidden", "true");
}

openAdd.addEventListener("click", () => openModal(addModal));
closeAdd.addEventListener("click", () => closeModal(addModal));
cancelAdd.addEventListener("click", () => closeModal(addModal));
addModal.addEventListener("click", (e) => {
  if (e.target === addModal) closeModal(addModal);
});

closeView.addEventListener("click", () => closeModal(viewModal));
closeView2.addEventListener("click", () => closeModal(viewModal));
viewModal.addEventListener("click", (e) => {
  if (e.target === viewModal) closeModal(viewModal);
});

gameForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("gname").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const category = document.getElementById("category").value;
  const desc = document.getElementById("desc").value.trim();
  const sys = document.getElementById("sys").value.trim();
  const download = document.getElementById("download").value.trim();
  const thumbUrl = document.getElementById("thumbUrl").value.trim();
  const shotUrl = document.getElementById("shotUrl").value.trim();

  if (
    !name ||
    !(price >= 0) ||
    !category ||
    !desc ||
    !sys ||
    !download ||
    !thumbUrl ||
    !shotUrl
  ) {
    alert("Please fill all fields correctly.");
    return;
  }

  // Disable submit button during API call
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  const gameData = {
    name,
    price,
    category,
    description: desc,
    systemRequirements: sys,
    downloadLink: download,
    thumbnail: thumbUrl,
    screenshot: shotUrl,
  };

  const success = await addGameAPI(gameData);

  if (success) {
    gameForm.reset();
    closeModal(addModal);
    // Reload games from API
    await loadAndRender();
  }

  // Re-enable submit button
  submitBtn.disabled = false;
  submitBtn.textContent = "Save Game";
});

async function deleteGame(id) {
  if (!confirm("Are you sure you want to delete this game?")) {
    return;
  }

  const success = await deleteGameAPI(id);
  if (success) {
    // Reload games from API
    await loadAndRender();
  }
}

// View game
function viewGame(id) {
  const g = allGames.find((x) => x.id === id);
  if (!g) return;

  // ✅ Image priority: thumbnail > screenshot > placeholder
  vShot.src =
    g.thumbnail || g.screenshotUrl || g.thumbUrl || "/public/placeholder.jpg";
  vShot.alt = "Screenshot of " + (g.name || "game");

  // ✅ Basic info
  vName.textContent = g.name || "Unknown Game";
  vCat.textContent = g.category || "N/A";
  vPrice.textContent = "Rs " + (Number(g.price) || 0).toFixed(2);
  vDown.href = g.download || "#";

  // ✅ Description limit to 200 words
  const fullDesc = g.description || "";
  const maxWords = 50;
  const descWords = fullDesc.trim().split(/\s+/);
  vDesc.textContent =
    descWords.length > maxWords
      ? descWords.slice(0, maxWords).join(" ") + "..."
      : fullDesc;

  // ✅ System requirements limit (optional)
  const fullSys = g.system || "";
  const sysWords = fullSys.trim().split(/\s+/);
  vSys.textContent =
    sysWords.length > maxWords
      ? sysWords.slice(0, maxWords).join(" ") + "..."
      : fullSys;

  openModal(viewModal);
}

// Filters
searchInput.addEventListener("input", (e) => {
  state.search = (e.target.value || "").toLowerCase();
  render();
});
sortSelect.addEventListener("change", (e) => {
  state.sort = e.target.value;
  render();
});
catButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    catButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.category = btn.dataset.category;
    render();
  });
});

// Logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminSession");
  window.location.replace("admin-login.html");
});

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Link copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
}

function render() {
  let list = [...allGames];

  if (state.category !== "all") {
    list = list.filter((g) => g.category === state.category);
  }
  if (state.search) {
    list = list.filter((g) =>
      (g.name || "").toLowerCase().includes(state.search),
    );
  }
  list.sort((a, b) =>
    state.sort === "newest"
      ? b.createdAt - a.createdAt
      : a.createdAt - b.createdAt,
  );

  loadingEl.style.display = "none";

  if (list.length === 0) {
    tbody.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  } else {
    emptyEl.style.display = "none";
  }

  const rows = [];
  for (const g of list) {
    const thumb = esc(g.thumbUrl || g.thumbnail || "");
    rows.push(`
          <tr>
            <td><img class="thumb" src="${thumb || "/public/placeholder.jpg"}" alt="${esc(g.name)} thumbnail" /></td>
            <td><div class="name">${esc(g.name)}</div></td>
            <td>Rs ${Number(g.price).toFixed(2)}</td>
            <td>${esc(g.category)}</td>
            <td>
              <div class="row-actions">
                <button class="btn-ghost" data-view="${g.id}">View</button>
                <button class="btn-danger" data-del="${g.id}">Delete</button>
              </div>
            </td>
          </tr>
        `);
  }
  tbody.innerHTML = rows.join("");

  // bind actions
  tbody.querySelectorAll("[data-del]").forEach((el) => {
    el.addEventListener("click", () => deleteGame(el.getAttribute("data-del")));
  });
  tbody.querySelectorAll("[data-view]").forEach((el) => {
    el.addEventListener("click", () => viewGame(el.getAttribute("data-view")));
  });
}

async function loadAndRender() {
  loadingEl.style.display = "block";
  emptyEl.style.display = "none";
  tbody.innerHTML = "";

  await fetchGames();
  render();
}

loadAndRender();
