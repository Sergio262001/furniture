// js/payments.js
async function startCheckout() {
  const items = (JSON.parse(localStorage.getItem("cart")) || []).map(it => ({
    id: it.id,
    name: it.name || "Product",
    price: Number(it.price ?? 0),
    quantity: Number(it.quantity ?? 1)
  }));
  if (!items.length) {
    alert("Tu carrito está vacío.");
    return;
  }

  try {
    // Llama a tu Function (nombre corto y genérico)
    const res = await fetch("/createCheckout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (!data.checkoutUrl && !data.sessionId) {
      throw new Error(data.error || "No se pudo crear el checkout");
    }

    // Soporta dos estilos: URL (Wompi/MP/PayU) o Stripe Session
    if (data.checkoutUrl) {
      location.href = data.checkoutUrl; // hosted checkout
      return;
    }

    // Stripe (opcional): redirección por sessionId
    if (!window.Stripe) {
      await new Promise(r => {
        const s = document.createElement("script");
        s.src = "https://js.stripe.com/v3/";
        s.onload = r;
        document.head.appendChild(s);
      });
    }
    const stripe = Stripe(data.publicKey);
    await stripe.redirectToCheckout({ sessionId: data.sessionId });
  } catch (e) {
    alert("Error en checkout: " + e.message);
  }
}

// Exponer a la página
window.PAY = { startCheckout };
