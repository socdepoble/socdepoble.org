import { useCallback, useEffect, useRef, useState } from 'react';
import { backendScope } from '../../config/backendConfig.js';
import { getDraftsForScope, mutateDraft } from './GlobalSaveManager.js';
import { sanitizeHtml, netejaText } from '../../utils/sanitize.js';

/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · LA GUARDA
   D'HIDRATACIÓ (isHydrated).
   La còpia de prova es pinta en l'acte amb la nota de benvinguda, però
   l'esborrany desat arriba d'IndexedDB després (en un Android lent, centenars
   de mil·lisegons). Abans, una tecla en eixe interval (un espai, o el
   buidatge de la llavor al primer focus) s'escrivia al disc amb el valor que
   la persona veia, fet sobre la benvinguda i no sobre el seu esborrany: el
   camp desat es perdia, i en hidratar la tecla tornava a guanyar a la
   pantalla. Ara:
     · Fins que la lectura inicial de l'àmbit acaba, res no s'escriu ni
       s'esborra al disc: el que es tecleja es queda en memòria i es pinta.
     · En hidratar, camp a camp (fusionaTeclejat): el que ja era desat guanya
       en el seu camp quan el que s'hi ha teclejat partia d'un altre valor (la
       benvinguda); la resta del que s'ha teclejat es conserva, es pinta i es
       desa llavors, en una sola escriptura.
     · Si s'ha descartat alguna tecla, `revisio` puja: NotesEditor torna a
       muntar l'editor, que pinta el desat (el cos de TipTap no se
       sincronitza amb un desat pendent).
   El format persistit no canvia: { camp: valor } fusionat a `sandbox:…:id`. */

/* Iguals com a valors desats: també les llistes (categories, etiquetes). */
const iguals = (a, b) => a === b || JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * AH-R17-11 · Què fer, en hidratar, amb el que s'ha teclejat abans.
 * `base` és el que la persona veia (la benvinguda), `desat` l'esborrany del
 * disc i `teclejat` els camps escrits abans que la lectura acabara. Un camp
 * desat que no és el de la base i no és el teclejat guanya: el teclejat
 * partia d'un altre valor. Torna { desa, descartats }: els camps que s'han
 * d'escriure i els noms dels que s'han deixat per al desat.
 */
export function fusionaTeclejat(base = {}, desat = {}, teclejat = {}) {
  const desa = {};
  const descartats = [];
  for (const [camp, valor] of Object.entries(teclejat)) {
    const propi = Object.hasOwn(desat, camp) && !iguals(desat[camp], base[camp]) && !iguals(desat[camp], valor);
    if (propi) descartats.push(camp);
    else desa[camp] = valor;
  }
  return { desa, descartats };
}

function escriuAlDisc(clau, camps, avisa) {
  mutateDraft(clau, previous => ({ ...previous, ...camps }))
    .catch(error => avisa.current?.(error.message));
}

/** The guest editor has the same durable, scoped draft store as signed-in Notes. */
export function useLocalSandbox(initial, config, onError) {
  const key = `sandbox:${backendScope(config)}`;
  const [state, setState] = useState({ key, note: initial, revisio: 0 });
  const dirty = useRef(new Map());
  /* AH-R17-11 · Els àmbits la lectura inicial dels quals ja ha acabat, i el
     que s'hi ha teclejat abans (àmbit → { id, camps }), que encara no és al disc. */
  const hidratats = useRef(new Set());
  const pendents = useRef(new Map());
  const errorRef = useRef(onError);
  errorRef.current = onError;
  useEffect(() => {
    let active = true;
    getDraftsForScope(key).then(drafts => {
      if (!active) return;
      const desat = drafts?.[initial.id] || {};
      const pendent = pendents.current.get(key);
      pendents.current.delete(key);
      hidratats.current.add(key);
      const { desa, descartats } = fusionaTeclejat(initial, desat, pendent?.camps);
      if (descartats.length) {
        const teclejat = { ...dirty.current.get(key) };
        descartats.forEach(camp => { delete teclejat[camp]; });
        dirty.current.set(key, teclejat);
      }
      setState(previous => ({
        key,
        note: { ...initial, ...desat, ...dirty.current.get(key) },
        revisio: (previous.key === key ? previous.revisio : 0) + (descartats.length ? 1 : 0)
      }));
      if (Object.keys(desa).length) escriuAlDisc(`${key}:${pendent.id}`, desa, errorRef);
    /* getDraftsForScope no rebutja mai (T47). Si ho fera, la guarda es queda
       tancada: sense la lectura no se sap què hi ha desat i no s'hi escriu. */
    }).catch(error => { if (active) errorRef.current?.(error.message); });
    return () => { active = false; };
  }, [key, initial]);
  const update = useCallback((id, field, value) => {
    const clean = ['title', 'subtitle', 'lead', 'content'].includes(field) ? sanitizeHtml(value)
      : field === 'copyright' ? netejaText(value).slice(0, 256) : value;
    dirty.current.set(key, { ...dirty.current.get(key), [field]: clean });
    setState(previous => (previous.key === key
      ? { ...previous, note: { ...previous.note, [field]: clean } }
      : { key, note: { ...initial, [field]: clean }, revisio: 0 }));
    /* AH-R17-11 · Abans d'hidratar, ni escriure ni esborrar: es guarda per a la fusió. */
    if (!hidratats.current.has(key)) {
      const pendent = pendents.current.get(key);
      pendents.current.set(key, { id, camps: { ...pendent?.camps, [field]: clean } });
      return;
    }
    escriuAlDisc(`${key}:${id}`, { [field]: clean }, errorRef);
  }, [key, initial]);
  return [state.key === key ? state.note : initial, update, state.key === key ? state.revisio : 0];
}
