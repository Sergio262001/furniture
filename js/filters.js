// /js/filters.js
// === Carga/render de productos + enlaces a product.html (rutas 100% relativas)
import { withParams } from './paths.js';
import { loadJSONWithCandidates } from './load-json.js';

// Render de cards
function renderProducts(list) {
  const el = document.getElementById('products');
  if (!el) return;

  const cat = (document.body.dataset.cat || '').trim().toLowerCase();
  const jsonRel = `pages/${cat}/${cat}.json`;

  el.innerHTML = (list || []).map(p => {
    const href = withParams('product.html', { id: p.id, cat, json: jsonRel });
    return `
      <article class="card">
        <a class="card-link" href="${href}">
          <img loading="lazy" src="${p.image || p.img || ''}" alt="${(p.name || '').replace(/"/g,'&quot;')}" />
          <h3>${p.name || 'Producto'}</h3>
          <p class="price">${p.price ? `$${p.price}` : ''}</p>
        </a>
      </article>
    `;
  }).join('');
}

// Carga inicial del JSON de la categoría
async function loadCategoryData() {
  const container = document.getElementById('products');
  const cat = (document.body.dataset.cat || '').trim().toLowerCase();

  if (!cat) {
    container?.insertAdjacentHTML('beforeend', `<p style="color:red">⚠ Falta data-cat en &lt;body&gt;</p>`);
    return;

    // Delegated click inside panel to catch any Apply-like button
    function __applyDelegated(e){
      const t = e.target;
      const hit = t.closest && t.closest('#applyFilters, .apply-filters, [data-apply-filters], button, input[type="submit"]');
      if (hit) {
        const sig = ((hit.id||'') + ' ' + (hit.className||'') + ' ' + (hit.name||'') + ' ' + (hit.value||'') + ' ' + (hit.title||'')).toLowerCase();
        if (/(^|[\s_-])apply([\s_-]|$)/.test(sig)) setTimeout(closeFilters, 0);
      }
    }
    panel.addEventListener('click', __applyDelegated);
    
  }

  try {
    const jsonRel = `pages/${cat}/${cat}.json`;
    const data = await loadJSONWithCandidates(
      jsonRel,
      `${cat}.json`,
      `pages/${cat}.json`,
      `./pages/${cat}/${cat}.json`,
      `../pages/${cat}/${cat}.json`
    );
    const items = Array.isArray(data) ? data : [];
    window.DATA = items; // por si usas filtros posteriores
    renderProducts(items);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="color:red">Error cargando productos: ${err.message}</p>`;
  }
}

// =====================================================================================
// === Tu overlay/drawer de filtros tal cual, con mínima integración ===================
// =====================================================================================
(function () {
  // ===== Helpers
  function getPanel() {
    return document.getElementById('filters') || document.querySelector('.filters');
  }
  function getToggles() {
    return Array.from(document.querySelectorAll('#filter-toggle, .filter-toggle'));
  }
  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  // ===== Overlay: DEBE ser hermano inmediato para que funcione ".filters.open + .filters-overlay"
  function ensureOverlay(panel) {
    let overlay = panel.nextElementSibling;
    if (!(overlay && overlay.classList.contains('filters-overlay'))) {
      const stray = document.querySelector('.filters-overlay');
      if (stray && stray !== overlay) stray.remove();
      overlay = document.createElement('div');
      overlay.className = 'filters-overlay';
      panel.parentNode.insertBefore(overlay, panel.nextElementSibling);
    }
    if (!overlay.__wired) {
      overlay.addEventListener('click', closeFilters);
      overlay.__wired = true;
    }
    return overlay;
  }

  // ===== Header con ✕ (si no existe)
  function ensureHeader(panel) {
    if (!panel.querySelector('.filters-header')) {
      const header = document.createElement('div');
      header.className = 'filters-header';
      header.innerHTML = '<strong>Filters</strong><button class="filters-close-btn" aria-label="Close">✕</button>';
      panel.insertBefore(header, panel.firstChild);
    }
    const closeBtn = panel.querySelector('.filters-close-btn');
    if (closeBtn && !closeBtn.__wired) {
      closeBtn.addEventListener('click', closeFilters);
      closeBtn.__wired = true;
    }
  }

  // ===== Open / Close
  function showOverlay(show) {
    const panel = getPanel();
    if (!panel) return;
    const overlay = panel.nextElementSibling && panel.nextElementSibling.classList.contains('filters-overlay')
      ? panel.nextElementSibling : null;
    if (overlay) overlay.style.display = show ? 'block' : 'none';
  }

  function openFilters() {
    const panel = getPanel(); if (!panel) return;
    ensureHeader(panel);
    ensureOverlay(panel);

    panel.classList.add('open');
    document.body.classList.add('body-no-scroll');
    showOverlay(true);

    if (isMobile()) {
      panel.style.left = '0';
    }
  }

  function closeFilters() {
    const panel = getPanel(); if (!panel) return;
    panel.classList.remove('open');
    document.body.classList.remove('body-no-scroll');
    showOverlay(false);

    if (panel.style.left === '0px') panel.style.left = '';

    const t = document.getElementById('filter-toggle') || document.querySelector('.filter-toggle');
    if (t) try { t.focus(); } catch {}
  }

  // Exponer por compatibilidad con tus onclick="toggleFilters()"
  window.toggleFilters = function () {
    const panel = getPanel(); if (!panel) return;
    if (!isMobile()) return; // en desktop no abrimos drawer
    panel.classList.contains('open') ? closeFilters() : openFilters();
  };

  // Cerrar tras "Apply Filters"
  function wireApplyClose(panel) {
    const applyBtn = panel.querySelector("button[onclick*='applyFilters']");
    if (applyBtn && !applyBtn.__wired) {
      applyBtn.addEventListener('click', () => setTimeout(closeFilters, 0));
      applyBtn.__wired = true;
    }
    panel.querySelectorAll('.apply-filters').forEach(btn => {
      if (!btn.__wired) {
        btn.addEventListener('click', () => setTimeout(closeFilters, 0));
        btn.__wired = true;
      }
    });
  }

  function initOverlays() {
    const panel = getPanel();
    if (!panel) return;

    ensureHeader(panel);
    ensureOverlay(panel);
    wireApplyClose(panel);

    getToggles().forEach(btn => {
      if (!btn.__wired) {
        btn.addEventListener('click', window.toggleFilters);
        btn.__wired = true;
      }
      btn.setAttribute('type', 'button');
    });

    if (!document.__filtersEscWired) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeFilters();
      });
      document.__filtersEscWired = true;
    }
  }

  // Inicializar overlays y cargar productos cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initOverlays();
      loadCategoryData();
    });
  } else {
    initOverlays();
    loadCategoryData();
  }
})();