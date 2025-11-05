// js/site-header.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc, onSnapshot,
  getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

/* ============ CSS inline (no cambia tu style.css) ============ */
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

/* ============ Helpers ============ */
// Base path para /, /pages/* y GitHub Pages (/furniture/*)
function shBasePath() {
  const m = location.pathname.match(/^\/(\w+)\//);
  const repoPrefix = m ? '/' + m[1] + '/' : '/';
  return repoPrefix;
}

// Badge global del carrito (usa quantity || cantidad)
window.updateCartCount = function() {
  try {
    const cart  = JSON.parse(localStorage.getItem('cart')||'[]');
    const count = cart.reduce((s,i)=> s + (Number(i.quantity ?? i.cantidad ?? 0)), 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = String(count);
  } catch {}
};
window.addEventListener('storage', (e)=>{ if(e.key==='cart') window.updateCartCount(); });
try { window.updateCartCount(); } catch {}

/* 🔒 Fusiona local -> Firestore UNA SOLA VEZ por usuario (candado persistente) */
async function mergeLocalCartToFirestore(FB) {
  try {
    const u = FB?.auth?.currentUser;
    if (!u) return;

    const lockKey = `CART_MERGED_ONCE_${u.uid}`; // candado persistente
    if (localStorage.getItem(lockKey) === '1') return;

    let local = [];
    try { local = JSON.parse(localStorage.getItem('cart') || '[]'); } catch {}
    const localCount = Array.isArray(local)
      ? local.reduce((s,i)=> s + Number(i.quantity ?? i.cantidad ?? 0), 0)
      : 0;

    if (!localCount) { localStorage.setItem(lockKey, '1'); return; }

    const ref = doc(FB.db, "carts", u.uid);
    const snap = await getDoc(ref);
    const remote = snap.exists() ? (snap.data().items || []) : [];
    const remoteCount = remote.reduce((s,i)=> s + Number(i.quantity ?? i.cantidad ?? 0), 0);

    // Si Firestore ya tiene cosas, no mergeamos (evita duplicados)
    if (remoteCount > 0) {
      localStorage.setItem(lockKey, '1');
      return;
    }

    // Subimos local (Firestore estaba vacío)
    await setDoc(ref, { items: local, updatedAt: serverTimestamp() });

    // Rompe ciclo: limpia local y marca candado
    localStorage.setItem('cart', '[]');
    localStorage.setItem(lockKey, '1');
  } catch (err) {
    console.warn("mergeLocalCartToFirestore error", err);
  }
}

/* ============ Render mini menú del avatar en la top-bar ============ */
(function renderInlineMenu(){
  const topRight = document.querySelector(".top-bar > div:last-of-type");
  const target = topRight || document.body;
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
      </button>
      <div id="shDD" class="sh-dd" role="menu" aria-label="User menu">
        <a href="${shBasePath()}account.html" class="sh-item" role="menuitem">My Account</a>
        <a href="${shBasePath()}security.html" class="sh-item" role="menuitem">Security</a>
      </div>
    </div>
  `;
  target.appendChild(holder);
})();

/* ============ Wiring básico ============ */
const el = {
  cartCountLegacy: document.getElementById("cart-count"),
  loginLink: document.querySelector('[data-login-link]'),
  logoutLinks: Array.from(document.querySelectorAll('[data-logout-link]')),
  menu: document.getElementById("shMenu"),
  btn: document.getElementById("shUserBtn"),
  dd: document.getElementById("shDD"),
  ava: document.getElementById("shAva"),
  name: document.getElementById("shName"),
  count: document.getElementById("shCartCount"),
};

// Toggle dropdown
document.addEventListener("click", (e) => {
  if (el.btn && e.target.closest && e.target.closest("#shUserBtn") === el.btn) {
    e.stopPropagation();
    const open = el.dd.style.display === "block";
    el.dd.style.display = open ? "none" : "block";
    el.btn.setAttribute("aria-expanded", open ? "false" : "true");
  } else {
    if (el?.dd) { el.dd.style.display = "none"; el.btn?.setAttribute("aria-expanded","false"); }
  }
});

// Avatar => My Account
document.addEventListener('click', (e)=>{
  const b = e.target.closest && e.target.closest('#shUserBtn');
  if (b) { location.href = shBasePath() + 'account.html'; }
});

// Espera a que FB esté listo
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
  if (!FB) return;

  const { auth, db, logout } = FB;

  // LOGOUT → limpia candados y redirige
  el.logoutLinks.forEach(a => a.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await logout?.();
    } finally {
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('CART_MERGED_ONCE_')) localStorage.removeItem(k);
        });
      } catch {}
      location.href = shBasePath() + "index.html";
    }
  }));

  // Auth + UI
  let unsubCart = null;
  onAuthStateChanged(auth, (user) => {
    if (unsubCart) { unsubCart(); unsubCart = null; }
    if (el.count) el.count.textContent = "0";

    // Toggle login/logout en la top-bar
    if (!user) {
      el.menu && (el.menu.style.display = "none");
      el.loginLink && (el.loginLink.style.display = "");
      el.logoutLinks.forEach(a => a.style.display = "none");

      // limpia candados y refresca contador local
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('CART_MERGED_ONCE_')) localStorage.removeItem(k);
        });
        window.updateCartCount && window.updateCartCount();
      } catch {}
      return;
    }

    // Usuario logueado
    el.menu && (el.menu.style.display = "");
    el.loginLink && (el.loginLink.style.display = "none");
    el.logoutLinks.forEach(a => a.style.display = ""); // muestra Logout en index/topbar

    el.ava && (el.ava.src = user.photoURL || "img/avatar-default.png");
    el.name && (el.name.textContent = user.displayName || user.email || "Account");

    // MERGE UNA SOLA VEZ ANTES DEL SNAPSHOT
    mergeLocalCartToFirestore(FB);

    // Snapshot Firestore -> localStorage -> contador
    const ref = doc(db, "carts", user.uid);
    unsubCart = onSnapshot(ref, (snap) => {
      const items = snap.exists() ? (snap.data().items || []) : [];
      const n = items.reduce((s, it) => s + Number(it.quantity ?? it.cantidad ?? 0), 0);

      try {
        localStorage.setItem('cart', JSON.stringify(items || []));
        window.updateCartCount && window.updateCartCount();
      } catch {}

      if (el.count) el.count.textContent = String(n);
      if (el.cartCountLegacy) el.cartCountLegacy.textContent = String(n);
    });
  });
})();