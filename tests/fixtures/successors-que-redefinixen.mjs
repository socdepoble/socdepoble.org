/** v1.2.25 · K-C1-SQL. Les proves que munten «tot el catàleg menys X» i després
 * apliquen X no poden executar abans de X una migració posterior que redefinix
 * una funció creada per X: la guarda per hash d'eixa successora (per exemple
 * SDP-C1-DRIFT de 20261125010000 sobre public.xat_reserva_adjunt) refusa, amb
 * raó, el cos anterior a X. Este mòdul tria eixes successores, i les que en
 * depenen per la capçalera («Depén de»), en l'ordre del pla, perquè la prova
 * les aplique DESPRÉS de X. No exclou cap altra migració ni afluixa cap guarda. */
import { capcalera, dependenciesDeclarades } from '../../scripts/supabase/verifica-migracions.mjs';

const RE_FUNCIO = /create\s+(?:or\s+replace\s+)?function\s+(public|private)\.([a-z0-9_]+)\s*\(/gi;

/** Noms qualificats (esquema.funció, en minúscula) que un SQL crea o redefinix. */
export function funcionsCreades(sql) {
  return new Set([...sql.matchAll(RE_FUNCIO)].map(m => `${m[1]}.${m[2]}`.toLowerCase()));
}

/** Migracions posteriors a la primera exclosa que redefinixen una de `funcions`
 * (per defecte, les que creen les excloses), més les que en depenen. */
export function successorsQueRedefinixen(migrations, fitxersExclosos, { funcions = null } = {}) {
  const exclosos = new Set(fitxersExclosos);
  const primer = migrations.findIndex(m => exclosos.has(m.file));
  if (primer < 0) throw new Error('Cap migració exclosa és al pla.');
  const vigilades = new Set(funcions
    ? [...funcions].map(nom => nom.toLowerCase())
    : migrations.filter(m => exclosos.has(m.file)).flatMap(m => [...funcionsCreades(m.sql)]));
  const fora = new Set();
  for (const m of migrations.slice(primer + 1)) {
    if (exclosos.has(m.file)) continue;
    const redefinix = [...funcionsCreades(m.sql)].some(nom => vigilades.has(nom));
    const depen = dependenciesDeclarades(capcalera(m.sql), m.version).some(d => fora.has(d.versio));
    if (redefinix || depen) fora.add(m.version);
  }
  return migrations.filter(m => fora.has(m.version));
}
