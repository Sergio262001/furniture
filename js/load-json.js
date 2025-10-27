// js/load-json.js — fetch robusto con candidatos
import { url } from './paths.js';

export async function loadJSONWithCandidates(...candidates) {
  const tried = [];
  for (const rel of candidates.filter(Boolean)) {
    const href = url(rel);
    try {
      const r = await fetch(href, { cache: 'no-store' });
      if (!r.ok) { tried.push(`${rel} (${r.status})`); continue; }
      // Manejo defensivo ante BOM u otros
      const txt = await r.text();
      try { return JSON.parse(txt); } catch (e) { tried.push(`${rel} (json parse)`); }
    } catch (e) {
      tried.push(`${rel} (err)`);
    }
  }
  throw new Error('No se pudo cargar JSON. Intentos: ' + tried.join(' | '));
}