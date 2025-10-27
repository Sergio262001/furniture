// js/paths.js — utilidades de URL/params respetando <base>
export const REPO_SLUG = 'furniture';

export function url(path) {
  // Recibe rutas SIN slash inicial → resuelve contra document.baseURI
  return new URL(path, document.baseURI).href;
}

export function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

export function withParams(href, paramsObj = {}) {
  const u = new URL(href, document.baseURI);
  for (const [k, v] of Object.entries(paramsObj)) {
    if (v !== undefined && v !== null) u.searchParams.set(k, v);
  }
  return u.toString();
}