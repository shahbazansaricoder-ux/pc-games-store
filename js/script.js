const games = [
  {
    id: 1,
    name: "Shadow Warriors",
    category: "Action",
    price: "PKR 4,999",
    rating: 4.8,
    description:
      "An intense action-packed adventure where you fight through hordes of enemies in a dystopian future.",
    requirements: [
      "OS: Windows 10",
      "Processor: Intel Core i5",
      "Memory: 8 GB RAM",
      "Graphics: NVIDIA GTX 1060",
    ],
  },
  {
    id: 2,
    name: "Cyber Strike",
    category: "Action",
    price: "PKR 3,999",
    rating: 4.5,
    description:
      "Fast-paced cyberpunk shooter with stunning visuals and addictive gameplay.",
    requirements: [
      "OS: Windows 10",
      "Processor: Intel Core i7",
      "Memory: 16 GB RAM",
      "Graphics: NVIDIA RTX 2060",
    ],
  },
  {
    id: 3,
    name: "Battle Royale X",
    category: "Action",
    price: "PKR 2,999",
    rating: 4.7,
    description:
      "Survive in a massive battle royale with 100 players fighting for victory.",
    requirements: [
      "OS: Windows 10",
      "Processor: Intel Core i5",
      "Memory: 8 GB RAM",
      "Graphics: NVIDIA GTX 1050",
    ],
  },
  {
    id: 4,
    name: "Zombie Apocalypse",
    category: "Action",
    price: "PKR 3,499",
    rating: 4.6,
    description: "Fight for survival in a world overrun by zombies.",
    requirements: [
      "OS: Windows 10",
      "Processor: AMD Ryzen 5",
      "Memory: 8 GB RAM",
      "Graphics: AMD RX 580",
    ],
  },
  {
    id: 5,
    name: "Ninja Legends",
    category: "Action",
    price: "PKR 4,499",
    rating: 4.9,
    description:
      "Master the art of stealth and combat as a legendary ninja warrior.",
    requirements: [
      "OS: Windows 10",
      "Processor: Intel Core i5",
      "Memory: 8 GB RAM",
      "Graphics: NVIDIA GTX 1660",
    ],
  },
  {
    id: 100,
    name: "Chess Master 3D",
    category: "Strategy",
    price: "PKR 1,999",
    rating: 4.5,
    description: "Classic chess with stunning 3D graphics.",
    requirements: [
      "OS: Windows 10",
      "Processor: Intel Core i3",
      "Memory: 4 GB RAM",
      "Graphics: NVIDIA GTX 750",
    ],
  },
];

const defaultCardImage = "assets/images/img.jpeg";
const galleryImage =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80&auto=format&fit=crop";

let currentPage = 1;
let currentCategory = "all";
let searchQuery = "";
const gamesPerPage = 24;
let selectedGame = null;

function logEvent() {
  /* no-op: live console removed */
}

const starImg = `<img alt="*" width="16" height="16" style="vertical-align:-2px" src="data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path fill='%23fbbf24' d='M12 .587l3.668 7.431 8.2 1.193-5.934 5.785 1.402 8.164L12 18.896l-7.336 3.864 1.402-8.164L.132 9.211l8.2-1.193z'/></svg>">`;
function stars(r) {
  const n = Math.floor(r);
  return (
    `${starImg}`.repeat(n) + ` <span style="opacity:.9">${r.toFixed(1)}</span>`
  );
}

function filterGames() {
  let filtered = games;
  if (currentCategory !== "all") {
    filtered = filtered.filter((g) => g.category === currentCategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q),
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
        Action: "b-action",
        Adventure: "b-adventure",
        RPG: "b-rpg",
        Sports: "b-sports",
        Racing: "b-racing",
        Strategy: "b-strategy",
      }[game.category] || "b-action";

    el.innerHTML = `
        <img class="card-img" alt="${game.name}" src="${defaultCardImage}">
        <span class="badge ${badgeClass}">${game.category}</span>
        <div class="card-body">
          <div class="title">${game.name}</div>
          <div class="price">${game.price}</div>
          <div class="rating">${stars(game.rating)}</div>
        </div>`;
    el.addEventListener("click", () => openModal(game));
    grid.appendChild(el);
  });

  pag.innerHTML = "";
  const prev = document.createElement("button");
  prev.className = "page-btn";
  prev.textContent = "← Previous";
  prev.disabled = currentPage === 1;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      render();
      logEvent(`Page changed: ${currentPage}`);
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
      logEvent(`Page changed: ${currentPage}`);
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
      logEvent(`Page changed: ${currentPage}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  pag.appendChild(next);
}

function openModal(game) {
  selectedGame = game;
  const modal = document.getElementById("gameModal");
  const modalImages = document.getElementById("modalImages");
  const title = document.getElementById("modalTitle");
  const price = document.getElementById("modalPrice");
  const desc = document.getElementById("modalDescription");
  const reqUl = document.getElementById("modalRequirements");

  modalImages.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const img = document.createElement("img");
    img.className = "m-img";
    img.alt = `${game.name} Screenshot ${i + 1}`;
    img.src = galleryImage + `&t=${i}`;
    modalImages.appendChild(img);
  }

  title.textContent = game.name;
  price.textContent = game.price;
  desc.textContent = game.description;

  reqUl.innerHTML = "";
  game.requirements.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    reqUl.appendChild(li);
  });

  document.getElementById("gameModal").classList.add("active");
  document.body.style.overflow = "hidden";
  document.getElementById("gameModal").setAttribute("aria-hidden", "false");
  logEvent(`Opened: ${game.name}`);
}
function closeModal() {
  const modal = document.getElementById("gameModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
  modal.setAttribute("aria-hidden", "true");
  logEvent("Modal closed");
}
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("gameModal").addEventListener("click", (e) => {
  if (e.target.id === "gameModal") {
    closeModal();
  }
});

document.getElementById("buyBtn").addEventListener("click", () => {
  if (selectedGame) {
    const message = `I want to buy this game: ${selectedGame.name}`;
    const whatsappUrl = `https://wa.me/923156263180?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    logEvent(`Buy click: ${selectedGame.name}`);
  }
});

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  currentPage = 1;
  render();
  logEvent(`Search: "${searchQuery}"`);
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
    logEvent(`Category: ${currentCategory}`);
  });
});

render();
