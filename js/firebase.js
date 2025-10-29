// Firebase v9 (Modular) por CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, updateProfile
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ✅ Config correcta (nota el storageBucket en appspot.com)
const firebaseConfig = {
  apiKey: "AIzaSyBqnXFn0pYtDkIyPvfwXmceFqdBtUoUnpU",
  authDomain: "furniture-online-store-834bf.firebaseapp.com",
  projectId: "furniture-online-store-834bf",
  storageBucket: "furniture-online-store-834bf.appspot.com",
  messagingSenderId: "575738362941",
  appId: "1:575738362941:web:18f655767a934cfbbb7e54"
};

// Init
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);

// Proveedor Google (reutilizable)
const googleProvider = new GoogleAuthProvider();

// ===== API pública para tus páginas =====
async function ensureCartRef() {
  const u = auth.currentUser; if (!u) return null;
  const ref = doc(db, "carts", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, { items: [], updatedAt: serverTimestamp() });
  return ref;
}
async function addToCart(item) {
  const u = auth.currentUser; if (!u) { alert("Inicia sesión para agregar al carrito."); return; }
  const ref = await ensureCartRef();
  const snap = await getDoc(ref);
  const cart = snap.exists() ? snap.data() : { items: [] };
  const i = cart.items.findIndex(x => String(x.id) === String(item.id));
  if (i >= 0) cart.items[i].quantity += (item.quantity || 1);
  else cart.items.push({ ...item, quantity: item.quantity || 1 });
  await updateDoc(ref, { items: cart.items, updatedAt: serverTimestamp() });
  return cart.items;
}
async function getCart() {
  const u = auth.currentUser; if (!u) return [];
  const ref = doc(db, "carts", u.uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().items || []) : [];
}
async function saveProfile({ displayName }) {
  const u = auth.currentUser; if (!u) return;
  if (displayName) await updateProfile(u, { displayName });
  const ref = doc(db, "users", u.uid);
  const now = serverTimestamp();
  const s = await getDoc(ref);
  if (s.exists()) await updateDoc(ref, { displayName: displayName || s.data().displayName, updatedAt: now });
  else await setDoc(ref, { displayName: displayName || "", email: u.email || "", createdAt: now, updatedAt: now });
}

window.FB = {
  app, auth, db,
  // Auth
  loginEmail: (email, pass) => signInWithEmailAndPassword(auth, email, pass),
  registerEmail: (email, pass) => createUserWithEmailAndPassword(auth, email, pass),
  loginGoogle: () => signInWithPopup(auth, googleProvider),
  logout: () => signOut(auth),
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  saveProfile,
  // Cart
  ensureCartRef, addToCart, getCart
};

// Top bar reactiva (opcional)
onAuthStateChanged(auth, (user) => {
  document.querySelectorAll("[data-login-link]").forEach(a => a.style.display = user ? "none" : "");
  document.querySelectorAll("[data-logout-link]").forEach(a => a.style.display = user ? "" : "none");
  const badge = document.querySelector("[data-user-badge]");
  if (badge) badge.textContent = user ? (user.displayName || user.email || "Cuenta") : "Invitado";
});