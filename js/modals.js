// /js/modals.js
(() => {
  // ====== IDs esperados para triggers en el top bar ======
  const FINANCING_TRIGGER = "#financing-btn";
  const HELP_TRIGGER = "#help-btn";

  // ====== IDs únicos que inyectaremos (evita duplicados) ======
  const FINANCING_BACKDROP_ID = "financing-backdrop";
  const HELP_BACKDROP_ID = "help-backdrop";

  // ====== Utilidades ======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const lockScroll = () => (document.documentElement.style.overflow = "hidden");
  const unlockScroll = () => (document.documentElement.style.overflow = "");
  let lastFocused = null;

  function openBackdrop(backdrop) {
    if (!backdrop) return;
    lastFocused = document.activeElement;
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    lockScroll();

    // Llevar foco al contenedor accesible del modal
    const dialog = $("[role='dialog']", backdrop);
    if (dialog) {
      dialog.setAttribute("tabindex", "-1");
      setTimeout(() => dialog.focus(), 0);
    }

    // Trampa de foco simple dentro del diálogo
    const focusables = $$(
      "button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      dialog || backdrop
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    function trap(e) {
      if (e.key !== "Tab" || focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    backdrop._trapHandler = trap;
    backdrop.addEventListener("keydown", trap);
  }

  function closeBackdrop(backdrop) {
    if (!backdrop) return;
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    if (backdrop._trapHandler) {
      backdrop.removeEventListener("keydown", backdrop._trapHandler);
      backdrop._trapHandler = null;
    }
    unlockScroll();
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  // ====== Markup con tu estética (mensaje + botón) ======
  function financingMarkup() {
    return `
      <div class="financing-modal-backdrop" id="${FINANCING_BACKDROP_ID}" aria-hidden="true">
        <div class="financing-modal" role="dialog" aria-modal="true" aria-labelledby="financing-title">
          <div class="financing-modal__header">
            <h3 class="financing-modal__title" id="financing-title">Financing Options</h3>
            <button class="financing-modal__close" data-close-financing aria-label="Close financing modal">✕</button>
          </div>
          <div class="financing-modal__body">
            <p>
              Enjoy flexible financing plans tailored to your needs. Apply in minutes and
              split your purchase into convenient monthly payments. Subject to approval.
            </p>
            <ul class="financing-modal__list">
              <li>No annual fees</li>
              <li>Promotional APR for qualifying purchases</li>
              <li>Fast online application</li>
            </ul>
          </div>
          <div class="financing-modal__footer">
            <button class="financing-modal__cta" data-dismiss-financing>Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function helpMarkup() {
    return `
      <div class="financing-modal-backdrop" id="${HELP_BACKDROP_ID}" aria-hidden="true">
        <div class="financing-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div class="financing-modal__header">
            <h3 class="financing-modal__title" id="help-title">Need Help?</h3>
            <button class="financing-modal__close" data-close-help aria-label="Close help modal">✕</button>
          </div>
          <div class="financing-modal__body">
            <p>We’re here to assist you! Whether you have questions about our products, orders, or delivery, our support team is ready to help.</p>
            <p>Check our FAQ section for quick answers.</p>
            <p>Contact our customer service via email: <strong>_________________</strong> or phone: <strong>_________________</strong>.</p>
            <p>Live chat support is available Monday to Friday from 9 AM to 6 PM.</p>
            <p>Your satisfaction is our priority, and we’ll make sure your experience with our furniture is smooth and enjoyable.</p>
          </div>
          <div class="financing-modal__footer">
            <button class="financing-modal__cta" data-dismiss-help>Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function ensureInjected() {
    // Evitar duplicados si otra página ya los inyectó
    if (!document.getElementById(FINANCING_BACKDROP_ID)) {
      document.body.insertAdjacentHTML("beforeend", financingMarkup());
    }
    if (!document.getElementById(HELP_BACKDROP_ID)) {
      document.body.insertAdjacentHTML("beforeend", helpMarkup());
    }
  }

  function wireEvents() {
    const finTrigger = $(FINANCING_TRIGGER);
    const helpTrigger = $(HELP_TRIGGER);

    const finBackdrop = document.getElementById(FINANCING_BACKDROP_ID);
    const helpBackdrop = document.getElementById(HELP_BACKDROP_ID);

    // Abrir
    finTrigger && finBackdrop && finTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      openBackdrop(finBackdrop);
    });
    helpTrigger && helpBackdrop && helpTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      openBackdrop(helpBackdrop);
    });

    // Cerrar por botones
    $("[data-close-financing]")?.addEventListener("click", () => closeBackdrop(finBackdrop));
    $("[data-dismiss-financing]")?.addEventListener("click", () => closeBackdrop(finBackdrop));
    $("[data-close-help]")?.addEventListener("click", () => closeBackdrop(helpBackdrop));
    $("[data-dismiss-help]")?.addEventListener("click", () => closeBackdrop(helpBackdrop));

    // Cerrar al hacer click fuera (solo si el click es exactamente el backdrop)
    finBackdrop?.addEventListener("click", (e) => {
      if (e.target === finBackdrop) closeBackdrop(finBackdrop);
    });
    helpBackdrop?.addEventListener("click", (e) => {
      if (e.target === helpBackdrop) closeBackdrop(helpBackdrop);
    });

    // Cerrar con ESC
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (finBackdrop?.classList.contains("open")) closeBackdrop(finBackdrop);
      if (helpBackdrop?.classList.contains("open")) closeBackdrop(helpBackdrop);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureInjected();
    wireEvents();
  });
})();
