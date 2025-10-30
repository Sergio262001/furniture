// Universal filters behavior (v3): stronger close-on-apply for mobile
(function(){
  if (window.__filtersWireV3) return; window.__filtersWireV3 = true;

  const isMobile = () => window.innerWidth <= 768;
  const filtersRoot = () => document.getElementById('filters') || document.querySelector('.filters');
  const closeFilters = () => {
    const f = filtersRoot(); if (!f) return;
    f.classList.remove('open');
    if (isMobile()) f.style.display = 'none';
    document.documentElement.style.overflowY = '';
  };

  // Close on click of common Apply selectors, broadly compatible:
  // - #applyFilters
  // - .apply-filters
  // - [data-apply-filters]
  // - any button/input whose id or class contains "apply" and is inside the filters panel
  const APPLY_SEL = '#applyFilters, .apply-filters, [data-apply-filters], button, input[type="submit"]';
  document.addEventListener('click', (e) => {
    const f = filtersRoot(); if (!f) return;
    const target = e.target;
    if (!target) return;
    const inFilters = target.closest && target.closest('#filters, .filters');
    if (!inFilters) return;

    // Match explicit selectors first
    if (target.closest('#applyFilters, .apply-filters, [data-apply-filters]')) {
      setTimeout(closeFilters, 0);
      return;
    }

    // Heuristic: buttons/inputs with "apply" in id/class/name/value/title
    const el = target.closest(APPLY_SEL);
    if (el) {
      const s = (el.id + ' ' + el.className + ' ' + (el.name||'') + ' ' + (el.value||'') + ' ' + (el.title||'')).toLowerCase();
      if (/(^|[\s_-])apply([\s_-]|$)/.test(s)) {
        setTimeout(closeFilters, 0);
      }
    }
  });

  // Also close on submit of any form inside filters
  const fr = filtersRoot();
  if (fr) {
    fr.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', () => setTimeout(closeFilters, 0));
    });
  }
})();