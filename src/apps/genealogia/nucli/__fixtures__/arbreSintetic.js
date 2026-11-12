/**
 * arbreSintetic.js — SUPORT DE PROVES (no l'importa cap fitxer de producció).
 * Persones i relacions inventades per a provar el nucli: cap nom ni poble real.
 */
import { creaArbre, creaPersona, creaRelacio } from '../model.js';

export const ANY = 2026;
export const ARA = '2026-11-11T02:00:00.000Z';
export const ARBRE_ID = '00000000-0000-4000-8000-0000000000a1';

/** Un id de prova amb forma d'UUID: uid(7) → '…000000000007'. */
export const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Un generador d'ids correlatius per a nouId(). */
export function comptador(inici = 1000) {
  let n = inici;
  return () => {
    n += 1;
    return uid(n);
  };
}

export const arbre = (camps = {}) => creaArbre({ id: ARBRE_ID, titol: 'Arbre de prova', ara: ARA, ...camps });

/** Una persona: persona(1, { nom: 'Pere', naixement: '1908' }). */
export const persona = (n, camps = {}) => creaPersona({ id: uid(n), arbreId: ARBRE_ID, ara: ARA, nom: `Persona ${n}`, ...camps }, { anyActual: ANY });

/** Una relació: rel(9, 'progenitor', 1, 2) → 1 és progenitor de 2. */
export const rel = (n, tipus, de, a, evidencia = { memoriaOral: true, vincleExplicit: true }) => creaRelacio({
  id: uid(n), arbreId: ARBRE_ID, tipus, de: uid(de), a: uid(a), evidencia, ara: ARA
});

export const complet = (persones, relacions = [], campsArbre = {}) => ({ arbre: arbre(campsArbre), persones, relacions, entrevista: null });
