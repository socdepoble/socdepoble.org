/**
 * cronologia.js — Arbre Genealògic · el validador matemàtic d'incoherències.
 *
 * Adapta detectaContradiccionsCronologiques del kit R111 amb dos canvis:
 *   · treballa amb l'interval de precisió de cada data: només és
 *     'contradiccio' el que és impossible fins i tot dins dels marges
 *     (~1908 o 1908? no donen contradiccions falses);
 *   · usa el model de relacions (dos progenitors, implex i cicles) en lloc
 *     d'un sol `progenitorId`.
 *
 * Alerta = { tipus, gravetat: 'contradiccio' | 'avis', personaId, altraId, valors }
 * Mai porta text: el text el fa textos.js. L'ordre és determinista.
 */
import { EDAT_MAXIMA_MARE, EDAT_MAXIMA_PROGENITOR, EDAT_MAXIMA_VIDA, EDAT_MINIMA_PROGENITOR } from './constants.js';
import { intervalAny } from './dates.js';
import { indexa } from './model.js';

export const TIPUS_CONTRADICCIO = Object.freeze([
  'defuncio-abans-naixement', 'progenitor-massa-jove', 'naixement-post-defuncio-pare',
  'naixement-post-defuncio-mare', 'vida-impossible', 'mes-de-dos-progenitors', 'cicle'
]);
export const TIPUS_AVIS = Object.freeze(['possible-generacio-omesa', 'mare-massa-gran']);

const alerta = (tipus, gravetat, personaId, altraId = null, valors = {}) => ({ tipus, gravetat, personaId, altraId, valors });

/*
 * Les persones que formen part d'un cicle d'ascendència (una persona
 * avantpassada d'ella mateixa): components fortament connexos de Tarjan, en
 * versió iterativa (sense recursió: un arbre llarg no esgota la pila).
 */
function personesEnCicle(ids, progenitorsDe) {
  const index = new Map();
  const baix = new Map();
  const enPila = new Set();
  const pila = [];
  const enCicle = new Set();
  let comptador = 0;
  for (const inici of ids) {
    if (index.has(inici)) continue;
    const treball = [[inici, 0]];
    index.set(inici, comptador);
    baix.set(inici, comptador);
    comptador += 1;
    pila.push(inici);
    enPila.add(inici);
    while (treball.length) {
      const marc = treball[treball.length - 1];
      const [node, i] = marc;
      const veins = progenitorsDe.get(node) || [];
      if (i < veins.length) {
        marc[1] = i + 1;
        const vei = veins[i];
        if (!index.has(vei)) {
          index.set(vei, comptador);
          baix.set(vei, comptador);
          comptador += 1;
          pila.push(vei);
          enPila.add(vei);
          treball.push([vei, 0]);
        } else if (enPila.has(vei)) {
          baix.set(node, Math.min(baix.get(node), index.get(vei)));
        }
        continue;
      }
      treball.pop();
      if (treball.length) {
        const pare = treball[treball.length - 1][0];
        baix.set(pare, Math.min(baix.get(pare), baix.get(node)));
      }
      if (baix.get(node) === index.get(node)) {
        const component = [];
        let membre;
        do {
          membre = pila.pop();
          enPila.delete(membre);
          component.push(membre);
        } while (membre !== node);
        if (component.length > 1) for (const m of component) enCicle.add(m);
      }
    }
  }
  return enCicle;
}

