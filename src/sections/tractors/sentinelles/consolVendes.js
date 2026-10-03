/**
 * consolVendes.js — Sentinella 3 · Cònsol de Vendes.
 *
 * En obrir el Tauler, llig els tancaments de torn (sdp.bar.tancament.v1) que
 * tria la persona i en fa un report en text: on es guanya i on es perd. Amb
 * els escandalls (costCents) calcula el marge de cada producte; amb tres o
 * més torns anteriors, avisa de les vendes atípiques. El TPV no s'importa: el
 * pont és el fitxer exportat. L0: no canvia preus ni carta; proposa.
 */
import { avis, esObjecte, eurosDe, fitxersTriats, llegixJson, mediana, momentDe, nomDe, percentDe, primers } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';
import { SCHEMA_TANCAMENT, validaTancament, vendesDe } from './formatsBar.js';

const LLINDARS = Object.freeze({
  margeMinim: 0.3,
  fugaMaxima: 0.05,
  historialMinim: 3,
  desviacioAtipica: 0.4,
  unitatsHabituals: 5,
  multiplicadorDisparat: 3
});

/**
 * @param {{ tancaments: Array<{ nom?: string, dades: object }> }} entrada els fitxers ja llegits
 * @param {{ ara: number }} context
 */
export function observaConsol(entrada, { ara }) {
  const avisos = [];
  const fitxers = (esObjecte(entrada) && Array.isArray(entrada.tancaments) ? entrada.tancaments : []).filter(esObjecte);
  const valids = [];
  for (const { nom, dades } of fitxers) {
    const errors = validaTancament(dades);
    if (errors.length) avisos.push(avis('CON-FORMAT', 'roja', `«${nom ?? 'el fitxer'}» no és un tancament ${SCHEMA_TANCAMENT}: ${errors[0]}`, nom ?? 'entrada'));
    else valids.push(dades);
  }
  if (!valids.length) {
    avisos.push(avis('CON-SENSE-DADES', 'roja', 'No hi ha cap tancament de torn vàlid: no hi ha res a comptar.', 'entrada'));
    return { avisos };
  }
  valids.sort((a, b) => Date.parse(a.tancatA) - Date.parse(b.tancatA));
  const actual = valids[valids.length - 1];
  const historial = valids.slice(0, -1);
  const r = actual.resum;
  const vendes = vendesDe(actual);
  const font = `torn:${actual.tornId}`;

  if (Date.parse(actual.tancatA) > ara) {
    avisos.push(avis('CON-DATA-FUTURA', 'groga', `El torn ${actual.tornId} diu que tanca el ${momentDe(actual.tancatA)}, després d’ara: revisa el rellotge del TPV.`, font));
  }

  /* On es perd i on es guanya: el marge de cada producte amb escandall. */
  const ambCost = r.perProducte.filter((p) => p.costCents !== null);
  const senseCost = r.perProducte.filter((p) => p.costCents === null);
  const marges = ambCost.map((p) => ({ ...p, marge: p.importCents - p.costCents }));
  for (const p of marges) {
    if (p.marge < 0) {
      avisos.push(avis('CON-PERD', 'roja', `«${p.nom}» s’ha venut per davall del cost: hi perds ${eurosDe(-p.marge)} en ${p.unitats} unitats.`, `producte:${p.producteId ?? p.nom}`));
    } else if (p.importCents > 0 && p.marge / p.importCents < LLINDARS.margeMinim) {
      avisos.push(avis('CON-MARGE-BAIX', 'groga', `«${p.nom}» deixa un marge del ${percentDe(p.marge / p.importCents)}, per davall del ${percentDe(LLINDARS.margeMinim)}: revisa’n el preu o l’escandall.`, `producte:${p.producteId ?? p.nom}`));
    }
  }
  if (senseCost.length) {
    avisos.push(avis('CON-SENSE-ESCANDALL', 'info', `${senseCost.length} productes sense escandall: no se sap si hi guanyes (${primers(senseCost.map((p) => p.nom), 5).join(', ')}).`, font));
  }

  /* Les fugues: descomptes, invitacions, anul·lacions i devolucions sobre el venut. */
  const fugues = r.descomptesCents + r.convidadesCents + r.anullacions.importCents + r.devolucionsCents;
  if (vendes > 0 && fugues / vendes > LLINDARS.fugaMaxima) {
    avisos.push(avis('CON-FUGUES', 'groga', `Descomptes, invitacions, anul·lacions i devolucions sumen ${eurosDe(fugues)}, el ${percentDe(fugues / vendes)} del que s’ha venut.`, font));
  }

  /* Vendes atípiques, contra la mediana dels torns anteriors. */
  if (historial.length >= LLINDARS.historialMinim) {
    const habitual = mediana(historial.map(vendesDe));
    if (habitual > 0 && Math.abs(vendes - habitual) / habitual > LLINDARS.desviacioAtipica) {
      avisos.push(avis('CON-VENDES-ATIPIQUES', 'groga', `Hui s’ha venut ${eurosDe(vendes)} i la mediana dels ${historial.length} torns anteriors és ${eurosDe(Math.round(habitual))}.`, font));
    }
    const unitatsDe = (t, clau) => t.resum.perProducte.find((p) => (p.producteId ?? p.nom) === clau)?.unitats ?? 0;
    const claus = new Set(historial.flatMap((t) => t.resum.perProducte.map((p) => p.producteId ?? p.nom)));
    for (const clau of claus) {
      const usual = mediana(historial.map((t) => unitatsDe(t, clau)));
      const avui = unitatsDe(actual, clau);
      const nom = [...historial, actual].flatMap((t) => t.resum.perProducte).find((p) => (p.producteId ?? p.nom) === clau)?.nom ?? clau;
      if (usual >= LLINDARS.unitatsHabituals && avui === 0) {
        avisos.push(avis('CON-PRODUCTE-ATURAT', 'groga', `«${nom}» sol vendre ${usual} unitats per torn i hui cap: s’ha acabat o no s’ha marcat?`, `producte:${clau}`));
      } else if (usual > 0 && avui > usual * LLINDARS.multiplicadorDisparat) {
        avisos.push(avis('CON-PRODUCTE-DISPARAT', 'info', `«${nom}» ha venut ${avui} unitats, més del triple de les habituals (${usual}).`, `producte:${clau}`));
      }
    }
  } else {
    avisos.push(avis('CON-SENSE-HISTORIAL', 'info', `Amb ${historial.length} torns anteriors no es poden detectar vendes atípiques: en calen ${LLINDARS.historialMinim}.`, font));
  }

  const guanyen = [...marges].filter((p) => p.marge > 0).sort((a, b) => b.marge - a.marge).slice(0, 3);
  const perden = [...marges].filter((p) => p.marge < 0 || (p.importCents > 0 && p.marge / p.importCents < LLINDARS.margeMinim))
    .sort((a, b) => a.marge - b.marge);
  const v = r.vendesPerMetode;
  const informe = [
    `Torn ${actual.tornId}, tancat el ${momentDe(actual.tancatA)}.`,
    `Vendes: ${eurosDe(vendes)} en ${r.tiquets} tiquets (tiquet mitjà ${eurosDe(r.tiquetMitjaCents)}). Efectiu ${eurosDe(v.efectiu)}, targeta ${eurosDe(v.targeta)}, altres ${eurosDe(v.altre)}.`,
    `Diferència de caixa: ${eurosDe(actual.diferenciaCaixaCents)}.`,
    '',
    'On es guanya:',
    ...(guanyen.length ? guanyen.map((p) => `- ${p.nom}: ${eurosDe(p.marge)} de marge (${percentDe(p.marge / p.importCents)})`) : ['- Cap producte amb escandall i marge positiu.']),
    'On es perd:',
    ...(perden.length ? perden.map((p) => `- ${p.nom}: ${eurosDe(p.marge)} de marge${p.importCents > 0 ? ` (${percentDe(p.marge / p.importCents)})` : ''}`) : ['- Cap producte per davall del marge mínim.']),
    `Fugues (descomptes, invitacions, anul·lacions i devolucions): ${eurosDe(fugues)}.`,
    '',
    'Són propostes: canviar preus, carta o escandalls ho decidixes tu al TPV.'
  ];
  return { avisos, informe: informe.join('\n') };
}

