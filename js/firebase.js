// ==========================
// Firebase SDK (v9 modular)
// ==========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ==========================
// TU CONFIG (cámbiala en Firebase Console → Project settings → Web app)
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxx_xxxxx",
  authDomain: "furniture-online-store-834bf.firebaseapp.com",
  projectId: "furniture-online-store-834bf",
  storageBucket: "furniture-online-store-834bf.appspot.com",
  messagingSenderId: "1084583047",
  appId: "1:1084583047:web:xxxxxx",
  measurementId: "G-XXXXXX"
};
// Init
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ==========================
// Helpers
// ==========================
async function ensureCartRef() {
  const u = auth.currentUser;
  if (!u) return null;
  const ref = doc(db, "carts", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { items: [], updatedAt: serverTimestamp() });
  }
  return ref;
}

async function addToCart(item) {
  const u = auth.currentUser;
  if (!u) { alert("Inicia sesión para agregar al carrito."); return; }
  const ref = await ensureCartRef();
  const snap = await getDoc(ref);
  const cart = snap.data() || { items: [] };
  const idx = cart.items.findIndex(x => String(x.id) === String(item.id));
  if (idx >= 0) cart.items[idx].quantity += (item.quantity || 1);
  else cart.items.push({ ...item, quantity: item.quantity || 1 });
  await updateDoc(ref, { items: cart.items, updatedAt: serverTimestamp() });
  return cart.items;
}

async function getCart() {
  const u = auth.currentUser;
  if (!u) return [];
  const ref  = doc(db, "carts", u.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().items || []) : [];
}

async function saveProfile({ displayName }) {
  const u = auth.currentUser;
  if (!u) return;
  if (displayName) await updateProfile(u, { displayName });
  const uref = doc(db, "users", u.uid);
  const now = serverTimestamp();
  const existing = await getDoc(uref);
  if (existing.exists()) {
    await updateDoc(uref, { displayName: displayName || existing.data().displayName, updatedAt: now });
  } else {
    await setDoc(uref, { displayName: displayName || "", email: u.email || "", createdAt: now, updatedAt: now });
  }
}

// Exponer en window
window.FB = {
  app, auth, db,
  // Auth
  loginEmail: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  registerEmail: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
  loginGoogle: () => signInWithPopup(auth, new GoogleAuthProvider()),
  logout: () => signOut(auth),
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  saveProfile,
  // Cart
  ensureCartRef,
  addToCart,
  getCart
};

// UI reactiva para top bar
onAuthStateChanged(auth, (user) => {
  document.querySelectorAll("[data-login-link]").forEach(a => a.style.display = user ? "none" : "");
  document.querySelectorAll("[data-logout-link]").forEach(a => a.style.display = user ? "" : "none");
  const badge = document.querySelector("[data-user-badge]");
  if (badge) badge.textContent = user ? (user.displayName || user.email || "Cuenta") : "Invitado";

});