/** Totes les alertes cronològiques i estructurals de l'arbre. */
export function detectaContradiccions(complet, { anyActual } = {}) {
  if (!Number.isSafeInteger(anyActual)) throw new TypeError('Cal `anyActual` (un enter).');
  const { perId, progenitorsDe } = indexa(complet);
  const alertes = [];

  for (const persona of complet?.persones || []) {
    const naixement = intervalAny(persona.naixement);
    const defuncio = intervalAny(persona.defuncio);
    if (naixement && defuncio && defuncio.max < naixement.min) {
      alertes.push(alerta('defuncio-abans-naixement', 'contradiccio', persona.id, null, { naixement: persona.naixement.any, defuncio: persona.defuncio.any }));
    }
    if (naixement && defuncio && defuncio.min - naixement.max > EDAT_MAXIMA_VIDA) {
      alertes.push(alerta('vida-impossible', 'contradiccio', persona.id, null, { anys: defuncio.min - naixement.max }));
    } else if (naixement && persona.viva === 'si' && anyActual - naixement.max > EDAT_MAXIMA_VIDA) {
      alertes.push(alerta('vida-impossible', 'contradiccio', persona.id, null, { anys: anyActual - naixement.max }));
    }

    const progenitors = progenitorsDe.get(persona.id) || [];
    if (progenitors.length > 2) {
      alertes.push(alerta('mes-de-dos-progenitors', 'contradiccio', persona.id, null, { nombre: progenitors.length }));
    }
    if (!naixement) continue;
    for (const progenitorId of progenitors) {
      const progenitor = perId.get(progenitorId);
      const naixementProgenitor = intervalAny(progenitor.naixement);
      if (naixementProgenitor) {
        /* La diferència més gran possible ja és massa curta → impossible. */
        if (naixement.max - naixementProgenitor.min < EDAT_MINIMA_PROGENITOR) {
          alertes.push(alerta('progenitor-massa-jove', 'contradiccio', persona.id, progenitorId, { diferencia: naixement.max - naixementProgenitor.min }));
        }
        /* La diferència més curta possible ja és molt llarga → només un avís. */
        if (naixement.min - naixementProgenitor.max > EDAT_MAXIMA_PROGENITOR) {
          alertes.push(alerta('possible-generacio-omesa', 'avis', persona.id, progenitorId, { diferencia: naixement.min - naixementProgenitor.max }));
        }
        if (progenitor.sexe === 'F' && naixement.min - naixementProgenitor.max > EDAT_MAXIMA_MARE) {
          alertes.push(alerta('mare-massa-gran', 'avis', persona.id, progenitorId, { edat: naixement.min - naixementProgenitor.max }));
        }
      }
      const defuncioProgenitor = intervalAny(progenitor.defuncio);
      if (defuncioProgenitor) {
        /* La mare no pot parir després de morir; el pare, com a molt uns mesos després (fins a un any). */
        if (progenitor.sexe === 'F') {
          if (naixement.min > defuncioProgenitor.max) {
            alertes.push(alerta('naixement-post-defuncio-mare', 'contradiccio', persona.id, progenitorId, { naixement: naixement.min, defuncio: defuncioProgenitor.max }));
          }
        } else if (naixement.min > defuncioProgenitor.max + 1) {
          alertes.push(alerta('naixement-post-defuncio-pare', 'contradiccio', persona.id, progenitorId, { naixement: naixement.min, defuncio: defuncioProgenitor.max }));
        }
      }
    }
  }

  const ids = (complet?.persones || []).map((p) => p.id).sort();
  for (const personaId of [...personesEnCicle(ids, progenitorsDe)].sort()) {
    alertes.push(alerta('cicle', 'contradiccio', personaId));
  }

  return alertes.sort((x, y) => {
    if (x.personaId !== y.personaId) return x.personaId < y.personaId ? -1 : 1;
    if (x.tipus !== y.tipus) return x.tipus < y.tipus ? -1 : 1;
    const [a, b] = [x.altraId ?? '', y.altraId ?? ''];
    if (a === b) return 0;
    return a < b ? -1 : 1;
  });
}

/** L'estat que es mostra: 'contradiccio' si alguna contradicció toca la persona; si no, el seu. */
export function estatEfectiu(persona, alertes) {
  if (!persona) return 'falta-confirmar';
  const toca = (alertes || []).some((a) => a.gravetat === 'contradiccio' && (a.personaId === persona.id || a.altraId === persona.id));
  return toca ? 'contradiccio' : persona.estat;
}