/* Cada fitxer pot portar un tancament o una llista de tancaments. */
function preparaConsol(fitxers) {
  const tancaments = fitxersTriats(fitxers).flatMap((fitxer) => {
    const dades = llegixJson(fitxer);
    return (Array.isArray(dades) ? dades : [dades]).map((d) => ({ nom: nomDe(fitxer), dades: d }));
  });
  return { tancaments };
}

export const SENTINELLA_CONSOL = definixSentinella({
  id: 'sentinella.consol-vendes',
  nom: 'Sentinella Cònsol de Vendes',
  versio: '1.0.0',
  descripcio: 'Llig els tancaments de torn del TPV i els escandalls que tries i en fa un report en text: on es guanya, on es perd i quines vendes són atípiques.',
  disparador: [
    { tipus: 'obrir-tauler', detall: 'En obrir el Tauler d’Inici, amb els tancaments exportats pel TPV.' }
  ],
  llig: ['Els tancaments de torn que tries (sdp.bar.tancament.v1): vendes per mètode, per categoria i per producte, amb el cost dels escandalls'],
  escriu: ['Res: el report només es mostra a la pantalla'],
  xarxa: 'cap',
  dadesPersonals: false,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'tauler-inici' },
  portaHumana: 'Proposa on actuar; canviar preus, carta o escandalls ho decidix i ho fa la persona al TPV.',
  proves: ['src/sections/tractors/sentinelles/consolVendes.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_consol_vendes.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/consolVendes.js', 'src/sections/tractors/sentinelles/formatsBar.js'],
  entrada: {
    etiqueta: 'Tancaments de torn del TPV (JSON)',
    ajuda: 'El darrer és el que s’analitza; els anteriors fan d’historial per a les vendes atípiques.',
    accepta: '.json,application/json',
    multiple: true,
    prepara: preparaConsol
  },
  observa: observaConsol
});
