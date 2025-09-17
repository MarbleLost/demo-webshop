const PRODUCTS = {
  apple: { name: "Apple", emoji: "🍏" },
  banana: { name: "Banana", emoji: "🍌" },
  lemon: { name: "Lemon", emoji: "🍋" },
};

function getBasket() {
  const raw = localStorage.getItem("basket");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    // Backwards compatibility: if old format (array of product ids), convert to map
    if (Array.isArray(parsed)) {
      const map = {};
      parsed.forEach((p) => {
        map[p] = (map[p] || 0) + 1;
      });
      return map;
    }
    // Otherwise expect an object map { productId: quantity, ... }
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e) {
    return {};
  }
}

function saveBasket(map) {
  localStorage.setItem("basket", JSON.stringify(map));
}

function addToBasket(product) {
  const basket = getBasket();
  basket[product] = (basket[product] || 0) + 1;
  saveBasket(basket);
}

function clearBasket() {
  localStorage.removeItem("basket");
}

function renderBasket() {
  const basket = getBasket();
  const basketList = document.getElementById("basketList");
  const cartButtonsRow = document.querySelector(".cart-buttons-row");
  if (!basketList) return;
  basketList.innerHTML = "";
  const entries = Object.entries(basket).filter(([, qty]) => qty > 0);
  if (entries.length === 0) {
    basketList.innerHTML = "<li>No products in basket.</li>";
    if (cartButtonsRow) cartButtonsRow.style.display = "none";
    return;
  }
  entries.forEach(([product, qty]) => {
    const item = PRODUCTS[product];
    if (item) {
      const li = document.createElement("li");
      li.innerHTML = `<span class='basket-emoji'>${item.emoji}</span> <span>${qty}x ${item.name}</span>`;
      basketList.appendChild(li);
    }
  });
  if (cartButtonsRow) cartButtonsRow.style.display = "flex";
}

function renderBasketIndicator() {
  const basket = getBasket();
  const total = Object.values(basket).reduce((s, q) => s + (q || 0), 0);
  let indicator = document.querySelector(".basket-indicator");
  if (!indicator) {
    const basketLink = document.querySelector(".basket-link");
    if (!basketLink) return;
    indicator = document.createElement("span");
    indicator.className = "basket-indicator";
    basketLink.appendChild(indicator);
  }
  if (total > 0) {
    indicator.textContent = total;
    indicator.style.display = "flex";
  } else {
    indicator.style.display = "none";
  }
}

// Call this on page load and after basket changes
if (document.readyState !== "loading") {
  renderBasketIndicator();
} else {
  document.addEventListener("DOMContentLoaded", renderBasketIndicator);
}

// Patch basket functions to update indicator and visible basket (if present)
const origAddToBasket = window.addToBasket;
window.addToBasket = function (product) {
  // If there was an existing global, call it for compatibility, otherwise use the new implementation
  if (typeof origAddToBasket === "function") {
    origAddToBasket(product);
    // origAddToBasket may have stored an array; ensure our format is normalized
    const normalized = getBasket();
    saveBasket(normalized);
  } else {
    addToBasket(product);
  }
  renderBasketIndicator();
  renderBasket();
};
const origClearBasket = window.clearBasket;
window.clearBasket = function () {
  if (typeof origClearBasket === "function") {
    origClearBasket();
  } else {
    clearBasket();
  }
  renderBasketIndicator();
  renderBasket();
};
