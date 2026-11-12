/**
 * Arbre Genealògic · generador de consultes per als arxius públics
 * (P0-114, grup «arxius»).
 *
 * Una consulta és el text que la persona copia al cercador d'un arxiu:
 * nom, cognoms, lloc i un interval d'anys. L'app no l'envia enlloc ni cerca
 * per ella (tractor-promesa). No hi ha operadors de cerca inventats: només
 * termes separats per comes.
 *
 * RGPD: una persona viva (idsVius, del nucli) no genera cap consulta
 * sense `incloureVius: true`, que només dona una casella explícita de la
 * vista. Els padrins, els testimonis, els progenitors i la parella vius
 * tampoc no entren com a termes de triangulació.
 *
 * Cognom ≠ Parentiu: estes funcions no creen ni deduïxen cap relació; només
 * lligen les que ja hi ha a l'arbre.
 */
import { colateralsFan, idsVius, intervalAny } from '../nucli/index.js';
import { arxiusPer } from './cataleg.js';
import { liniaNeta } from './linia.js';

export const MAX_CONSULTES = 40;
const MAX_TERMES_FAN = 6;
const MARGE_ANYS = 2;

function personaPerId(complet, id) {
  if (typeof id !== 'string' || !complet || !Array.isArray(complet.persones)) return null;
  return complet.persones.find((p) => p && p.id === id) ?? null;
}

export function nomComplet(persona) {
  if (!persona) return '';
  return [liniaNeta(persona.nom, 80), liniaNeta(persona.cognom1, 80), liniaNeta(persona.cognom2, 80)]
    .filter((tros) => tros.length > 0).join(' ');
}

function ambMarge(interval) {
  if (!interval) return null;
  return { des: interval.min - MARGE_ANYS, fins: interval.max + MARGE_ANYS };
}

function intervalDe(data) {
  if (!data) return null;
  const interval = intervalAny(data);
  if (!interval || typeof interval.min !== 'number' || typeof interval.max !== 'number') return null;
  return interval;
}

function textConsulta(termes, interval) {
  const trossos = termes.map((terme) => liniaNeta(terme, 200)).filter((tros) => tros.length > 0);
  if (interval) trossos.push(`${interval.des}-${interval.fins}`);
  return trossos.join(', ');
}

/** Els progenitors d'una persona segons les relacions 'progenitor' que ja hi ha (de: progenitor, a: fill). */
function progenitorsDe(complet, personaId) {
  const relacions = Array.isArray(complet.relacions) ? complet.relacions : [];
  return relacions.filter((r) => r && r.tipus === 'progenitor' && r.a === personaId).map((r) => r.de);
}

/**
 * Les consultes copiables d'una persona per a cada arxiu i tipus de registre.
 * @returns {{ ok: boolean, motiu: null | 'persona-viva' | 'sense-dades', consultes: Array<{ arxiuId: string, registre: string | null, text: string, interval: { des: number, fins: number } | null }> }}
 */
