// js/product.js — detalle de producto robusto y sincronizado
import { getParam } from './paths.js';
import { loadJSONWithCandidates } from './load-json.js';

(function () {
  // === Contador global del carrito ===
  function getCartCountFromStorage() {
    try {
      return (JSON.parse(localStorage.getItem("cart")) || [])
        .reduce((s, i) => s + (Number(i.quantity ?? i.cantidad ?? 0)), 0);
    } catch { return 0; }
  }

  function updateCartCount() {
    const el = document.getElementById("cart-count");
    if (el) el.textContent = getCartCountFromStorage();
  }

  addEventListener("load", updateCartCount);
  addEventListener("storage", (e) => { if (e.key === "cart") updateCartCount(); });
})();

(async function () {
  const id = getParam('id');
  const cat = (getParam('cat') || '').toLowerCase();
  const jsonParam = getParam('json'); // Ej: pages/bedroom/bedroom.json

  const root = document.getElementById('product-detail');
  const loading = document.getElementById('pd-loading');

  if (!id) {
    root.innerHTML = `<p style="color:red">Falta parámetro id</p>`;
    return;
  }

  // Posibles JSON a cargar
  const candidates = [
    jsonParam,
    cat ? `pages/${cat}/${cat}.json` : null,
    cat ? `${cat}.json` : null,
    cat ? `pages/${cat}.json` : null,
  ].filter(Boolean);

  try {
    const data = await loadJSONWithCandidates(...candidates);
    const items = Array.isArray(data) ? data : [];
    const product = items.find(p => String(p.id) === String(id));

    if (!product) {
      root.innerHTML = `<p style="color:red">Producto con id=${id} no encontrado.</p>`;
      return;
    }

    // Imagen principal
    const firstImage =
      (Array.isArray(product.images) && product.images[0]) ||
      product.image || product.img || '';

    const backHref = cat ? `pages/${cat}/${cat}.html` : 'index.html';

    root.innerHTML = `
      <section class="product">
        <a href="${backHref}" class="back">← Continue Browsing</a>
        <div class="media">
          <img src="${firstImage}" alt="${(product.name || '').replace(/"/g,'&quot;')}" />
        </div>
        <div class="info">
          <h1>${product.name || 'Producto'}</h1>
          <p class="price">${product.price ? `$${Number(product.price).toFixed(2)}` : ''}</p>
          <p>${product.description || ''}</p>

          <div class="options">
            <label for="qty">Quantity:</label>
            <input id="qty" type="number" value="1" min="1" />
          </div>

          <div class="product-buttons">
            <button id="add-to-cart">🛒 Add to Cart</button>
            <button id="buy-now">⚡ Buy Now</button>
          </div>
        </div>
      </section>
    `;

    const addBtn = document.getElementById('add-to-cart');
    const buyBtn = document.getElementById('buy-now');

    function getQty() {
      const v = Number(document.getElementById('qty')?.value || 1);
      return Number.isFinite(v) && v > 0 ? v : 1;
    }

    // === Función unificada: agrega según el tipo de sesión ===
    async function addToCartUnified(prod, quantity) {
      const item = {
        id: prod.id,
        name: prod.name || 'Unknown',
        price: Number(prod.price || 0),
        image: firstImage || '',
        quantity
      };

      // 🔹 Si hay usuario logueado y existe FB.addToCart, usa Firestore
      const loggedUser = window.FB?.auth?.currentUser;
      const canUseFirebase = loggedUser && typeof window.FB?.addToCart === 'function';

      if (canUseFirebase) {
        try {
          await FB.addToCart(item);
          console.log("🟢 Agregado a Firestore:", item);
        } catch (err) {
          console.warn("Error al agregar en Firestore:", err);
          alert("Error agregando al carrito remoto: " + (err.message || err));
        }
      } else {
        // 🔸 Invitado: usa localStorage
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const idx = cart.findIndex(p => String(p.id) === String(item.id));
        if (idx !== -1) cart[idx].quantity = Number(cart[idx].quantity || 0) + item.quantity;
        else cart.push(item);
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log("🟠 Agregado a carrito local:", item);
      }

      // 🔹 Actualiza el contador global del header
      if (window.updateCartCount) window.updateCartCount();
    }

    addBtn?.addEventListener('click', async () => {
      try {
        await addToCartUnified(product, getQty());
        alert('Added to cart ✅');
      } catch (e) {
        console.error(e);
        alert('Error adding to cart: ' + (e.message || e));
      }
    });

    buyBtn?.addEventListener('click', async () => {
      try {
        await addToCartUnified(product, getQty());
        location.href = 'cart.html';
      } catch (e) {
        console.error(e);
        alert('Error: ' + (e.message || e));
      }
    });

  } catch (e) {
    console.error(e);
    root.innerHTML = `<p style="color:red">Error cargando detalle: ${e.message}</p>`;
  } finally {
    loading?.remove();
  }
})();