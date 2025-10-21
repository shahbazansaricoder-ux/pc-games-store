const API_URL =
  new URLSearchParams(location.search).get("api") ||
  "https://YOUR_API_BASE/games";

// Keep same assets/classes
const defaultCardImage = "assets/images/img.jpeg";

const gamesPerPage = 16;

let allGames = [];
let currentPage = 1;
let currentCategory = "all";
let searchQuery = "";
let selectedGame = null;

function logEvent() {
  /* no-op */
}

const starImg =
  "<img alt=\"*\" width=\"16\" height=\"16\" style=\"vertical-align:-2px\" src=\"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path fill='%23fbbf24' d='M12 .587l3.668 7.431 8.2 1.193-5.934 5.785 1.402 8.164L12 18.896l-7.336 3.864 1.402-8.164L.132 9.211l8.2-1.193z'/></svg>\">";

function stars(r) {
  const rating = Number(r);
  if (!Number.isFinite(rating)) return "";
  const n = Math.floor(Math.max(0, Math.min(5, rating)));
  return (
    starImg.repeat(n) +
    ' <span style="opacity:.9">' +
    rating.toFixed(1) +
    "</span>"
  );
}

function normalizeGame(raw) {
  // Map API fields to UI-friendly structure; keep classes/markup unchanged
  const priceText =
    typeof raw.price === "number"
      ? "PKR " + raw.price.toLocaleString("en-PK")
      : raw.price ?? "PKR —";

  const reqList = Array.isArray(raw.requirements)
    ? raw.requirements
    : typeof raw.systemRequirements === "string"
    ? raw.systemRequirements
        .split(/\n|,|;|\r/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const thumbs = [];
  if (raw.screenshots && Array.isArray(raw.screenshots))
    thumbs.push(...raw.screenshots.filter(Boolean));
  if (raw.screenshot) thumbs.push(raw.screenshot);
  if (raw.thumbnail) thumbs.push(raw.thumbnail);

  return {
    id: raw._id || raw.id || crypto.randomUUID?.() || String(Math.random()),
    name: raw.name || raw.title || "Untitled",
    category: raw.category || "Action",
    price: priceText,
    rating: raw.rating,
    description: raw.description || "",
    requirements: reqList,
    thumbnail: raw.thumbnail || raw.image || defaultCardImage,
    gallery: thumbs.length ? thumbs : [defaultCardImage],
    createdAt: raw.createdAt || raw.uploadDate || raw.date || null, // store upload date if exists
  };
}

async function fetchGames() {
  try {
    const res = await fetch(
      `https://spark-games-backend.vercel.app/api/get-all`,
      {
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) throw new Error("Failed to fetch: " + res.status);
    const data = await res.json();

    // Accept both array or { games: [...] } shapes
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.games)
      ? data.games
      : [];
    allGames = list.map(normalizeGame);
  } catch (err) {
    console.error("[v0] API error:", err);
    allGames = [];
  }
}

function nervestFilter() {
  allGames.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB - dateA; // newest → oldest
  });
  logEvent("Games filtered by newest uploads");
}

function filterGames() {
  let filtered = allGames;
  if (currentCategory !== "all") {
    filtered = filtered.filter(
      (g) =>
        String(g.category).toLowerCase() ===
        String(currentCategory).toLowerCase()
    );
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        String(g.category).toLowerCase().includes(q)
    );
  }
  return filtered;
}

