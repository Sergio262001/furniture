// js/site-header.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Pequeño CSS (auto-inyectado, para no tocar style.css si no quieres)
(function injectCSS(){
  if (document.getElementById("site-header-css")) return;
  const css = `
  .sh-wrap{position:sticky;top:0;background:#fff;border-bottom:1px solid #e5e7eb;z-index:100}
  .sh{max-width:1200px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:12px}
  .sh a{color:#111827;text-decoration:none}
  .sh-left{display:flex;align-items:center;gap:12px}
  .sh-logo{display:flex;align-items:center;gap:8px;font-weight:700}
  .sh-nav{display:flex;gap:12px;margin-left:12px;flex-wrap:wrap}
  .sh-right{margin-left:auto;display:flex;align-items:center;gap:12px}
  .sh-cart{display:flex;align-items:center;gap:4px;border:1px solid #e5e7eb;border-radius:999px;padding:6px 10px}
  .sh-count{min-width:18px;height:18px;border-radius:9px;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:.78rem;padding:0 6px}
  .sh-btn{border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:8px 12px;cursor:pointer}
  .sh-menu{position:relative}
  .sh-userbtn{display:flex;align-items:center;gap:8px}
  .sh-ava{width:28px;height:28px;border-radius:999px;object-fit:cover;border:1px solid #e5e7eb}
  .sh-dd{display:none;position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.08);min-width:180px}
  .sh-item{display:block;width:100%;text-align:left;background:#fff;border:0;cursor:pointer;padding:10px 12px}
  .sh-item:hover{background:#f9fafb}
  @media (max-width:720px){ .sh-nav{display:none} }
  `;
  const style = document.createElement("style");
  style.id = "site-header-css";
  style.textContent = css;
  document.head.appendChild(style);
})();

const root = document.getElementById("site-header");
(function renderInlineMenu(){
  const topRight = document.querySelector(".top-bar > div:last-of-type");
  const target = topRight || root || document.body;
  if (!document.getElementById("sh-inline-css")) {
    const style = document.createElement("style");
    style.id = "sh-inline-css";
    style.textContent = `
      .sh-dd .sh-item{color:#111 !important}
      .sh-dd .sh-item:hover{background:#f4f4f5}

      .sh-inline{position:relative;display:inline-block;margin-left:8px}
      .sh-userbtn{display:inline-flex;align-items:center;gap:4px;background:transparent;border:0;border-radius:999px;padding:2px 6px;cursor:pointer}
      .sh-ava{width:20px;height:20px;border-radius:50%;object-fit:cover}
      .sh-dd{display:none;position:absolute;right:0;top:calc(100% + 8px);background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.08);min-width:160px;z-index:1000}
      .sh-item{display:block;width:100%;text-align:left;background:#fff;border:0;cursor:pointer;padding:8px 10px}
      .sh-item:hover{background:#f9fafb}
      .muted{opacity:.9;font-size:12px;color:#fff}
      .sh-userbtn span{display:none}
      @media (max-width:720px){ .sh-userbtn span{display:none} }
    `;
    document.head.appendChild(style);
  }
  const holder = document.createElement("div");
  holder.className = "sh-inline";
  holder.innerHTML = `
    <div id="shMenu" class="sh-menu" style="display:none">
      <button id="shUserBtn" class="sh-userbtn" type="button" aria-haspopup="menu" aria-expanded="false">
        <img id="shAva" class="sh-ava" src="img/avatar-default.png" alt=""/>
        <span id="shName" class="muted">Account</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M5 7l5 5 5-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <div id="shDD" class="sh-dd" role="menu" aria-label="User menu">
        <a href="account.html" class="sh-item" role="menuitem">My Account</a>
        <a href="security.html" class="sh-item" role="menuitem">Security</a>
</div>
    </div>
  `;
  target.appendChild(holder);
})();

// === Wiring ===
const el = {
  cartCountLegacy: document.getElementById("cart-count"),
  login: document.getElementById("shLogin"),
  menu: document.getElementById("shMenu"),
  btn: document.getElementById("shUserBtn"),
  dd: document.getElementById("shDD"),
  logout: document.getElementById("shLogout"),
  ava: document.getElementById("shAva"),
  name: document.getElementById("shName"),
  count: document.getElementById("shCartCount"),
};

// Espera a que window.FB exista (por si algún HTML invierte el orden accidentalmente)
function waitForFB() {
  return new Promise((resolve) => {
    const t = setInterval(() => {
      if (window.FB && window.FB.auth && window.FB.db) { clearInterval(t); resolve(window.FB); }
    }, 30);
    setTimeout(() => { clearInterval(t); resolve(window.FB || null); }, 3000);
  });
}

(async () => {
  const FB = await waitForFB();
  if (!FB) return; // sin firebase.js

  const { auth, db, onCartSnapshot, logout } = FB;

  // Dropdown
  el?.btn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = el.dd.style.display === "block";
    el.dd.style.display = open ? "none" : "block";
    el.btn.setAttribute("aria-expanded", open ? "false" : "true");
  });
  document.addEventListener("click", () => {
    if (!el?.dd) return;
    el.dd.style.display = "none";
    el.btn?.setAttribute("aria-expanded", "false");
  });
  el?.logout?.addEventListener("click", async () => {
    try { await logout(); } finally { location.href = "index.html"; }
  });

  // Auth + UI
  let unsubCart = null;
  onAuthStateChanged(auth, (user) => {
    // Reset UI
    if (unsubCart) { unsubCart(); unsubCart = null; }
    if (el.count) el.count.textContent = "0";

    if (!user) {
      if (el.menu)  el.menu.style.display = "none";
      if (el.login) el.login.style.display = "";
      return;
    }

    // Usuario logueado
    const photo = user.photoURL || "img/avatar-default.png";
    if (el.ava)  el.ava.src = photo;
    if (el.name) el.name.textContent = user.displayName || user.email || "Account";
    if (el.menu)  el.menu.style.display = "";
    if (el.login) el.login.style.display = "none";

    // Carrito en tiempo real
    if (typeof onCartSnapshot === "function") {
      unsubCart = onCartSnapshot((items) => {
        const n = Array.isArray(items) ? items.length : 0;
        if (el.count) el.count.textContent = String(n);
        if (el.cartCountLegacy) el.cartCountLegacy.textContent = String(n);
      });
    } else {
      // fallback: doc + onSnapshot directo (por si no está el helper)
      const ref = doc(db, "carts", user.uid);
      unsubCart = onSnapshot(ref, (snap) => {
        const items = snap.exists() ? (snap.data().items || []) : [];
        if (el.count) el.count.textContent = String(items.length);
        if (el.cartCountLegacy) el.cartCountLegacy.textContent = String(items.length);
      });
    }
  });
})();
// NAV: on click avatar button, go to account.html
document.addEventListener('click', function(e){
  const b = e.target.closest && e.target.closest('#shUserBtn');
  if (b) {
    // If you prefer dropdown instead on desktop, comment the next line:
    location.href = 'account.html';
  }
});
