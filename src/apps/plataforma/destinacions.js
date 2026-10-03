/**
 * Plataforma d'Apps Enxufables · les destinacions d'un enllaç de fora (SN, 261003).
 *
 * Un enllaç que arriba a Sóc de Poble (el Snippet Curador del Bloc,
 * /notes?mode=desa) pot anar a una app en lloc del Bloc: el Lector de
 * notícies l'apunta com una font. L'app ho declara exportant
 * `destinacioEnllac` des del MATEIX mòdul que carrega el seu manifest
 * (`carrega`). Així:
 *   · la destinació viu darrere del literal de compilació de l'app: sense
 *     l'app al build no n'hi ha, i el manifest continua amb una sola
 *     importació dinàmica (plataforma/qualitat.test.js);
 *   · qui la fa servir no importa cap fitxer de l'app (fronteres);
 *   · s'oferix només si l'app és 'available' per a esta persona i este node
 *     (interruptors.js: build, entorn, amfitrió i preferències) I el seu
 *     mòdul n'exporta una (correcció SN-R1): una app encesa sense port, que
 *     exporta `destinacioEnllac = null`, no oferix cap targeta morta.
 *
 *   useDestinacioEnllac(id)            { estat, destinacio }, ja resolta (ESTATS_DESTINACIO)
 *   carregaDestinacioEnllac(manifest)  Promise<destinació neta | null>
 *   validaDestinacioEnllac(cru, id)    la destinació neta o null
 *
 * La destinació que exporta l'app:
 *   {
 *     nomMaxim?     enter positiu: el límit del nom que desa l'app
 *     categories()  → [{ id, nom }] on es pot classificar (pot ser [])
 *     afig({ url, nom, categoriaId }) → { id, nom, trams? }; si no val,
 *                   llança un Error amb el motiu dit a la persona i, si
 *                   en té, `codi` i `camp` (arriben tal qual)
 *   }
 * La plataforma no se'n fia: les categories passen per una llista blanca
 * (id opac, nom de text, sense repetits), el resultat d'afig també, i els
 * `trams` només es convertixen en un camí de l'app (/app/<id>/…) si tots
 * són segurs. Només les apps internes i públiques (permisos.veure 'public')
 * poden ser destinació: el snippet funciona també sense sessió.
 */
import { useEffect, useState } from 'react';
import { rutaDeApp } from './manifestApp.js';
import { useAppAvaluada } from './PlataformaContext.jsx';
import { esIdOpac, esSegmentSegur } from './rutesAplicacio.js';

/** El límit del nom si l'app no en declara cap. */
export const NOM_MAXIM_PER_DEFECTE = 80;
const MAX_CATEGORIES = 100;
const MAX_TRAMS = 8;

const textNet = (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '');

/** Una app que pot ser destinació: interna, compilada, pública i 'available'. */
export function esDestinacioPossible(avaluada) {
  const manifest = avaluada?.manifest;
  return Boolean(manifest) && avaluada.estat === 'available' && manifest.origen === 'interna'
    && typeof manifest.carrega === 'function' && manifest.permisos?.veure === 'public';
}

/** Les categories netes: id opac, nom de text, sense repetits. */
function categoriesNetes(llista) {
  const vistes = new Set();
  const netes = [];
  for (const cru of Array.isArray(llista) ? llista : []) {
    const nom = textNet(cru?.nom);
    if (!esIdOpac(cru?.id) || !nom || vistes.has(cru.id)) continue;
    vistes.add(cru.id);
    netes.push(Object.freeze({ id: cru.id, nom }));
    if (netes.length >= MAX_CATEGORIES) break;
  }
  return Object.freeze(netes);
}

/**
 * La destinació neta d'una app, o null si no en té cap o no té la forma.
 * `id`: l'id de l'app, per al camí del resultat.
 */
export function validaDestinacioEnllac(cru, id) {
  if (!cru || typeof cru !== 'object' || typeof cru.categories !== 'function' || typeof cru.afig !== 'function') return null;
  const nomMaxim = Number.isSafeInteger(cru.nomMaxim) && cru.nomMaxim > 0 ? cru.nomMaxim : NOM_MAXIM_PER_DEFECTE;
  return Object.freeze({
    nomMaxim,
    async categories() {
      return categoriesNetes(await cru.categories());
    },
    async afig({ url, nom, categoriaId = null } = {}) {
      const resultat = await cru.afig({ url, nom, categoriaId: categoriaId || null });
      const trams = Array.isArray(resultat?.trams) && resultat.trams.length <= MAX_TRAMS && resultat.trams.every(esSegmentSegur)
        ? resultat.trams : null;
      return Object.freeze({
        id: typeof resultat?.id === 'string' ? resultat.id : null,
        nom: textNet(resultat?.nom) || textNet(nom),
        ruta: trams ? rutaDeApp(id, ...trams) : null
      });
    }
  });
}

/** Carrega el mòdul de l'app i en torna la destinació neta, o null. */
export async function carregaDestinacioEnllac(manifest) {
  if (!manifest || manifest.origen !== 'interna' || typeof manifest.carrega !== 'function') return null;
  const modul = await manifest.carrega();
  return validaDestinacioEnllac(modul?.destinacioEnllac, manifest.id);
}

/**
 * Els estats de useDestinacioEnllac:
 *   cap        l'app no pot ser destinació (esDestinacioPossible) o el seu
 *              mòdul no n'exporta cap: no s'oferix res
 *   carregant  el mòdul de l'app encara arriba
 *   llesta     `destinacio` és la destinació neta: ara sí, es pot oferir
 *   error      el mòdul no ha arribat (xarxa, un paquet nou): una fallada de pas
 */
export const ESTATS_DESTINACIO = Object.freeze({ cap: 'cap', carregant: 'carregant', llesta: 'llesta', error: 'error' });

const SENSE_DESTINACIO = Object.freeze({ estat: ESTATS_DESTINACIO.cap, destinacio: null });
const CARREGANT = Object.freeze({ estat: ESTATS_DESTINACIO.carregant, destinacio: null });
const FALLIDA = Object.freeze({ estat: ESTATS_DESTINACIO.error, destinacio: null });

/**
 * Fora de les apps: la destinació de l'app `id`, RESOLTA (correcció SN-R1).
 * Si l'app pot ser destinació, carrega el seu mòdul en muntar (el de
 * `carrega`, que el manifest ja porta) per saber si n'exporta una: qui la
 * fa servir només l'oferix amb l'estat 'llesta', i mai abans. Torna
 * { estat, destinacio } (ESTATS_DESTINACIO), un objecte estable per estat.
 */
export function useDestinacioEnllac(id) {
  const avaluada = useAppAvaluada(id);
  const manifest = esDestinacioPossible(avaluada) ? avaluada.manifest : null;
  const [resolta, setResolta] = useState({ per: null, valor: CARREGANT });
  useEffect(() => {
    if (!manifest) return undefined;
    let viva = true;
    const posa = (valor) => {
      if (viva) setResolta({ per: manifest, valor });
    };
    carregaDestinacioEnllac(manifest).then(
      (destinacio) => posa(destinacio ? Object.freeze({ estat: ESTATS_DESTINACIO.llesta, destinacio }) : SENSE_DESTINACIO),
      () => posa(FALLIDA)
    );
    return () => { viva = false; };
  }, [manifest]);
  if (!manifest) return SENSE_DESTINACIO;
  return resolta.per === manifest ? resolta.valor : CARREGANT;
}