export function generaConsultes(complet, personaId, { anyActual, incloureVius = false } = {}) {
  const persona = personaPerId(complet, personaId);
  if (!persona) return { ok: false, motiu: 'sense-dades', consultes: [] };
  const ambVius = incloureVius === true;
  /* El conjunt de vius es calcula UNA sola vegada (un sol indexa de l'arbre):
     cridar esPersonaViva per a cada terme refaria els índexs a cada crida i,
     amb un arbre gran, el cost seria quadràtic. Sense vius (incloureVius),
     no cal calcular-lo. */
  const vius = ambVius ? null : idsVius(complet, { anyActual });
  const esViva = (p) => vius !== null && vius.has(p.id);
  if (esViva(persona)) return { ok: false, motiu: 'persona-viva', consultes: [] };

  const nom = nomComplet(persona);
  if (liniaNeta(persona.cognom1, 80) === '' && liniaNeta(persona.cognom2, 80) === '' && liniaNeta(persona.nom, 80) === '') {
    return { ok: false, motiu: 'sense-dades', consultes: [] };
  }
  const lloc = liniaNeta(persona.lloc, 120) || liniaNeta(complet.arbre?.poble, 120);

  // Persones de l'entorn que poden servir de terme: mai una de viva sense permís.
  const perId = new Map(complet.persones.filter((p) => p && typeof p.id === 'string').map((p) => [p.id, p]));
  const permesa = (id) => {
    const altra = typeof id === 'string' ? perId.get(id) : undefined;
    if (!altra || esViva(altra)) return '';
    return nomComplet(altra);
  };
  const fan = colateralsFan(complet, persona.id) || {};
  /* Es para en arribar a MAX_TERMES_FAN noms: no es recorre tota la llista. */
  const llistaFan = (ids) => {
    const noms = [];
    for (const id of Array.isArray(ids) ? ids : []) {
      if (noms.length >= MAX_TERMES_FAN) break;
      const nom = permesa(id);
      if (nom.length > 0) noms.push(nom);
    }
    return noms;
  };
  const progenitors = progenitorsDe(complet, persona.id).map(permesa).filter((n) => n.length > 0);
  const parelles = llistaFan(fan.parelles);

  const naixement = intervalDe(persona.naixement);
  const defuncio = intervalDe(persona.defuncio);
  const consultes = [];
  const vistes = new Set();
  const afig = (arxiuId, registre, termes, interval) => {
    const text = textConsulta(termes, interval);
    const clau = `${arxiuId}\u0000${registre}\u0000${text}`;
    if (text.length === 0 || vistes.has(clau) || consultes.length >= MAX_CONSULTES) return;
    vistes.add(clau);
    consultes.push(Object.freeze({ arxiuId, registre, text, interval: interval ? Object.freeze({ ...interval }) : null }));
  };

  // On és l'arxiu del poble: el Censo-guía, amb el lloc com a únic terme.
  if (lloc) afig('cens-guia', null, [lloc], null);

  const peticions = [
    { registre: 'baptisme', interval: ambMarge(naixement), termes: [nom, lloc] },
    { registre: 'matrimoni', interval: naixement ? { des: naixement.min + 14, fins: naixement.max + 50 } : null, termes: [nom, ...parelles, lloc] },
    { registre: 'defuncio', interval: ambMarge(defuncio), termes: [nom, lloc] },
    { registre: 'padro', interval: null, termes: [nom, liniaNeta(persona.casa, 80), lloc] },
    { registre: 'notarial', interval: ambMarge(defuncio), termes: [nom, lloc] },
    { registre: 'premsa', interval: ambMarge(defuncio), termes: [nom, lloc] },
    { registre: 'emigracio', interval: null, termes: [nom, lloc] }
  ];
  // Les lleves: als vint anys, aproximadament (i no s'aplica si la persona consta com a dona).
  if (naixement && persona.sexe !== 'F') {
    peticions.push({ registre: 'militar', interval: { des: naixement.min + 18, fins: naixement.max + 22 }, termes: [nom, lloc] });
  }

  for (const { registre, interval, termes } of peticions) {
    const arxius = arxiusPer({ any: interval ? interval.fins : null, registre }).filter((a) => a.id !== 'cens-guia');
    for (const arxiu of arxius) {
      // Als llibres parroquials, el baptisme porta també els progenitors com a termes de triangulació.
      const extra = arxiu.id === 'quinque-libri' && registre === 'baptisme' ? progenitors : [];
      afig(arxiu.id, registre, [...termes.slice(0, 1), ...extra, ...termes.slice(1)], interval);
    }
  }

  // FAN Club als llibres parroquials: padrins al baptisme i testimonis al matrimoni.
  for (const padri of llistaFan(fan.padrins)) afig('quinque-libri', 'baptisme', [padri, lloc], ambMarge(naixement));
  for (const testimoni of llistaFan(fan.testimonis)) {
    afig('quinque-libri', 'matrimoni', [testimoni, lloc], naixement ? { des: naixement.min + 14, fins: naixement.max + 50 } : null);
  }

  return { ok: true, motiu: null, consultes };
}
