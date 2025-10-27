(function () {
  // ========= CONFIGURA AQUÍ TUS ENLACES =========
  // icon: usa una de estas claves: whatsapp, facebook, tiktok, instagram, x, youtube, messenger, telegram, email, phone, chat
  const LINKS = [
    { name: "WhatsApp", icon: "whatsapp", href: "https://wa.me/0000000000?text=Hola%20necesito%20ayuda" },
    { name: "Facebook", icon: "facebook", href: "https://facebook.com/tu_pagina" },
    { name: "TikTok", icon: "tiktok", href: "https://www.tiktok.com/@tu_usuario" },
    // Ejemplos extra (opcional):
    // { name: "Instagram", icon: "instagram", href: "https://instagram.com/tu_usuario" },
    // { name: "YouTube", icon: "youtube", href: "https://youtube.com/@tu_canal" },
    // { name: "Telegram", icon: "telegram", href: "https://t.me/tu_usuario" },
    // { name: "Email", icon: "email", href: "mailto:soporte@tudominio.com" },
    // { name: "Llámanos", icon: "phone", href: "tel:+10000000000" },
  ];

  // ========= CSS INYECTADO (no necesitas tocar tu style.css) =========
  const css = `
  .chat { cursor: pointer; position: fixed; right: 20px; bottom: 20px; z-index: 999; }
  .chat-widget {
    position: fixed; right: 20px; bottom: 74px; z-index: 1000;
    display: none; flex-direction: column; gap: 10px;
    background: #fff; border-radius: 14px; padding: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,.15);
  }
  .chat-widget.open { display: flex; }
  .chat-widget__item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 10px; text-decoration: none; color: inherit;
    transition: transform .12s ease, background .12s ease;
  }
  .chat-widget__item:hover { transform: translateY(-1px); background: #f6f7f9; }
  .chat-widget__icon { width: 22px; height: 22px; display: inline-flex; }
  .chat-widget__icon svg { width: 22px; height: 22px; display: block; }
  .chat-widget__label { font-size: 14px; }
  .chat--active { transform: scale(0.98); }
  @media (max-width: 480px){
    .chat { right: 14px; bottom: 14px; }
    .chat-widget { right: 14px; bottom: 68px; }
  }`;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ========= TODOS LOS SVGs LOCALES =========
  const ICONS = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.52 3.48A11.94 11.94 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.14 1.6 5.94L0 24l6.2-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 22a9.93 9.93 0 0 1-5.06-1.39l-.36-.21-3.69.96.99-3.6-.24-.37A10 10 0 1 1 12 22Zm5.55-7.62c-.3-.15-1.77-.87-2.04-.96-.27-.09-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51 0 1.47 1.08 2.9 1.23 3.1.15.2 2.12 3.24 5.14 4.54.72.31 1.29.49 1.73.63.73.23 1.4.2 1.93.12.59-.09 1.77-.72 2.02-1.41.25-.7.25-1.3.18-1.41-.07-.11-.27-.18-.57-.33Z" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.675 0H1.325A1.33 1.33 0 0 0 0 1.325v21.35C0 23.406.594 24 1.325 24H12.82v-9.294H9.692v-3.62h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.796.716-1.796 1.767v2.318h3.59l-.467 3.62h-3.123V24h6.116A1.33 1.33 0 0 0 24 22.675V1.325A1.33 1.33 0 0 0 22.675 0Z" fill="currentColor"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 3.5c.8 1.3 2.04 2.3 3.5 2.75v3.1a7.95 7.95 0 0 1-3.5-.96v5.98a6.87 6.87 0 1 1-6.87-6.87c.3 0 .6.02.89.06v3.27a3.6 3.6 0 1 0 2.39 3.39V2h3.59v1.5Z" fill="currentColor"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6.01 4.9.07 1.2.06 1.9.25 2.3.41.6.23 1.1.5 1.6.96.46.45.73 1 .96 1.6.16.4.35 1.1.41 2.3.06 1.3.07 1.7.07 4.9s-.01 3.6-.07 4.9c-.06 1.2-.25 1.9-.41 2.3-.23.6-.5 1.1-.96 1.6-.45.46-1 .73-1.6.96-.4.16-1.1.35-2.3.41-1.3.06-1.7.07-4.9.07s-3.6-.01-4.9-.07c-1.2-.06-1.9-.25-2.3-.41-.6-.23-1.1-.5-1.6-.96-.46-.45-.73-1-.96-1.6-.16-.4-.35-1.1-.41-2.3C2.21 15.6 2.2 15.2 2.2 12s.01-3.6.07-4.9c.06-1.2.25-1.9.41-2.3.23-.6.5-1.1.96-1.6.45-.46 1-.73 1.6-.96.4-.16 1.1-.35 2.3-.41C8.4 2.21 8.8 2.2 12 2.2ZM12 0C8.74 0 8.33.01 7 .07 5.67.13 4.78.33 4.03.61c-.77.3-1.43.7-2.08 1.36C1.3 2.62.9 3.28.6 4.05.33 4.8.13 5.69.07 7 .01 8.33 0 8.74 0 12s.01 3.67.07 5c.06 1.33.26 2.22.53 2.97.3.77.7 1.43 1.36 2.08.65.65 1.3 1.05 2.08 1.36.75.28 1.64.47 2.97.53 1.33.06 1.74.07 5 .07s3.67-.01 5-.07c1.33-.06 2.22-.26 2.97-.53.77-.3 1.43-.7 2.08-1.36.65-.65 1.05-1.3 1.36-2.08.28-.75.47-1.64.53-2.97.06-1.33.07-1.74.07-5s-.01-3.67-.07-5c-.06-1.33-.26-2.22-.53-2.97-.3-.77-.7-1.43-1.36-2.08C21.38 1.3 20.72.9 19.95.6 19.2.33 18.31.13 17 .07 15.67.01 15.26 0 12 0Zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm0 10.2a4 4 0 1 1 0-8.001 4 4 0 0 1 0 8Zm6.4-10.9a1.45 1.45 0 1 0 .001 2.901A1.45 1.45 0 0 0 18.4 5.1Z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.2 8.2L23.5 22H16l-5-6.6L4.9 22H1.8l7.7-8.8L1 2h7.7l4.6 6.1L18.9 2Zm-1.2 18h1.9L8.3 4H6.4l11.3 16Z" fill="currentColor"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c2 .6 9.4.6 9.4.6s7.4 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.75 15.5v-7L15.5 12l-5.75 3.5Z" fill="currentColor"/></svg>',
    messenger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.04c-5.5 0-10 4.22-10 9.43 0 2.97 1.54 5.61 3.95 7.33v3.16l3.61-1.99c.8.22 1.65.34 2.44.34 5.5 0 10-4.22 10-9.43s-4.5-8.84-10-8.84Zm1.06 11.87-2.38-2.55-4.62 2.55 5.09-5.41 2.47 2.55 4.53-2.55-5.09 5.41Z" fill="currentColor"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.04 15.3 8.7 19.9c.5 0 .72-.22.98-.49l2.36-2.27 4.89 3.58c.9.5 1.53.24 1.77-.83l3.21-15.07h.01c.28-1.3-.47-1.8-1.33-1.48l-19 7.33c-1.29.5-1.27 1.21-.22 1.53l4.86 1.52L18.9 6.53c.6-.37 1.14-.17.69.2L9.04 15.3Z" fill="currentColor"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.01L12 13 22 6.01V6H2Zm20 12V8l-10 7L2 8v10h20Z" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a14.3 14.3 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.3 1 .3 2 .5 3 .5.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C10.8 21.2 2.8 13.2 2.8 3.2 2.8 2.5 3.3 2 4 2h3.4c.7 0 1.2.5 1.2 1.2 0 1 .2 2 .5 3 .1.4 0 .9-.3 1.2l-2.2 2.2Z" fill="currentColor"/></svg>',
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H7l-4.5 3V4a1 1 0 0 1 1-1Z" fill="currentColor"/></svg>',
  };

  // ========= RENDER DE CADA ITEM =========
  function renderItem(link) {
    const svg = ICONS[link.icon] || ICONS.chat;
    return `
      <a class="chat-widget__item" href="${link.href}" target="_blank" rel="noopener noreferrer" aria-label="${link.name}">
        <span class="chat-widget__icon">${svg}</span>
        <span class="chat-widget__label">${link.name}</span>
      </a>`;
  }

  // ========= INICIALIZACIÓN =========
  function init() {
    const chatBtn = document.querySelector(".chat");
    if (!chatBtn) return;

    // Crear panel
    const panel = document.createElement("div");
    panel.className = "chat-widget";
    panel.setAttribute("aria-hidden", "true");
    document.body.appendChild(panel);

    // Rellenar items
    panel.innerHTML = LINKS.map(renderItem).join("");

    // Toggle abrir/cerrar
    function toggle(open) {
      const willOpen = open ?? !panel.classList.contains("open");
      panel.classList.toggle("open", willOpen);
      panel.setAttribute("aria-hidden", String(!willOpen));
      chatBtn.classList.toggle("chat--active", willOpen);
    }

    chatBtn.addEventListener("click", (e) => { e.preventDefault(); toggle(); });

    // Cerrar al hacer click fuera
    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("open")) return;
      const inside = panel.contains(e.target);
      const onBtn = chatBtn.contains(e.target);
      if (!inside && !onBtn) toggle(false);
    });

    // Cerrar con ESC
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggle(false); });
  }

  // DOM listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
