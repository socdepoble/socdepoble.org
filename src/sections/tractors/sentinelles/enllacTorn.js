/**
 * enllacTorn.js — Sentinella 6 · Enllaç del Torn.
 *
 * Quan es tanca un torn al TPV, llig la nota de traspàs (sdp.bar.traspas.v1)
 * que tria la persona i, si n'hi ha, el tancament del mateix torn
 * (sdp.bar.tancament.v1). Assenyala el que el torn següent ha de saber:
 * comandes obertes, diferència de caixa, incidències, reposició i si la nota
 * encara no s'ha llegit. L0: no cobra, no tanca comandes ni toca la caixa.
 */
import { avis, esObjecte, eurosDe, fitxersTriats, llegixJson, momentDe, nomDe, textPle } from './comu.js';
import { ErrorSentinella, FONTS_COMUNES, definixSentinella } from './contracte.js';
import { SCHEMA_TANCAMENT, SCHEMA_TRASPAS, validaTancament, validaTraspas } from './formatsBar.js';

const LLINDARS = Object.freeze({ diferenciaRojaCents: 2000, horesNotaAntiga: 24 });
const HORA_MS = 3600000;
const ETIQUETES_INCIDENCIA = Object.freeze({
  anullacions: ['ENL-ANULLACIONS', 'Anul·lacions'],
  devolucions: ['ENL-DEVOLUCIONS', 'Devolucions'],
  convidades: ['ENL-CONVIDADES', 'Invitacions']
});

const origenDe = (c) => (c.origen.tipus === 'taula' && c.origen.taulaId !== undefined ? `taula ${c.origen.taulaId}` : c.origen.tipus);

/**
 * @param {{ traspas: object|null, tancament?: object|null }} entrada
 * @param {{ ara: number }} context
 */
export function observaEnllac(entrada, { ara }) {
  const avisos = [];
  const e = esObjecte(entrada) ? entrada : {};
  const t = e.traspas;
  if (!esObjecte(t)) {
    avisos.push(avis('ENL-SENSE-NOTA', 'roja', `No hi ha cap nota de traspàs (${SCHEMA_TRASPAS}): el torn següent comença a cegues.`, 'entrada'));
    return { avisos };
  }
  const errors = validaTraspas(t);
  if (errors.length) {
    avisos.push(avis('ENL-FORMAT', 'roja', `La nota de traspàs no és ${SCHEMA_TRASPAS}: ${errors[0]}`, 'traspas'));
    return { avisos };
  }
  const font = `torn:${t.tornId}`;

  if (!textPle(t.llegidaPer)) {
    avisos.push(avis('ENL-NO-LLEGIDA', 'groga', 'Ningú del torn següent ha marcat la nota com a llegida.', font));
  }
  if (ara - Date.parse(t.tancatA) > LLINDARS.horesNotaAntiga * HORA_MS) {
    avisos.push(avis('ENL-NOTA-ANTIGA', 'info', `La nota és del ${momentDe(t.tancatA)}: fa més de ${LLINDARS.horesNotaAntiga} hores.`, font));
  }

  const obertes = t.comandesObertes;
  if (obertes.length) {
    const total = obertes.reduce((s, c) => s + c.totalCents, 0);
    avisos.push(avis('ENL-COMANDES-OBERTES', 'groga', `${obertes.length} comandes obertes per ${eurosDe(total)}: cobra-les o deixa-les clares abans de començar.`, font));
  }

  const caixa = t.incidencies.filter((i) => i.tipus === 'diferencia-caixa').reduce((s, i) => s + i.importCents, 0);
  if (caixa !== 0) {
    avisos.push(avis('ENL-DIFERENCIA-CAIXA', Math.abs(caixa) >= LLINDARS.diferenciaRojaCents ? 'roja' : 'groga',
      `La caixa no quadra: ${caixa > 0 ? 'en sobren' : 'en falten'} ${eurosDe(Math.abs(caixa))}.`, font));
  }
  for (const [tipus, [codi, etiqueta]] of Object.entries(ETIQUETES_INCIDENCIA)) {
    const propies = t.incidencies.filter((i) => i.tipus === tipus);
    if (propies.length) {
      const total = propies.reduce((s, i) => s + i.importCents, 0);
      avisos.push(avis(codi, 'groga', `${etiqueta}: ${propies.length} (${eurosDe(total)}). El detall és a l’informe.`, font));
    }
  }

  if (t.fonsDeixatCents < 0) avisos.push(avis('ENL-FONS-INVALID', 'roja', 'El fons de caixa deixat és negatiu: la nota no és fiable.', font));
  else if (t.fonsDeixatCents === 0) avisos.push(avis('ENL-SENSE-FONS', 'groga', 'No s’ha deixat fons de caixa: el torn següent comença sense canvi.', font));

  if (t.reposicio.length) {
    avisos.push(avis('ENL-REPOSICIO', 'info', `${t.reposicio.length} productes per reposar.`, font));
  }
  t.avisos.forEach((text, i) => {
    if (textPle(text)) avisos.push(avis('ENL-AVIS', 'info', text.trim(), `${font}:avisos[${i}]`));
  });

  /* El tancament del mateix torn, si n'hi ha: la caixa ha de dir el mateix a tots dos llocs. */
  if (e.tancament !== undefined && e.tancament !== null) {
    const errorsTancament = validaTancament(e.tancament);
    if (errorsTancament.length) {
      avisos.push(avis('ENL-TANCAMENT-FORMAT', 'groga', `El tancament no és ${SCHEMA_TANCAMENT}: ${errorsTancament[0]}`, 'tancament'));
    } else if (e.tancament.tornId !== t.tornId) {
      avisos.push(avis('ENL-TORN-DIFERENT', 'groga', `El tancament és del torn ${e.tancament.tornId} i la nota, del ${t.tornId}.`, 'tancament'));
    } else if (e.tancament.diferenciaCaixaCents !== caixa) {
      avisos.push(avis('ENL-INCOHERENT', 'groga', `El tancament diu una diferència de caixa de ${eurosDe(e.tancament.diferenciaCaixaCents)} i la nota, de ${eurosDe(caixa)}.`, 'tancament'));
    }
  }

  const informe = [
    `Nota de traspàs del torn ${t.tornId}, tancat el ${momentDe(t.tancatA)}${textPle(t.de) ? ` per ${t.de}` : ''}.`,
    `Fons de caixa deixat: ${eurosDe(t.fonsDeixatCents)}.`,
    `Llegida: ${textPle(t.llegidaPer) ? `sí, per ${t.llegidaPer}${t.llegidaA ? ` el ${momentDe(t.llegidaA)}` : ''}` : 'encara no'}.`,
    '',
    `Comandes obertes (${obertes.length}):`,
    ...obertes.map((c) => `- ${origenDe(c)}: ${eurosDe(c.totalCents)}`),
    `Incidències (${t.incidencies.length}):`,
    ...t.incidencies.map((i) => `- ${i.tipus}: ${eurosDe(i.importCents)}${textPle(i.detall) ? `, ${i.detall.trim()}` : ''}`),
    `Per reposar (${t.reposicio.length}):`,
    ...t.reposicio.map((p) => `- ${p.nom}: ${p.unitats}`),
    '',
    'El sentinella no cobra, no tanca comandes ni toca la caixa: ho fa el torn següent.'
  ];
  return { avisos, informe: informe.join('\n') };
}

