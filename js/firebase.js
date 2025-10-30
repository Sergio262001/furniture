// Firebase v9 (Modular) por CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, GoogleAuthProvider, signInWithPopup,
  sendPasswordResetEmail, updateProfile,
  // [ADD] extras de auth para security & providers
  sendEmailVerification, updatePassword, reauthenticateWithCredential,
  reauthenticateWithPopup, EmailAuthProvider, unlink, linkWithPopup
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp,
  // [ADD] realtime
  onSnapshot
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

// [ADD] Carrito en tiempo real (te devuelve un unsubscribe)
function onCartSnapshot(cb) {
  const u = auth.currentUser;
  if (!u) { cb([]); return () => {}; }
  const ref = doc(db, "carts", u.uid);
  return onSnapshot(ref, (snap) => {
    const data = snap.exists() ? (snap.data().items || []) : [];
    cb(data);
  });
}

async function saveProfile({ displayName, photoURL }) { // [MOD] admite photoURL opcional
  const u = auth.currentUser; if (!u) return;
  const update = {};
  if (displayName) update.displayName = displayName;
  if (photoURL !== undefined) update.photoURL = photoURL;

  if (Object.keys(update).length) await updateProfile(u, update);

  const ref = doc(db, "users", u.uid);
  const now = serverTimestamp();
  const s = await getDoc(ref);
  if (s.exists()) {
    await updateDoc(ref, {
      displayName: displayName ?? s.data().displayName ?? "",
      photoURL: photoURL ?? s.data().photoURL ?? "",
      updatedAt: now
    });
  } else {
    await setDoc(ref, {
      displayName: displayName || "",
      photoURL: photoURL || "",
      email: u.email || "",
      createdAt: now,
      updatedAt: now
    });
  }
}

// ===== Helpers de seguridad y proveedores (para security.html & account.html) =====
// Registrar con email + verificación
async function signupWithEmail(email, pass) {
  const { user } = await createUserWithEmailAndPassword(auth, email, pass);
  try { await sendEmailVerification(user); } catch {}
  return user;
}

// Alias equivalentes a tus nombres anteriores
const loginWithEmail  = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

// Enviar nuevo correo de verificación
const resendVerifyEmail = () => {
  if (!auth.currentUser) throw new Error("No hay sesión.");
  return sendEmailVerification(auth.currentUser);
};

// Cambiar contraseña (requiere sesión reciente)
const changePassword = (newPassword) => updatePassword(auth.currentUser, newPassword);

// ¿tiene vinculado un proveedor?
const isProviderLinked = (providerId) =>
  !!auth.currentUser?.providerData.find(p => p.providerId === providerId);

// Vincular Google a la cuenta actual (NO iniciar sesión con otra)
const linkGoogle = () => linkWithPopup(auth.currentUser, googleProvider);

// Desvincular proveedor (ej: 'google.com')
const unlinkProvider = (providerId) => unlink(auth.currentUser, providerId);

// Reautenticación (acciones sensibles)
const reauthWithPassword = (email, password) => {
  const cred = EmailAuthProvider.credential(email, password);
  return reauthenticateWithCredential(auth.currentUser, cred);
};
const reauthWithGoogle = () => reauthenticateWithPopup(auth.currentUser, googleProvider);

// Wrapper para exigir sesión reciente
async function requireRecentLogin(fn) {
  try { return await fn(); }
  catch (e) {
    if (e?.code === "auth/requires-recent-login") {
      throw new Error("Esta acción requiere que inicies sesión de nuevo (reauth).");
    }
    throw e;
  }
}

window.FB = {
  app, auth, db,
  // Auth (tus nombres originales se mantienen)
  loginEmail: (email, pass) => loginWithEmail(email, pass),
  registerEmail: (email, pass) => signupWithEmail(email, pass),
  loginGoogle: () => loginWithGoogle(),
  logout: () => signOut(auth),
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  saveProfile,
  // Cart
  ensureCartRef, addToCart, getCart,
  // [ADD] Realtime cart
  onCartSnapshot,
  // [ADD] Nuevos helpers usados por account/security
  loginWithEmail, signupWithEmail, loginWithGoogle,
  resendVerifyEmail, changePassword, isProviderLinked,
  linkGoogle, unlinkProvider,
  reauthWithPassword, reauthWithGoogle, requireRecentLogin
};

// Top bar reactiva (opcional)
onAuthStateChanged(auth, (user) => {
  document.querySelectorAll("[data-login-link]").forEach(a => a.style.display = user ? "none" : "");
  document.querySelectorAll("[data-logout-link]").forEach(a => a.style.display = user ? "" : "none");
  const badge = document.querySelector("[data-user-badge]");
  if (badge) badge.textContent = user ? (user.displayName || user.email || "Cuenta") : "Invitado";
});