function render() {
  const filtered = filterGames();
  const grid = document.getElementById("gamesGrid");
  const pag = document.getElementById("pagination");
  grid.innerHTML = "";

  if (filtered.length === 0) {
    pag.style.display = "none";
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Game not found";
    grid.appendChild(empty);
    return;
  } else {
    pag.style.display = "";
  }

  const totalPages = Math.ceil(filtered.length / gamesPerPage) || 1;
  currentPage = Math.min(currentPage, totalPages);
  const startIndex = (currentPage - 1) * gamesPerPage;
  const items = filtered.slice(startIndex, startIndex + gamesPerPage);

  items.forEach((game) => {
    const el = document.createElement("div");
    el.className = "card";
    const badgeClass =
      {
        action: "b-action",
        adventure: "b-adventure",
        rpg: "b-rpg",
        sports: "b-sports",
        racing: "b-racing",
        strategy: "b-strategy",
      }[String(game.category).toLowerCase()] || "b-action";

    const ratingHtml = stars(game.rating);
    el.innerHTML = `
          <img class="card-img" alt="${game.name}" src="${
      game.thumbnail || defaultCardImage
    }">
          <span class="badge ${badgeClass}">${game.category}</span>
          <div class="card-body">
            <div class="title">${game.name}</div>
            <div class="price">${game.price}</div>
            <div class="rating">${ratingHtml}</div>
          </div>
        `;
    el.addEventListener("click", () => openModal(game));
    grid.appendChild(el);
  });

  // Pagination
  pag.innerHTML = "";
  const prev = document.createElement("button");
  prev.className = "page-btn";
  prev.textContent = "← Previous";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      logEvent("Page changed: " + currentPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  pag.appendChild(prev);

  const totalPagesToShow = Math.ceil(filtered.length / gamesPerPage);
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPagesToShow, currentPage + 2);
  for (let i = start; i <= end; i++) {
    const b = document.createElement("button");
    b.className = "page-btn" + (i === currentPage ? " active" : "");
    b.textContent = i;
    b.onclick = () => {
      currentPage = i;
      render();
      logEvent("Page changed: " + currentPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    pag.appendChild(b);
  }

  const next = document.createElement("button");
  next.className = "page-btn";
  next.textContent = "Next →";
  next.disabled = currentPage === totalPagesToShow;
  next.onclick = () => {
    if (currentPage < totalPagesToShow) {
      currentPage++;
      render();
      logEvent("Page changed: " + currentPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  pag.appendChild(next);
}

function openModal(game) {
  selectedGame = game;
  const modalImages = document.getElementById("modalImages");
  const title = document.getElementById("modalTitle");
  const price = document.getElementById("modalPrice");
  const desc = document.getElementById("modalDescription");
  const reqUl = document.getElementById("modalRequirements");

  modalImages.innerHTML = "";
  const imgs = game.gallery.slice(0, 4);
  (imgs.length ? imgs : [game.thumbnail || defaultCardImage]).forEach(
    (src, i) => {
      const img = document.createElement("img");
      img.className = "m-img";
      img.alt = game.name + " Screenshot " + (i + 1);
      img.src = src;
      modalImages.appendChild(img);
    }
  );

  title.textContent = game.name;
  price.textContent = game.price;
  desc.textContent = game.description || "—";
  reqUl.textContent = game.requirements || "—";

  const modal = document.getElementById("gameModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  modal.setAttribute("aria-hidden", "false");
  logEvent("Opened: " + game.name);
}

function closeModal() {
  const modal = document.getElementById("gameModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  modal.setAttribute("aria-hidden", "true");
  logEvent("Modal closed");
}

// Wire up events
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("gameModal").addEventListener("click", (e) => {
    if (e.target && e.target.id === "gameModal") closeModal();
  });

  document.getElementById("buyBtn").addEventListener("click", () => {
    if (selectedGame) {
      const message = "I want to buy this game: " + selectedGame.name;
      const whatsappUrl =
        "https://wa.me/923156263180?text=" + encodeURIComponent(message);
      window.open(whatsappUrl, "_blank");
      logEvent("Buy click: " + selectedGame.name);
    }
  });

  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    currentPage = 1;
    render();
    logEvent('Search: "' + searchQuery + '"');
  });

  document.querySelectorAll("#categories .cat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#categories .cat-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.category;
      currentPage = 1;
      render();
      logEvent("Category: " + currentCategory);
    });
  });

  // 🧩 Fetch games, sort by newest, then render
  await fetchGames();
  nervestFilter();
  render();
});