/* Un o dos fitxers: la nota de traspàs i, si de cas, el tancament del torn. */
function preparaEnllac(fitxers) {
  const entrada = { traspas: null, tancament: null };
  for (const fitxer of fitxersTriats(fitxers)) {
    const dades = llegixJson(fitxer);
    const clau = dades?.schema === SCHEMA_TANCAMENT ? 'tancament' : 'traspas';
    if (entrada[clau] !== null) {
      throw new ErrorSentinella('ENTRADA_INVALIDA', `«${nomDe(fitxer)}» és ${clau === 'tancament' ? 'un segon tancament' : 'una segona nota'}: tria només la nota del torn i, si vols, el seu tancament.`);
    }
    entrada[clau] = dades;
  }
  return entrada;
}

export const SENTINELLA_ENLLAC = definixSentinella({
  id: 'sentinella.enllac-torn',
  nom: 'Sentinella Enllaç del Torn',
  versio: '1.0.0',
  descripcio: 'Llig la nota de traspàs del torn que tanca (i el tancament, si el tries) i assenyala comandes obertes, diferències de caixa, incidències i si la nota no s’ha llegit.',
  disparador: [
    { tipus: 'tancament-torn', detall: 'En tancar un torn al TPV, amb la nota de traspàs exportada.' }
  ],
  llig: ['La nota de traspàs que tries (sdp.bar.traspas.v1) i, si vols, el tancament del mateix torn (sdp.bar.tancament.v1)'],
  escriu: ['Res: la nota per al torn següent només es mostra a la pantalla'],
  xarxa: 'cap',
  dadesPersonals: true,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'departament', departaments: ['TPV'] },
  portaHumana: 'Assenyala el que cal mirar; cobrar, tancar comandes o quadrar la caixa ho fa la persona del torn següent.',
  proves: ['src/sections/tractors/sentinelles/enllacTorn.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_enllac_torn.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/enllacTorn.js', 'src/sections/tractors/sentinelles/formatsBar.js'],
  entrada: {
    etiqueta: 'Nota de traspàs del torn (JSON)',
    ajuda: 'Pots afegir-hi el tancament del mateix torn per a comprovar que la caixa quadra als dos llocs.',
    accepta: '.json,application/json',
    multiple: true,
    prepara: preparaEnllac
  },
  observa: observaEnllac
});
